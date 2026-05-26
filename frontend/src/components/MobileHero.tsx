/**
 * MobileHero — shown only on screens < 768px (md).
 *
 * Layout:
 *   ┌──────────────────────────┐
 *   │   Square image (100vw)   │
 *   │  < subtle arrows >       │
 *   │  [pill indicators]       │
 *   ├──────────────────────────┤
 *   │  eyebrow · name · price  │
 *   │  [  Order Now  ]         │
 *   └──────────────────────────┘
 *
 * Swipe removed in favour of small transparent chevron buttons so the
 * image is always a clean tap-to-navigate surface.  The text block below
 * crossfades with the same AnimatePresence key as the image.
 */

import { Box, Button, Stack, Text } from '@chakra-ui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { Product } from '../lib/api';
import type { UseCarouselReturn } from '../hooks/useCarousel';
import { formatStartingFrom, localized } from '../lib/format';

const FALLBACK = 'https://placehold.co/800x800/FFFFFF/C9A961?text=Dalloyou&font=cormorant';
const FADE_DURATION = 0.28;

// Shared style for the tiny transparent arrow buttons
const ARROW_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 4,
  width: 28,
  height: 28,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  color: 'rgba(255,255,255,0.85)',
  // Drop-shadow keeps the icon legible on any background colour
  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.35))',
};

interface MobileHeroProps {
  slides: Product[];
  carousel: UseCarouselReturn;
  /** Height of the transparent navbar (px) — image starts below it */
  navbarHeight?: number;
}

export function MobileHero({ slides, carousel, navbarHeight = 72 }: MobileHeroProps) {
  const { currentIndex, goNext, goPrev, goTo } = carousel;
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  if (slides.length === 0) return null;

  const slide = slides[currentIndex];
  const slideImage = slide.styled_image ?? slide.display_image ?? FALLBACK;
  const slideName = localized(slide.name_en, slide.name_ar, lang);
  const startingPrice = slide.starting_price ?? slide.base_price;

  return (
    <Box w="100%" pt={`${navbarHeight}px`} bg="#FAF8F3">

      {/* ── 1 : 1 image block ─────────────────────────────────────────── */}
      <Box
        position="relative"
        w="100%"
        sx={{ aspectRatio: '1 / 1' }}
        overflow="hidden"
        bg="#111"
        /* Tapping the image (not an arrow / indicator) opens the product */
        onClick={() => navigate(`/product/${slide.id}`)}
        cursor="pointer"
        role="link"
        aria-label={slideName}
      >
        {/* Slide images — fade on index change */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : FADE_DURATION, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <img
              src={slideImage}
              alt={slideName}
              loading="eager"
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                userSelect: 'none',
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* ── Subtle prev / next arrows ── */}
        {slides.length > 1 && (
          <>
            <motion.button
              aria-label={t('hero.prev')}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              style={{ ...ARROW_STYLE, left: 8 }}
            >
              <ChevronLeft size={18} />
            </motion.button>
            <motion.button
              aria-label={t('hero.next')}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              style={{ ...ARROW_STYLE, right: 8 }}
            >
              <ChevronRight size={18} />
            </motion.button>
          </>
        )}

        {/* ── Gradient scrim ── */}
        {slides.length > 1 && (
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            h="64px"
            bgGradient="linear(to-t, rgba(0,0,0,0.52), transparent)"
            pointerEvents="none"
            zIndex={2}
          />
        )}

        {/* ── Pill indicators ── */}
        {slides.length > 1 && (
          <Box
            position="absolute"
            bottom="12px"
            left="50%"
            transform="translateX(-50%)"
            display="flex"
            gap="6px"
            zIndex={3}
          >
            {slides.map((_, i) => {
              const active = i === currentIndex;
              return (
                <Box
                  key={i}
                  as="button"
                  type="button"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    goTo(i);
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                  w="24px"
                  h="3px"
                  borderRadius="full"
                  bg={active ? '#C9A961' : 'rgba(255,255,255,0.42)'}
                  transition="background 350ms ease"
                />
              );
            })}
          </Box>
        )}
      </Box>

      {/* ── Product info below image — crossfades with slide ─────────── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.4, ease: 'easeInOut' }}
        >
          <Stack
            spacing={0}
            px="28px"
            pt={8}
            pb={6}
            textAlign="center"
            alignItems="center"
            bg="#FAF8F3"
          >
            {/* Eyebrow */}
            <Text
              fontSize="11px"
              letterSpacing="0.25em"
              textTransform="uppercase"
              color="accent.gold"
              fontWeight={500}
              mb={4}
            >
              {t('hero.eyebrow')}
            </Text>

            {/* Product name */}
            <Text
              fontFamily="heading"
              fontSize="28px"
              fontWeight={500}
              color="warm.black"
              lineHeight={1.15}
              mb={4}
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {slideName}
            </Text>

            {/* Starting price */}
            <Text fontSize="16px" color="accent.goldDeep" fontWeight={500} mb={6}>
              {formatStartingFrom(startingPrice, lang)}
            </Text>

            {/* CTA */}
            <Button
              onClick={() => navigate(`/product/${slide.id}`)}
              sx={{ width: 'calc(100% - 56px)' }}
              h="52px"
              bg="warm.black"
              color="accent.gold"
              border="1px solid"
              borderColor="accent.gold"
              fontSize="13px"
              letterSpacing="0.18em"
              textTransform="uppercase"
              /* No visible hover change on mobile */
              _hover={{ bg: 'warm.black', color: 'accent.gold' }}
              _active={{ bg: 'warm.black' }}
            >
              {t('product.orderNow')}
            </Button>
          </Stack>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}

export default MobileHero;
