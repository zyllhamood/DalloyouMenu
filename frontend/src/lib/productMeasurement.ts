import type { Product, VariantSize } from './api';

export const SIZE_OPTIONS: VariantSize[] = ['SMALL', 'MEDIUM', 'LARGE'];

export function sizeToKey(size: VariantSize | null | undefined): 'small' | 'medium' | 'large' {
  return (size ?? 'LARGE').toLowerCase() as 'small' | 'medium' | 'large';
}

export function getMeasurementLabel(
  product: Pick<Product, 'size_mode' | 'size' | 'weight_label'>,
  t: (key: string) => string,
): string {
  if (product.size_mode === 'WEIGHT') return product.weight_label || '';
  return t(`sizes.${sizeToKey(product.size)}`);
}
