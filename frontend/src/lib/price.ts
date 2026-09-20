import type { Product } from './api';

/**
 * Pricing with an optional sale price.
 *
 * `discount_price` is what the customer pays when it is set and below
 * `base_price`; otherwise there is no discount and `base_price` stands alone.
 */

type Priced = Pick<Product, 'base_price' | 'discount_price'>;

export function hasDiscount(product: Priced): boolean {
  const sale = product.discount_price;
  return (
    sale !== null &&
    sale !== undefined &&
    Number.isFinite(sale) &&
    sale > 0 &&
    Number.isFinite(product.base_price) &&
    sale < product.base_price
  );
}

/** What the customer pays. */
export function effectivePrice(product: Priced): number {
  return hasDiscount(product) ? (product.discount_price as number) : product.base_price;
}

/** The struck-through price, or null when there is no discount. */
export function originalPrice(product: Priced): number | null {
  return hasDiscount(product) ? product.base_price : null;
}

/** Whole-number percentage off, e.g. 20 for 100 → 80. */
export function discountPercent(product: Priced): number {
  if (!hasDiscount(product)) return 0;
  const off = (1 - (product.discount_price as number) / product.base_price) * 100;
  return Math.max(1, Math.round(off));
}
