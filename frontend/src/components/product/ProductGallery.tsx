import { lazy, Suspense, useRef, useState } from 'react';
import { Box, Button, HStack, IconButton } from '@chakra-ui/react';
import { ZoomIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Product } from '../../lib/api';
import { hasDistinctStyledImage } from '../../lib/images';
import { displayName } from '../../lib/menu';
import { prefersReducedMotion } from '../../lib/motion';
import PhotoFrame from './PhotoFrame';
import ProductImage from './ProductImage';

const ZoomViewer = lazy(() => import('./ZoomViewer'));

interface ProductGalleryProps {
  product: Product;
  sizes: string;
  eager?: boolean;
}

type Slide = 'display' | 'styled';

/**
 * The product photo, large and square. When a genuinely different second
 * photo exists it sits one swipe away (with a toggle); if both fields hold
 * the same upload, only one photo is shown. The magnifier opens the original
 * at full size. Render with `key={product.id}` so switching products starts
 * fresh.
 */
export function ProductGallery({ product, sizes, eager = false }: ProductGalleryProps) {
  const { t } = useTranslation();
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  const slides: Slide[] = [];
  if (product.display_image) slides.push('display');
  if (product.styled_image && (!product.display_image || hasDistinctStyledImage(product))) slides.push('styled');

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setActive(Math.round(Math.abs(el.scrollLeft) / Math.max(1, el.clientWidth)));
  };

  const goTo = (index: number) => {
    const el = scroller.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.scrollTo({ left: (rtl ? -1 : 1) * index * el.clientWidth, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const name = displayName(product);
  const current = slides[active] ?? slides[0] ?? 'display';

  return (
    <Box>
      <Box
        position="relative"
        borderRadius={{ base: '22px', md: '28px' }}
        boxShadow="0 34px 70px -44px rgba(62, 38, 14, 0.6)"
      >
        <Box
          ref={scroller}
          onScroll={onScroll}
          className="dy-no-scrollbar"
          display="flex"
          overflowX={slides.length > 1 ? 'auto' : 'hidden'}
          borderRadius={{ base: '22px', md: '28px' }}
          sx={{ scrollSnapType: 'x mandatory', overscrollBehaviorX: 'contain' }}
        >
          {slides.map((slide) => (
            <Box key={slide} flex="0 0 100%" sx={{ scrollSnapAlign: 'center' }}>
              <PhotoFrame radius={{ base: '22px', md: '28px' }}>
                <ProductImage
                  product={product}
                  kind={slide}
                  sizes={sizes}
                  eager={eager && slide === 'display'}
                  style={{ position: 'absolute', inset: 0 }}
                />
              </PhotoFrame>
            </Box>
          ))}
        </Box>

        <IconButton
          aria-label={t('product.zoom')}
          icon={<ZoomIn size={18} />}
          onClick={() => setZoomSrc(current === 'styled' ? product.styled_image : product.display_image)}
          position="absolute"
          bottom={4}
          insetInlineStart={4}
          zIndex={5}
          w="40px"
          h="40px"
          borderRadius="full"
          variant="unstyled"
          display="grid"
          placeItems="center"
          bg="rgba(255, 253, 248, 0.85)"
          border="1px solid rgba(22, 18, 14, 0.08)"
          backdropFilter="blur(8px)"
          color="text.primary"
          _hover={{ bg: 'ivory.50', color: 'brand.700' }}
        />
      </Box>

      {slides.length > 1 && (
        <HStack justify="center" spacing={2} mt={4}>
          {slides.map((slide, i) => (
            <Button
              key={slide}
              onClick={() => goTo(i)}
              aria-pressed={active === i}
              size="sm"
              h="32px"
              px={4}
              borderRadius="full"
              fontSize="13px"
              fontWeight={500}
              variant="unstyled"
              display="inline-flex"
              alignItems="center"
              bg={active === i ? 'noir.800' : 'transparent'}
              color={active === i ? 'brand.100' : 'text.muted'}
              border="1px solid"
              borderColor={active === i ? 'noir.800' : 'rgba(22,18,14,0.12)'}
              transition="all 300ms var(--dy-ease)"
              _hover={active === i ? undefined : { color: 'text.primary', borderColor: 'rgba(22,18,14,0.3)' }}
            >
              {t(slide === 'display' ? 'product.photoProduct' : 'product.photoMoment')}
            </Button>
          ))}
        </HStack>
      )}

      {zoomSrc && (
        <Suspense fallback={null}>
          <ZoomViewer src={zoomSrc} alt={name} onClose={() => setZoomSrc(null)} />
        </Suspense>
      )}
    </Box>
  );
}

export default ProductGallery;
