import { API_BASE_URL, type Product } from './api';

/**
 * Product images come from the API as full-size originals (1–3 MB each).
 * When the menu endpoint supplies a storage path we request sized WebP
 * variants from `/api/img/<path>?w=` instead and let the browser choose one
 * through `srcset`; the original stays as the error fallback.
 */

export type ProductImageKind = 'display' | 'styled';

export interface ImageSource {
  src: string;
  srcSet?: string;
  /** The untouched original — used if a thumbnail fails to load. */
  original: string;
}

const DEFAULT_WIDTHS = [320, 640, 960, 1280];

function encodeStoragePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

export function productImageSource(
  product: Pick<Product, 'display_image' | 'styled_image' | 'display_image_path' | 'styled_image_path'>,
  kind: ProductImageKind,
  { widths = DEFAULT_WIDTHS, width = 640 }: { widths?: number[]; width?: number } = {},
): ImageSource | null {
  // Products carry a single photo now, so a request for the kind that is
  // missing falls back to the one that exists rather than rendering nothing.
  const wanted = kind === 'display' ? product.display_image : product.styled_image;
  const resolved: ProductImageKind = wanted ? kind : kind === 'display' ? 'styled' : 'display';
  const original = resolved === 'display' ? product.display_image : product.styled_image;
  const path = resolved === 'display' ? product.display_image_path : product.styled_image_path;
  if (!original) return null;
  if (!path) return { src: original, original };

  const base = `${API_BASE_URL}/img/${encodeStoragePath(path)}`;
  return {
    src: `${base}?w=${width}`,
    srcSet: widths.map((w) => `${base}?w=${w} ${w}w`).join(', '),
    original,
  };
}

/**
 * An upload's file name without folders, extensions, or the random
 * `_XXXXXXX` suffix Django adds when a name is already taken. Django inserts
 * that suffix before the *first* dot, so the stem is cut there.
 */
function uploadStem(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  let name = pathOrUrl.split('?')[0].split('/').pop() ?? '';
  try {
    name = decodeURIComponent(name);
  } catch {
    // keep the raw name
  }
  return name.split('.')[0].replace(/_[A-Za-z0-9]{7}$/, '').toLowerCase();
}

/**
 * True when the second ("styled") image is a genuinely different photo. The
 * owner currently uploads the same file to both fields, so the gallery only
 * offers a second slide once a distinct photo is added.
 */
export function hasDistinctStyledImage(
  product: Pick<Product, 'display_image' | 'styled_image' | 'display_image_path' | 'styled_image_path'>,
): boolean {
  if (!product.styled_image || !product.display_image) return false;
  const main = uploadStem(product.display_image_path ?? product.display_image);
  const styled = uploadStem(product.styled_image_path ?? product.styled_image);
  return main !== styled;
}

/** The cut-out when there is one, otherwise the styled photograph. */
export function primaryKind(product: Pick<Product, 'display_image'>): ProductImageKind {
  return product.display_image ? 'display' : 'styled';
}
