import { forwardRef, useMemo, useState } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

import type { Product } from '../../lib/api';
import { productImageSource, type ProductImageKind } from '../../lib/images';
import { displayName } from '../../lib/menu';

type Status = 'loading' | 'ready' | 'fallback' | 'fallbackReady';

interface ProductImageProps extends Omit<HTMLMotionProps<'img'>, 'src' | 'srcSet' | 'sizes'> {
  product: Product;
  kind?: ProductImageKind;
  /** The `sizes` attribute — how wide the image renders at each breakpoint. */
  sizes: string;
  eager?: boolean;
  fit?: 'contain' | 'cover';
  widths?: number[];
  /** Width of the `src` used by browsers without srcset support. */
  baseWidth?: number;
}

/**
 * A product photo served as a sized WebP thumbnail, faded in once decoded.
 * It renders a `motion.img` so callers can animate the image directly.
 */
export const ProductImage = forwardRef<HTMLImageElement, ProductImageProps>(function ProductImage(
  {
    product,
    kind = 'display',
    sizes,
    eager = false,
    fit = 'cover',
    widths,
    baseWidth,
    className,
    style,
    alt,
    ...rest
  },
  ref,
) {
  const source = useMemo(
    () => productImageSource(product, kind, { widths, width: baseWidth }),
    [product, kind, widths, baseWidth],
  );
  const [status, setStatus] = useState<Status>('loading');

  if (!source) return null;

  const fallback = status === 'fallback' || status === 'fallbackReady';
  const loaded = status === 'ready' || status === 'fallbackReady';
  const animated = rest.animate !== undefined || rest.initial !== undefined;

  return (
    <motion.img
      ref={ref}
      src={fallback ? source.original : source.src}
      srcSet={fallback ? undefined : source.srcSet}
      sizes={fallback || !source.srcSet ? undefined : sizes}
      alt={alt ?? displayName(product)}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      draggable={false}
      onLoad={() => setStatus((s) => (s === 'fallback' ? 'fallbackReady' : s === 'loading' ? 'ready' : s))}
      onError={() => setStatus((s) => (s === 'loading' || s === 'ready' ? 'fallback' : s))}
      className={className}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: fit,
        userSelect: 'none',
        ...(animated
          ? null
          : {
              opacity: loaded ? 1 : 0,
              // transform is listed so hover lifts (set by parents' CSS) glide too
              transition: 'opacity 700ms var(--dy-ease), transform 1200ms var(--dy-ease)',
            }),
        ...style,
      }}
      {...rest}
    />
  );
});

export default ProductImage;
