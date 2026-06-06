import type { Product } from './api';

export function getPrimaryProductImage(
  product: Pick<Product, 'display_image' | 'styled_image'>,
): string | null {
  return product.styled_image ?? product.display_image ?? null;
}
