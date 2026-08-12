/**
 * FeaturedCarousel — the first thing on the homepage.
 *
 * Mobile (<lg): the photograph *is* the design.
 *   ┌───────────────────────────┐
 *   │  full-bleed square image  │  flush under the navbar, no frame,
 *   │  ‹ arrows ›  [ pills ]    │  no padding, no radius
 *   ├───────────────────────────┤
 *   │  eyebrow · name · price   │  centred, no CTA — the image is the tap
 *   └───────────────────────────┘    target
 *
 * Desktop (≥lg): a ~80vh two-column opening statement.
 *   ┌── image card ──┐ ┌── info ─────────┐   RTL: the image takes grid slot 1
 *   │  square, gold  │ │ eyebrow         │   so it lands on the right and
 *   │  border, Ken   │ │ name (display)  │   mirrors to the left in English.
 *   │  Burns, pills  │ │ price           │
 *   └────────────────┘ │ [ Order Now ]   │
 *                      └─────────────────┘
 *
 * Behaviour (unchanged):
 *   · 4s auto-rotate, pause on hover
 *   · 400ms crossfade — image and copy share ONE AnimatePresence, so they
 *     always change together
 *   · Ken Burns scale on desktop only
 *   · uses styled_image
 *   · arrows / indicators reset the timer (useCarousel keys off currentIndex)
 *   · tapping the image opens the product
 *   · no swipe gesture
 */

import {
  Box,
  Button,
  Container,
  Grid,
  GridItem,
  Skeleton,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { Product } from '../lib/api';
import { useCarousel } from '../hooks/useCarousel';
import { formatStartingFrom } from '../lib/format';

const FALLBACK = 'https://placehold.co/800x800/FFFFFF/C9A961?text=Dalloyou&font=cormorant';
const SLIDE_INTERVAL_MS = 4000;
const FADE_DURATION = 0.4;
const EASE = [0.25, 0.46, 0.45, 0.94] as const;

interface FeaturedCarouselProps {
  products: Product[];
  isLoading?: boolean;
}

function shuffleProducts(products: Product[]): Product[] {
  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function FeaturedCarousel({ products, isLoading = false }: FeaturedCarouselProps) {
  // ── Hooks: all unconditional, before any early return ────────────────────
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const isDesktop = useBreakpointValue({ base: false, lg: true }, { fallback: 'base' }) ?? false;
  const kenBurns = isDesktop && !reduceMotion;

  const slides = useMemo(
    () => shuffleProducts(products.filter((p) => p.styled_image)),
    [products],
  );

  const carousel = useCarousel({ length: slides.length, interval: SLIDE_INTERVAL_MS });
  const { currentIndex, goNext, goPrev, goTo, setIsPaused } = carousel;

  // Preload the next image so the crossfade never flashes
  useEffect(() => {
    if (slides.length < 2) return;
    const next = slides[(currentIndex + 1) % slides.length];
    if (!next?.styled_image) return;
    const img = new Image();
    img.src = next.styled_image;
  }, [currentIndex, slides]);

  // ── Early returns ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Box as="section" minH={{ lg: '80vh' }} display="grid" placeItems="center" py={{ base: 0, lg: 8 }}>
        <Container maxW="1280px" px={{ base: 0, lg: 10 }} w="100%">
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={{ base: 8, lg: 16 }} alignItems="center">
            <GridItem>
              <Skeleton
                w="100%"
                maxW={{ lg: '520px' }}
                sx={{ aspectRatio: '1 / 1' }}
                borderRadius={{ base: 0, lg: 'lg' }}
                startColor="warm.cream"
                endColor="border.subtle"
              />
            </GridItem>
            <GridItem px={{ base: 6, lg: 0 }}>
              <Stack spacing={4} align={{ base: 'center', lg: 'flex-start' }}>
                <Skeleton h="14px" w="110px" startColor="warm.cream" endColor="border.subtle" />
                <Skeleton h="36px" w="80%" startColor="warm.cream" endColor="border.subtle" />
                <Skeleton h="20px" w="100px" startColor="warm.cream" endColor="border.subtle" />
              </Stack>
            </GridItem>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[currentIndex];
  const slideImage = slide.styled_image ?? FALLBACK;
  const slideName = slide.name_ar || slide.name_en;
  const startingPrice = slide.starting_price ?? slide.base_price;
  const openProduct = () => navigate(`/product/${slide.id}`);

  const arrowBase = {
    position: 'absolute' as const,
    top: '50%',
    zIndex: 4,
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    transition: `all 300ms cubic-bezier(${EASE.join(', ')})`,
  };

  // ── Image block ───────────────────────────────────────────────────────────
  const imageBlock = (
    <Box
      position="relative"
      w="100%"
      maxW={{ base: 'none', lg: '520px' }}
      mx={{ base: 0, lg: 'auto' }}
      /* Desktop: framed white card. Mobile: bare full-bleed photograph. */
      bg={{ base: 'transparent', lg: 'bg.surface' }}
      border={{ base: 'none', lg: '1px solid' }}
      borderColor={{ lg: 'border.gold' }}
      borderRadius={{ base: 0, lg: 'lg' }}
      p={{ base: 0, lg: 4 }}
      boxShadow={{ base: 'none', lg: '0 24px 60px -20px rgba(168,138,77,0.18)' }}
    >
      <Box
        position="relative"
        overflow="hidden"
        borderRadius={{ base: 0, lg: 'sm' }}
        sx={{ aspectRatio: '1 / 1' }}
        onClick={openProduct}
        cursor="pointer"
        role="link"
        aria-label={slideName}
        bg="warm.cream"
      >
        {/* Ken Burns on desktop only */}
        <motion.img
          src={slideImage}
          alt={slideName}
          loading="eager"
          draggable={false}
          initial={{ scale: 1 }}
          animate={{ scale: kenBurns ? 1.04 : 1 }}
          transition={{ duration: kenBurns ? SLIDE_INTERVAL_MS / 1000 : 0, ease: 'linear' }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            userSelect: 'none',
          }}
        />

        {/* Pill indicators — frosted capsule at the image's bottom edge */}
        {slides.length > 1 && (
          <Box
            position="absolute"
            bottom={{ base: '14px', lg: '14px' }}
            left="50%"
            transform="translateX(-50%)"
            display="flex"
            alignItems="center"
            gap="6px"
            zIndex={3}
            bg="rgba(250,248,243,0.8)"
            sx={{ backdropFilter: 'blur(6px)' }}
            px="10px"
            py="7px"
            borderRadius="full"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {slides.map((s, i) => {
              const active = i === currentIndex;
              return (
                <Box
                  key={s.id}
                  as="button"
                  type="button"
                  aria-label={t('a11y.goToSlide', { n: i + 1 })}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    goTo(i);
                  }}
                  w="22px"
                  h="3px"
                  borderRadius="full"
                  bg={active ? 'accent.gold' : 'rgba(26,26,26,0.28)'}
                  transition={`background 400ms cubic-bezier(${EASE.join(', ')})`}
                  _hover={{ bg: active ? 'accent.gold' : 'rgba(26,26,26,0.5)' }}
                />
              );
            })}
          </Box>
        )}

        {/* Mobile arrows — small, subtle, over the image */}
        {slides.length > 1 && (
          <>
            <Box
              {...arrowBase}
              display={{ base: 'grid', lg: 'none' }}
              as="button"
              type="button"
              aria-label={t('hero.prev')}
              insetInlineStart="8px"
              transform="translateY(-50%)"
              w="28px"
              h="28px"
              bg="transparent"
              border="none"
              color="rgba(255,255,255,0.9)"
              sx={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.35))' }}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); goPrev(); }}
              _active={{ transform: 'translateY(-50%) scale(0.9)' }}
            >
              <ChevronLeft size={18} />
            </Box>
            <Box
              {...arrowBase}
              display={{ base: 'grid', lg: 'none' }}
              as="button"
              type="button"
              aria-label={t('hero.next')}
              insetInlineEnd="8px"
              transform="translateY(-50%)"
              w="28px"
              h="28px"
              bg="transparent"
              border="none"
              color="rgba(255,255,255,0.9)"
              sx={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.35))' }}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); goNext(); }}
              _active={{ transform: 'translateY(-50%) scale(0.9)' }}
            >
              <ChevronRight size={18} />
            </Box>
          </>
        )}
      </Box>

      {/* Desktop arrows — flanking the card */}
      {slides.length > 1 && (
        <>
          <Box
            {...arrowBase}
            display={{ base: 'none', lg: 'grid' }}
            as="button"
            type="button"
            aria-label={t('hero.prev')}
            insetInlineStart="-22px"
            transform="translateY(-50%)"
            w="44px"
            h="44px"
            borderRadius="full"
            bg="rgba(250,248,243,0.96)"
            border="1px solid"
            borderColor="border.gold"
            color="accent.goldDeep"
            onClick={goPrev}
            _hover={{ bg: 'accent.gold', color: 'warm.black' }}
          >
            <ChevronLeft size={19} />
          </Box>
          <Box
            {...arrowBase}
            display={{ base: 'none', lg: 'grid' }}
            as="button"
            type="button"
            aria-label={t('hero.next')}
            insetInlineEnd="-22px"
            transform="translateY(-50%)"
            w="44px"
            h="44px"
            borderRadius="full"
            bg="rgba(250,248,243,0.96)"
            border="1px solid"
            borderColor="border.gold"
            color="accent.goldDeep"
            onClick={goNext}
            _hover={{ bg: 'accent.gold', color: 'warm.black' }}
          >
            <ChevronRight size={19} />
          </Box>
        </>
      )}
    </Box>
  );

  // ── Info block ────────────────────────────────────────────────────────────
  const infoBlock = (
    <Stack
      spacing={0}
      align={{ base: 'center', lg: 'flex-start' }}
      textAlign={{ base: 'center', lg: 'start' }}
      mt={{ base: 7, lg: 0 }}
      px={{ base: 6, lg: 0 }}
    >
      {/* Eyebrow */}
      <Box display="flex" alignItems="center" gap={3} mb={{ base: 4, lg: 5 }}>
        <Box w="20px" h="1px" bg="accent.gold" aria-hidden />
        <Text
          fontSize={{ base: '11px', lg: '12px' }}
          letterSpacing="0.25em"
          textTransform="uppercase"
          color="accent.gold"
          fontWeight={500}
        >
          {t('hero.eyebrow')}
        </Text>
        <Box w="20px" h="1px" bg="accent.gold" display={{ base: 'block', lg: 'none' }} aria-hidden />
      </Box>

      <Text
        as="h2"
        fontFamily="heading"
        fontSize={{ base: '30px', md: '36px', lg: '52px' }}
        fontWeight={500}
        color="warm.black"
        lineHeight={1.12}
        noOfLines={3}
      >
        {slideName}
      </Text>

      <Text
        fontSize={{ base: '17px', lg: '20px' }}
        color="accent.goldDeep"
        fontWeight={500}
        mt={{ base: 3, lg: 5 }}
      >
        {formatStartingFrom(startingPrice, i18n.language)}
      </Text>

      {/* CTA — desktop only. On mobile the image itself is the tap target. */}
      <Button
        display={{ base: 'none', lg: 'inline-flex' }}
        onClick={openProduct}
        mt={9}
        h="56px"
        px={12}
        bg="warm.black"
        color="accent.gold"
        border="1px solid"
        borderColor="accent.gold"
        borderRadius="full"
        fontSize="14px"
        fontWeight={600}
        letterSpacing="0"
        textTransform="none"
        _hover={{
          bg: 'accent.gold',
          color: 'warm.black',
          transform: 'translateY(-2px)',
          boxShadow: 'goldGlow',
        }}
      >
        {t('product.orderNow')}
      </Button>
    </Stack>
  );

  return (
    <Box
      as="section"
      w="100%"
      minH={{ lg: '80vh' }}
      display="flex"
      alignItems="center"
      py={{ base: 0, lg: 8 }}
      role="region"
      aria-roledescription="carousel"
      aria-label={t('sections.featured')}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Container maxW="1280px" px={{ base: 0, lg: 10 }} w="100%">
        {/* One AnimatePresence around both blocks — they crossfade together */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : FADE_DURATION, ease: EASE }}
          >
            <Grid
              templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
              gap={{ base: 0, lg: 16, xl: 20 }}
              alignItems="center"
            >
              <GridItem minW={0}>{imageBlock}</GridItem>
              <GridItem minW={0}>{infoBlock}</GridItem>
            </Grid>
          </motion.div>
        </AnimatePresence>
      </Container>
    </Box>
  );
}

export default FeaturedCarousel;
