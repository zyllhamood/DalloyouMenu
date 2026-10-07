import { api } from './api';
import { normalizeArabic } from './menu';

/**
 * The in-store tablet menu (dalloyou.com/ipad), edited from /admin/ipad.
 *
 * An iPad item usually points at a website product: its name, price and
 * availability come from that product, and the iPad adds only its own
 * category, order, English name and photos. `resolved` is computed by the
 * API with the same code the tablets use, so the admin preview is exact.
 */

export type IpadHiddenReason = 'hidden' | 'unavailable' | 'no_name' | null;

export interface IpadResolved {
  name: string;
  en: string;
  size: string;
  price: number | null;
  /** The struck-through price when the website product is discounted. */
  was: number | null;
  image: string | null;
  detail_image: string | null;
  hidden_reason: IpadHiddenReason;
}

export interface IpadItem {
  id: number;
  category_id: number;
  product_id: number | null;
  /** Only for tablet-only items (no product). */
  name_ar: string;
  price: number | null;
  name_en: string;
  size_label: string;
  image: string | null;
  image_path: string | null;
  detail_image: string | null;
  detail_image_path: string | null;
  order: number;
  is_visible: boolean;
  resolved: IpadResolved;
}

export interface IpadCategory {
  id: number;
  name_ar: string;
  name_en: string;
  order: number;
  is_visible: boolean;
  items: IpadItem[];
}

export interface IpadGalleryImage {
  id: number;
  image: string;
  image_path: string | null;
  order: number;
}

export interface IpadSettings {
  idle_seconds: number;
  location: string;
  currency: string;
  gallery_title_ar: string;
  gallery_title_en: string;
  gallery_visible: boolean;
}

export interface IpadProductChoice {
  id: number;
  name_ar: string;
  category: { id: number; slug: string; name_ar: string; name_en: string };
  base_price: number | null;
  discount_price: number | null;
  is_available: boolean;
  size_label: string;
  display_image_path: string | null;
}

export interface IpadAdminData {
  settings: IpadSettings;
  categories: IpadCategory[];
  gallery: IpadGalleryImage[];
  products: IpadProductChoice[];
}

export const IPAD_QUERY_KEY = ['admin.ipad'] as const;

/** Where the tablets open the menu (same site as the admin in production). */
export const IPAD_SITE_URL: string = import.meta.env.VITE_IPAD_URL ?? '/ipad/';

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type Wire<T, K extends keyof T> = Omit<T, K> & { [P in K]: unknown };

function normaliseItem(item: Wire<IpadItem, 'price'>): IpadItem {
  return { ...item, price: toNumber(item.price) };
}

// ─── Endpoints ────────────────────────────────────────────────────────────

export async function fetchIpadAdmin(): Promise<IpadAdminData> {
  const { data } = await api.get<
    Omit<IpadAdminData, 'categories' | 'products'> & {
      categories: Array<Omit<IpadCategory, 'items'> & { items: Array<Wire<IpadItem, 'price'>> }>;
      products: Array<Wire<IpadProductChoice, 'base_price' | 'discount_price'>>;
    }
  >('/admin/ipad/');
  return {
    ...data,
    categories: data.categories.map((c) => ({ ...c, items: c.items.map(normaliseItem) })),
    products: data.products.map((p) => ({
      ...p,
      base_price: toNumber(p.base_price),
      discount_price: toNumber(p.discount_price),
    })),
  };
}

const progressHandler = (onProgress?: (pct: number) => void) =>
  onProgress
    ? (e: { loaded: number; total?: number }) =>
        onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0)
    : undefined;

export async function ipadItemSave(
  id: number | null,
  payload: FormData,
  onProgress?: (pct: number) => void,
): Promise<IpadItem> {
  const config = { onUploadProgress: progressHandler(onProgress) };
  const { data } = id
    ? await api.patch<Wire<IpadItem, 'price'>>(`/admin/ipad/items/${id}/`, payload, config)
    : await api.post<Wire<IpadItem, 'price'>>('/admin/ipad/items/', payload, config);
  return normaliseItem(data);
}

export async function ipadItemPatch(
  id: number,
  payload: Partial<Pick<IpadItem, 'is_visible' | 'category_id'>>,
): Promise<void> {
  await api.patch(`/admin/ipad/items/${id}/`, payload);
}

export async function ipadItemDelete(id: number): Promise<void> {
  await api.delete(`/admin/ipad/items/${id}/`);
}

export async function ipadItemsReorder(ids: number[]): Promise<void> {
  await api.post('/admin/ipad/items/reorder/', { ids });
}

export type IpadCategoryInput = Partial<Pick<IpadCategory, 'name_ar' | 'name_en' | 'is_visible'>>;

export async function ipadCategoryCreate(payload: IpadCategoryInput): Promise<void> {
  await api.post('/admin/ipad/categories/', payload);
}

export async function ipadCategoryUpdate(id: number, payload: IpadCategoryInput): Promise<void> {
  await api.patch(`/admin/ipad/categories/${id}/`, payload);
}

export async function ipadCategoryDelete(id: number): Promise<void> {
  await api.delete(`/admin/ipad/categories/${id}/`);
}

export async function ipadCategoriesReorder(ids: number[]): Promise<void> {
  await api.post('/admin/ipad/categories/reorder/', { ids });
}

export async function ipadGalleryUpload(file: File): Promise<void> {
  const fd = new FormData();
  fd.append('image', file);
  await api.post('/admin/ipad/gallery/', fd);
}

export async function ipadGalleryDelete(id: number): Promise<void> {
  await api.delete(`/admin/ipad/gallery/${id}/`);
}

export async function ipadSettingsUpdate(payload: Partial<IpadSettings>): Promise<IpadSettings> {
  const { data } = await api.patch<IpadSettings>('/admin/ipad/settings/', payload);
  return data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Website products that are available but not on the tablets yet. */
export function productsNotOnIpad(data: IpadAdminData): IpadProductChoice[] {
  const onIpad = new Set<number>();
  data.categories.forEach((c) => c.items.forEach((i) => i.product_id && onIpad.add(i.product_id)));
  return data.products.filter((p) => p.is_available && !onIpad.has(p.id));
}

/**
 * The iPad category a website product most likely belongs in: the one named
 * like its website category ("كيك" → "كيك"), if there is one.
 */
export function suggestCategory(data: IpadAdminData, productId: number | null | undefined): number | null {
  const product = data.products.find((p) => p.id === productId);
  if (!product) return null;
  const wanted = normalizeArabic(product.category.name_ar || product.category.name_en);
  return data.categories.find((c) => normalizeArabic(c.name_ar) === wanted)?.id ?? null;
}

/** The price a customer pays for a website product, and the struck one. */
export function productPrice(p: Pick<IpadProductChoice, 'base_price' | 'discount_price'>): {
  price: number | null;
  was: number | null;
} {
  const { base_price: base, discount_price: sale } = p;
  const onSale = sale !== null && base !== null && sale > 0 && sale < base;
  return { price: onSale ? sale : base, was: onSale ? base : null };
}

/** Moves the item with `activeId` to where `overId` is (dnd-kit drop). */
export function moveById<T extends { id: number }>(list: T[], activeId: number, overId: number): T[] {
  const from = list.findIndex((x) => x.id === activeId);
  const to = list.findIndex((x) => x.id === overId);
  if (from < 0 || to < 0 || from === to) return list;
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
