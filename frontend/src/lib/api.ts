import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import { getAuthToken, getRefreshToken, useAuthStore } from '../stores/authStore';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // When sending FormData the browser must set Content-Type so it can include
  // the multipart boundary. Delete any pre-set application/json default.
  if (config.data instanceof FormData) {
    delete (config.headers as Record<string, string>)['Content-Type'];
  }
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await axios.post<{ access: string; refresh?: string }>(
      `${baseURL}/auth/refresh/`,
      { refresh },
      { headers: { 'Content-Type': 'application/json' } },
    );
    const newAccess = res.data.access;
    const newRefresh = res.data.refresh ?? refresh;
    useAuthStore.getState().setTokens({ token: newAccess, refreshToken: newRefresh });
    return newAccess;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      refreshInFlight = refreshInFlight ?? refreshAccessToken();
      const newToken = await refreshInFlight;
      refreshInFlight = null;

      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }

      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);

// ─── Types ─────────────────────────────────────────────────────────────────
// All fields match the Django/DRF snake_case JSON shape exactly.

export interface Category {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  image?: string | null;
  order?: number;
  is_active?: boolean;
}

export type SizeKey = 'small' | 'medium' | 'large';

export interface ProductSize {
  id: number;
  size: SizeKey;
  price: number;       // normalised to Number at the API boundary
  currency?: string;
  is_available?: boolean;
  image?: string | null;
}

export interface Product {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  // description / sizes only present on the detail endpoint
  description_en?: string;
  description_ar?: string;
  category: Category;
  display_image: string | null;
  styled_image: string | null;
  gallery?: string[];
  sizes?: ProductSize[];  // absent on list responses; normalised from `variants` on detail
  base_price: number;     // normalised to Number at the API boundary (wire sends string)
  starting_price: number;
  currency?: string;
  is_featured: boolean;
  is_new?: boolean;
  is_available: boolean;
}

export interface Paginated<T> {
  results: T[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

export interface ProductListParams {
  category?: string;
  search?: string;
  featured?: boolean;
  isNew?: boolean;
  isAvailable?: boolean;
  page?: number;
  pageSize?: number;
  limit?: number;
  ordering?: string;
}

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  access: string;
  refresh: string;
  user: { id: number | string; email: string; name?: string };
}

// ─── Endpoints ────────────────────────────────────────────────────────────

export const categoriesList = async (): Promise<Category[]> => {
  const { data } = await api.get<Category[] | Paginated<Category>>('/categories/');
  return Array.isArray(data) ? data : data.results;
};

function normaliseListProduct(p: any): Product {
  return { ...p, base_price: Number(p.base_price) };
}

export const productsList = async (params: ProductListParams = {}): Promise<Paginated<Product>> => {
  const { data } = await api.get<Paginated<any>>('/products/', {
    params: {
      category: params.category,
      search: params.search,
      featured: params.featured,
      is_new: params.isNew,
      page: params.page,
      page_size: params.pageSize,
      limit: params.limit,
      ordering: params.ordering,
    },
  });
  return { ...data, results: data.results.map(normaliseListProduct) };
};

export const productDetail = async (id: number | string): Promise<Product> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await api.get<any>(`/products/${id}/`);
  // Normalise the wire format to our internal shape:
  //  - Django sends `variants` (not `sizes`)
  //  - size keys are uppercase ("SMALL") — we use lowercase SizeKey
  //  - prices arrive as decimal strings ("10.00")
  const sizes: ProductSize[] = (data.variants ?? []).map((v: any) => ({
    ...v,
    size: (v.size as string).toLowerCase() as SizeKey,
    price: Number(v.price),
  }));
  return {
    ...data,
    sizes,
    base_price: Number(data.base_price),
  } as Product;
};

export const featuredProducts = async (): Promise<Product[]> => {
  const { data } = await api.get<any[] | Paginated<any>>('/products/featured/');
  const raw = Array.isArray(data) ? data : data.results;
  return raw.map(normaliseListProduct);
};

export const adminLogin = async (payload: AdminLoginPayload): Promise<AdminLoginResponse> => {
  const { data } = await api.post<AdminLoginResponse>('/auth/login/', payload);
  return data;
};

export const adminMe = async () => {
  const { data } = await api.get<AdminLoginResponse['user']>('/auth/me/');
  return data;
};

export type ProductWriteInput = Omit<Partial<Product>, 'id' | 'category'> & {
  categoryId?: number;
};

export const productCreate = async (
  payload: FormData | ProductWriteInput,
  onProgress?: (pct: number) => void,
): Promise<Product> => {
  const { data } = await api.post<Product>('/admin/products/', payload, {
    onUploadProgress: onProgress
      ? (e) => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0)
      : undefined,
  });
  return data;
};

export const productUpdate = async (
  id: number | string,
  payload: FormData | ProductWriteInput,
  onProgress?: (pct: number) => void,
): Promise<Product> => {
  const { data } = await api.patch<Product>(`/admin/products/${id}/`, payload, {
    onUploadProgress: onProgress
      ? (e) => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0)
      : undefined,
  });
  return data;
};

/** Patch just the toggle fields (featured / available) quickly. */
export const productPatch = async (
  id: number | string,
  payload: { is_featured?: boolean; is_available?: boolean },
): Promise<Product> => {
  const { data } = await api.patch<Product>(`/admin/products/${id}/`, payload);
  return data;
};

export const productDelete = async (id: number | string): Promise<void> => {
  await api.delete(`/admin/products/${id}/`);
};

export interface CategoryWriteInput {
  name_en?: string;
  name_ar?: string;
  slug?: string;
  order?: number;
  is_active?: boolean;
}

export const categoryCreate = async (payload: CategoryWriteInput): Promise<Category> => {
  const { data } = await api.post<Category>('/admin/categories/', payload);
  return data;
};

export const categoryUpdate = async (
  id: number | string,
  payload: CategoryWriteInput,
): Promise<Category> => {
  const { data } = await api.patch<Category>(`/admin/categories/${id}/`, payload);
  return data;
};

export const categoryDelete = async (id: number | string): Promise<void> => {
  await api.delete(`/admin/categories/${id}/`);
};

export const adminProductsList = async (
  params: ProductListParams = {},
): Promise<Paginated<Product>> => {
  const { data } = await api.get<Paginated<any>>('/admin/products/', {
    params: {
      category: params.category,
      search: params.search,
      featured: params.featured,
      is_new: params.isNew,
      is_available: params.isAvailable,
      page: params.page,
      page_size: params.pageSize ?? 20,
      limit: params.limit,
      ordering: params.ordering,
    },
  });
  return { ...data, results: data.results.map(normaliseListProduct) };
};

export default api;
