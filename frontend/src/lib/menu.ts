import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchMenu, type MenuCategory, type MenuData, type Product } from './api';
import { sizeToKey } from './productMeasurement';

export const MENU_QUERY_KEY = ['menu'] as const;

/** The whole catalogue, fetched once and shared by every storefront page. */
export function useMenu() {
  return useQuery<MenuData>({
    queryKey: MENU_QUERY_KEY,
    queryFn: fetchMenu,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

export interface MenuIndex {
  categories: MenuCategory[];
  products: Product[];
  byId: Map<number, Product>;
  byCategory: Map<number, Product[]>;
  featured: Product[];
  fresh: Product[];
}

export function buildMenuIndex(data: MenuData | undefined): MenuIndex {
  const categories = data?.categories ?? [];
  const products = data?.products ?? [];
  const byId = new Map<number, Product>();
  const byCategory = new Map<number, Product[]>();
  categories.forEach((c) => byCategory.set(c.id, []));
  products.forEach((p) => {
    byId.set(p.id, p);
    byCategory.get(p.category.id)?.push(p);
  });
  return {
    categories: categories.filter((c) => (byCategory.get(c.id)?.length ?? 0) > 0),
    products,
    byId,
    byCategory,
    featured: products.filter((p) => p.is_featured),
    fresh: products.filter((p) => p.is_new),
  };
}

/** Same category first, then the house favourites from elsewhere. */
export function relatedProducts(index: MenuIndex, product: Product, limit = 8): Product[] {
  const sameCategory = (index.byCategory.get(product.category.id) ?? []).filter((p) => p.id !== product.id);
  const others = index.products.filter(
    (p) => p.category.id !== product.category.id && (p.is_featured || p.is_new),
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export function useMenuIndex() {
  const query = useMenu();
  const index = useMemo(() => buildMenuIndex(query.data), [query.data]);
  return { ...query, index };
}

// ─── Names & measurements ─────────────────────────────────────────────────

const SIZE_SUFFIX = /\s*[-–—]\s*(?:حجم\s+)?(صغير|وسط|متوسط|كبير)\s*$/;
const SUFFIX_SIZE: Record<string, Product['size']> = {
  صغير: 'SMALL',
  وسط: 'MEDIUM',
  متوسط: 'MEDIUM',
  كبير: 'LARGE',
};

/**
 * The product's name without a trailing "- حجم وسط" when that suffix merely
 * repeats the product's own size — the size is shown as its own chip. A
 * suffix that disagrees with the size field is left untouched.
 */
export function displayName(product: Pick<Product, 'name_ar' | 'name_en' | 'size_mode' | 'size'>): string {
  const name = (product.name_ar || product.name_en || '').trim();
  const match = name.match(SIZE_SUFFIX);
  if (!match || match.index === undefined || product.size_mode !== 'SIZE' || !product.size) return name;
  return SUFFIX_SIZE[match[1]] === product.size ? name.slice(0, match.index).trim() : name;
}

export function categoryName(category: Pick<MenuCategory, 'name_ar' | 'name_en'>): string {
  return category.name_ar || category.name_en;
}

/** "حجم وسط" / "180 جرام" / "" */
export function measurementText(
  product: Pick<Product, 'size_mode' | 'size' | 'weight_label'>,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (product.size_mode === 'WEIGHT') return product.weight_label?.trim() || '';
  if (!product.size) return '';
  return t('product.sizeLabel', { size: t(`sizes.${sizeToKey(product.size)}`) });
}

export function productDescription(product: Pick<Product, 'description_ar' | 'description_en'>): string {
  return (product.description_ar || product.description_en || '').trim();
}

// ─── Search ───────────────────────────────────────────────────────────────

const HARAKAT = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

/** Folds the spelling variants people actually type (أ/إ/آ, ة/ه, ى/ي, tashkeel, tatweel). */
export function normalizeArabic(value: string): string {
  return value
    .toLowerCase()
    .replace(HARAKAT, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Consonant skeleton — matches "شوكولاتة" with "شوكلاتة" and "بيستاشيو" with "بستاشيو". */
function skeleton(word: string): string {
  return word.replace(/^ال/, '').replace(/[اويه]/g, '');
}

export function searchHaystack(product: Product): string {
  return normalizeArabic(
    [
      product.name_ar,
      product.name_en,
      product.description_ar,
      product.description_en,
      product.category?.name_ar,
      product.category?.name_en,
      product.weight_label,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

export function matchesSearch(haystack: string, query: string): boolean {
  const tokens = normalizeArabic(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return true;
  const words = haystack.split(' ');
  const skeletons = words.map(skeleton);
  return tokens.every((token) => {
    if (haystack.includes(token)) return true;
    const bare = token.replace(/^ال/, '');
    if (bare.length >= 2 && haystack.includes(bare)) return true;
    const sk = skeleton(token);
    return sk.length >= 3 && skeletons.some((w) => w.includes(sk));
  });
}
