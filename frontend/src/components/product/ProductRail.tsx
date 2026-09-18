import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, HStack, IconButton } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Product } from '../../lib/api';
import { prefersReducedMotion } from '../../lib/motion';
import Reveal from '../ui/Reveal';
import ProductCard from './ProductCard';

const RAIL_SIZES = '(min-width: 80em) 260px, (min-width: 62em) 22vw, (min-width: 30em) 36vw, 46vw';

interface ProductRailProps {
  products: Product[];
  tone?: 'light' | 'dark';
  /** Accessible name for the scroll region. */
  label: string;
}

/**
 * A horizontal shelf of product cards: native, momentum scrolling with snap
 * points on touch; arrow buttons on desktop. Direction-aware — in RTL the
 * shelf starts at the right edge and "next" moves left.
 */
export function ProductRail({ products, tone = 'light', label }: ProductRailProps) {
  const { t, i18n } = useTranslation();
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const rtl = i18n.dir() === 'rtl';

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const progress = Math.abs(el.scrollLeft);
    setEdges({ start: progress < 4, end: progress > max - 4 });
  }, []);

  useEffect(() => {
    measure();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [measure, products.length]);

  const page = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const distance = el.clientWidth * 0.82 * direction;
    el.scrollBy({ left: rtl ? -distance : distance, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const arrowProps = {
    size: 'md' as const,
    variant: 'outline',
    borderRadius: 'full',
    w: '46px',
    h: '46px',
    borderColor: tone === 'dark' ? 'rgba(227,183,117,0.35)' : 'rgba(22,18,14,0.16)',
    color: tone === 'dark' ? 'text.onDark' : 'text.primary',
    bg: 'transparent',
    _hover: { bg: 'brand.500', borderColor: 'brand.500', color: 'noir.800' },
    _disabled: { opacity: 0.3, cursor: 'default', _hover: { bg: 'transparent' } },
  };

  return (
    <Box position="relative">
      <HStack
        spacing={2}
        position="absolute"
        top={{ md: '-86px' }}
        insetInlineEnd={0}
        display={{ base: 'none', md: products.length > 3 ? 'flex' : 'none' }}
      >
        <IconButton aria-label={t('hero.prev')} icon={rtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />} isDisabled={edges.start} onClick={() => page(-1)} {...arrowProps} />
        <IconButton aria-label={t('hero.next')} icon={rtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />} isDisabled={edges.end} onClick={() => page(1)} {...arrowProps} />
      </HStack>

      <Box
        ref={scroller}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="dy-no-scrollbar"
        display="grid"
        gridAutoFlow="column"
        gridAutoColumns={{ base: '46%', sm: '36%', md: '29%', lg: '22.5%', xl: '260px' }}
        gap={{ base: 3.5, md: 6 }}
        overflowX="auto"
        overscrollBehaviorX="contain"
        pb={2}
        mx={{ base: -5, md: 0 }}
        px={{ base: 5, md: 0 }}
        sx={{
          scrollSnapType: 'x mandatory',
          scrollPaddingInline: { base: '20px', md: 0 },
          WebkitOverflowScrolling: 'touch',
          '&:focus-visible': { outlineOffset: '6px' },
        }}
      >
        {products.map((product, i) => (
          <Box key={product.id} sx={{ scrollSnapAlign: 'start' }}>
            <Reveal delay={Math.min(i, 5) * 0.07}>
              <ProductCard product={product} sizes={RAIL_SIZES} tone={tone} />
            </Reveal>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default ProductRail;
