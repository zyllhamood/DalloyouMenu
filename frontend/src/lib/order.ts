import type { Product } from './api';
import { formatAmount } from './format';
import { displayName } from './menu';
import { effectivePrice, originalPrice } from './price';
import { createWhatsAppUrl, productOrderMessage } from '../config/links';

export function productUrl(product: Pick<Product, 'id'>): string {
  return `${window.location.origin}/product/${product.id}`;
}

/** wa.me link with the product, its size, price and page link pre-filled. */
export function productWhatsAppUrl(product: Product, measurement: string): string {
  return createWhatsAppUrl(
    productOrderMessage({
      // The size travels separately, so use the name without its "- حجم …" suffix.
      name: displayName(product),
      measurement,
      price: formatAmount(effectivePrice(product)),
      wasPrice: formatAmount(originalPrice(product)),
      url: productUrl(product),
    }),
  );
}
