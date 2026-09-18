import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { Box, HStack, IconButton, Text, useBreakpointValue } from '@chakra-ui/react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Monogram from '../brand/Monogram';
import PhotoFrame, { FrameOutline } from '../product/PhotoFrame';
import Price from '../product/Price';
import ProductImage from '../product/ProductImage';
import type { Product } from '../../lib/api';
import { productImageSource } from '../../lib/images';
import { categoryName, displayName, measurementText } from '../../lib/menu';
import { EASE_IN, EASE_OUT } from '../../lib/motion';
import { useModalLinkState } from '../../lib/routing';

const INTERVAL_MS = 5600;
const SIZES = '(min-width: 80em) 460px, (min-width: 62em) 420px, (min-width: 30em) 340px, 72vw';
/** Frame corner radius and the gap to the gold hairline around it, per breakpoint. */
const FRAME_RADIUS = { base: 24, md: 30 };
const OUTLINE_GAP = { base: 10, md: 16 };

interface HeroShowcaseProps {
  products: Product[];
  loading: boolean;
  /** Held back until the intro curtain lifts. */
  play: boolean;
}

/**
 * The hero's display window: one featured creation at a time, its square
 * photo in a lit frame ringed by a hand-drawn gold hairline. Each photo
 * cross-fades in over the last and slowly settles (a gentle zoom-out) while
 * it's on show. It advances on its own (pausing on hover, when the tab is
 * hidden and for reduced motion), follows swipes and arrow keys, tilts
 * gently toward the pointer on desktop, and opens the product on tap.
 */
export function HeroShowcase({ products, loading, play }: HeroShowcaseProps) {
  const { t, i18n } = useTranslation();
  const linkState = useModalLinkState();
  const reduce = useReducedMotion();
  const rtl = i18n.dir() === 'rtl';

  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const count = products.length;
  const current = count ? products[index % count] : undefined;
  const paused = hovered || tabHidden || !play || Boolean(reduce) || count < 2;

  const step = (direction: 1 | -1) => setIndex((i) => (i + direction + count) % Math.max(count, 1));

  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, count]);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Warm the next image so each change lands instantly.
  useEffect(() => {
    if (count < 2) return;
    const source = productImageSource(products[(index + 1) % count], 'display');
    if (!source) return;
    const img = new Image();
    img.sizes = SIZES;
    if (source.srcSet) img.srcset = source.srcSet;
    img.src = source.src;
  }, [index, products, count]);

  // ── Pointer tilt (mouse only) ─────────────────────────────────────────────
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 110, damping: 16 });
  const springY = useSpring(rotateY, { stiffness: 110, damping: 16 });

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    rotateY.set(((event.clientX - rect.left) / rect.width - 0.5) * 9);
    rotateX.set(-((event.clientY - rect.top) / rect.height - 0.5) * 7);
  };

  // ── Swipe ─────────────────────────────────────────────────────────────────
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const onPointerDown = (event: PointerEvent) => {
    swipeStart.current = { x: event.clientX, y: event.clientY };
    swiped.current = false;
  };
  const onPointerUp = (event: PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || count < 2) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      swiped.current = true;
      const forward = rtl ? dx > 0 : dx < 0;
      step(forward ? 1 : -1);
    }
  };
  const onClickCapture = (event: MouseEvent) => {
    if (swiped.current) {
      event.preventDefault();
      event.stopPropagation();
      swiped.current = false;
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') step(rtl ? 1 : -1);
    if (event.key === 'ArrowRight') step(rtl ? -1 : 1);
  };

  const measure = current ? measurementText(current, t) : '';
  const frameRadius = useBreakpointValue(FRAME_RADIUS, { ssr: false }) ?? FRAME_RADIUS.base;
  const outlineGap = useBreakpointValue(OUTLINE_GAP, { ssr: false }) ?? OUTLINE_GAP.base;

  return (
    <Box
      position="relative"
      w={{ base: 'min(72vw, 320px)', sm: '340px', lg: '420px', xl: '460px' }}
      mx="auto"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        rotateX.set(0);
        rotateY.set(0);
      }}
      onKeyDown={onKeyDown}
      role="region"
      aria-roledescription="carousel"
      aria-label={t('hero.showcase')}
    >
      <motion.div
        style={{ rotateX: springX, rotateY: springY, transformPerspective: 1200 }}
        initial={{ opacity: 0, y: reduce ? 0 : 56, scale: reduce ? 1 : 0.94 }}
        animate={play ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{ duration: 1.35, ease: EASE_OUT, delay: 0.2 }}
      >
        <Box position="relative" onPointerMove={onPointerMove}>
          {/* Warm light spilling out of the frame */}
          <Box
            position="absolute"
            inset="-22%"
            pointerEvents="none"
            sx={{
              background: 'radial-gradient(closest-side, rgba(194,134,62,0.42), rgba(194,134,62,0.12) 55%, rgba(194,134,62,0) 75%)',
              animation: reduce ? undefined : 'dy-glow 7s ease-in-out infinite',
            }}
          />
          <Box position="absolute" inset={`-${outlineGap}px`} pointerEvents="none">
            <FrameOutline radius={frameRadius + outlineGap} play={play} delay={0.55} duration={2.2} />
          </Box>

          <Box
            as={RouterLink}
            to={current ? `/product/${current.id}` : '/menu'}
            state={linkState}
            display="block"
            aria-label={current ? t('product.view', { name: displayName(current) }) : t('nav.menu')}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onClickCapture={onClickCapture}
            sx={{ touchAction: 'pan-y', WebkitTapHighlightColor: 'transparent' }}
          >
            <PhotoFrame
              radius={{ base: `${FRAME_RADIUS.base}px`, md: `${FRAME_RADIUS.md}px` }}
              boxShadow="0 0 0 1px rgba(227,183,117,0.22), 0 50px 120px -30px rgba(194,134,62,0.55)"
            >
              {loading && <Box position="absolute" inset={0} className="dy-shimmer" opacity={0.35} />}

              {!loading && !current && (
                <Box position="absolute" inset={0} display="grid" placeItems="center">
                  <Monogram large w="38%" h="38%" opacity={0.85} />
                </Box>
              )}

              {/* Cross-fade: the new photo fades in over the old one, which
                  holds still underneath until it's covered. */}
              <AnimatePresence initial={false}>
                {current && (
                  <ProductImage
                    key={current.id}
                    product={current}
                    sizes={SIZES}
                    eager
                    style={{ position: 'absolute', inset: 0 }}
                    initial={{ opacity: 0, scale: reduce ? 1 : 1.1 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      transition: {
                        opacity: { duration: 1, ease: EASE_OUT },
                        scale: { duration: INTERVAL_MS / 1000 + 1.2, ease: EASE_OUT },
                      },
                    }}
                    // Stays fully visible while the next photo fades in on top, then leaves.
                    exit={{ opacity: 0, transition: { delay: 1, duration: 0.2 } }}
                  />
                )}
              </AnimatePresence>
            </PhotoFrame>
          </Box>

          {count > 1 && (
            <>
              <IconButton
                aria-label={t('hero.prev')}
                icon={rtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                onClick={() => step(-1)}
                position="absolute"
                top="52%"
                insetInlineStart="-64px"
                display={{ base: 'none', lg: 'inline-flex' }}
                opacity={hovered ? 1 : 0}
                transition="opacity 400ms, background-color 300ms"
                variant="ghostOnDark"
                w="46px"
                h="46px"
                minW="46px"
                p={0}
              />
              <IconButton
                aria-label={t('hero.next')}
                icon={rtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                onClick={() => step(1)}
                position="absolute"
                top="52%"
                insetInlineEnd="-64px"
                display={{ base: 'none', lg: 'inline-flex' }}
                opacity={hovered ? 1 : 0}
                transition="opacity 400ms, background-color 300ms"
                variant="ghostOnDark"
                w="46px"
                h="46px"
                minW="46px"
                p={0}
              />
            </>
          )}
        </Box>
      </motion.div>

      {/* Caption */}
      <Box mt={{ base: 5, md: 8 }} textAlign="center" minH={{ base: '78px', md: '92px' }} aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: play ? 1 : 0, y: 0, transition: { duration: 0.6, ease: EASE_OUT, delay: play ? 0.15 : 0 } }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.25, ease: EASE_IN } }}
            >
              <Text fontSize="12.5px" color="brand.300" fontWeight={500}>
                {categoryName(current.category)}
              </Text>
              <Text
                mt={1}
                fontFamily="display"
                fontWeight={700}
                fontSize={{ base: '22px', md: '26px' }}
                lineHeight={1.35}
                color="text.onDark"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                pb="0.3em"
                mb="-0.3em"
              >
                {displayName(current)}
              </Text>
              <HStack mt={1.5} justify="center" spacing={2.5} color="text.onDarkMuted" fontSize="13.5px">
                {measure && <Text as="span">{measure}</Text>}
                {measure && <Box as="span" w="3px" h="3px" borderRadius="full" bg="brand.400" />}
                <Price value={current.base_price} size="sm" tone="onDark" />
              </HStack>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {count > 1 && (
        <HStack justify="center" spacing={1} mt={3}>
          {products.map((product, i) => {
            const active = i === index % count;
            return (
              <Box
                key={product.id}
                as="button"
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t('hero.goTo', { name: displayName(product) })}
                aria-current={active ? 'true' : undefined}
                w={active ? '34px' : '16px'}
                h="18px"
                display="grid"
                alignItems="center"
                transition="width 500ms var(--dy-ease)"
              >
                <Box h="2px" borderRadius="full" bg="rgba(244, 238, 227, 0.2)" overflow="hidden">
                  {active && (
                    <Box
                      key={`${index}-${paused ? 'paused' : 'running'}`}
                      h="100%"
                      bg="brand.400"
                      transformOrigin={rtl ? 'right' : 'left'}
                      sx={
                        paused
                          ? { transform: 'scaleX(1)' }
                          : { animation: `dy-fill ${INTERVAL_MS}ms linear forwards` }
                      }
                    />
                  )}
                </Box>
              </Box>
            );
          })}
        </HStack>
      )}
    </Box>
  );
}

export default HeroShowcase;
