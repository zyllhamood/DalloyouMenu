import type { Product, ProductVariant } from './api';

export const SIZE_ORDER: Record<string, number> = { LARGE: 3, MEDIUM: 2, SMALL: 1 };

function getLargestVariantImage(variants: ProductVariant[] = []): string | null {
  const available = variants.filter((v) => v.is_available && v.image);
  const pool = available.length ? available : variants.filter((v) => v.image);
  if (!pool.length) return null;
  return [...pool].sort(
    (a, b) => (SIZE_ORDER[b.size] ?? 0) - (SIZE_ORDER[a.size] ?? 0),
  )[0].image;
}

export function getPrimaryVariantImage(
  product: Pick<Product, 'variants' | 'styled_image'>,
): string | null {
  const variants = product.variants ?? [];
  return getLargestVariantImage(variants) ?? product.styled_image ?? null;
}
