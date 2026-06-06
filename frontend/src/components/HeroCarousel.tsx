import { useCallback, useEffect, useMemo, useState } from 'react';
import { AspectRatio, Box, Button, Container, Grid, GridItem, HStack, Skeleton, Stack, Text } from '@chakra-ui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { Product } from '../lib/api';
import { formatStartingFrom } from '../lib/format';

const STYLED_FALLBACK = 'https://placehold.co/800x800/FFFFFF/C9A961?text=Dalloyou&font=cormorant';
const SLIDE_INTERVAL_MS = 4000;
const FADE_MS = 0.4;

interface HeroCarouselProps {
  products: Product[];
  isLoading?: boolean;
}

// ── Inline chevron glyphs (no external icon dependency) ──────────────────
function ChevronLeft() {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="20px" h="20px" aria-hidden>
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
}
function ChevronRight() {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="20px" h="20px" aria-hidden>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
}

// Shared arrow button styles
const ARROW_BUTTON_SX = {
  position: 'absolute' as const,
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 3,
  w: '48px',
  h: '48px',
  borderRadius: 'full',
  bg: 'rgba(250,248,243,0.95)',
  border: '1px solid',
  borderColor: 'border.gold',
  color: 'accent.goldDeep',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  transition: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  _hover: {
    bg: 'accent.gold',
    color: 'warm.black',
    transform: 'translateY(-50%) scale(1.05)',
  },
};

export function HeroCarousel({ products, isLoading = false }: HeroCarouselProps) {
  const { t } = useTranslation();
  const lang = 'ar';
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const slides = useMemo(
    () => products.filter((p) => p.styled_image),
    [products],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Clamp index if slides list shrinks
  useEffect(() => {
    if (slides.length === 0) return;
    if (currentIndex >= slides.length) setCurrentIndex(0);
  }, [slides.length, currentIndex]);

  // ── Auto-rotate: timer naturally resets whenever currentIndex changes ──
  useEffect(() => {
    if (slides.length <= 1) return;
    if (isPaused) return;
    const id = window.setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [currentIndex, isPaused, slides.length]);

  // Preload next slide image
  useEffect(() => {
    if (slides.length < 2) return;
    const next = slides[(currentIndex + 1) % slides.length];
    const url = next.styled_image;
    if (!url) return;
    const img = new Image();
    img.src = url;
  }, [currentIndex, slides]);

  const goPrev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentIndex((i) => (i - 1 + slides.length) % slides.length);
    },
    [slides.length],
  );

  const goNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentIndex((i) => (i + 1) % slides.length);
    },
    [slides.length],
  );

  const goToSlide = useCallback((productId: number | string) => {
    navigate(`/product/${productId}`);
  }, [navigate]);

  // ── Loading ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Box bg="warm.cream" minH={{ base: '100vh', md: '85vh' }} display="grid" placeItems="center">
        <Skeleton h="60vh" w="min(90vw, 480px)" borderRadius="lg" startColor="warm.cream" endColor="border.subtle" />
      </Box>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────
  if (slides.length === 0) {
    return (
      <Box
        minH={{ base: '100vh', md: '85vh' }}
        bg="warm.cream"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Container maxW="1280px" textAlign="center">
          <Text fontSize="11px" letterSpacing="0.32em" textTransform="uppercase" color="accent.gold" mb={4}>
            {t('hero.eyebrow')}
          </Text>
          <Text
            fontFamily="heading"
            fontSize={{ base: '40px', md: '72px' }}
            lineHeight={1.05}
            color="text.primary"
            maxW="720px"
            mx="auto"
          >
            {t('brand.longTagline')}
          </Text>
        </Container>
      </Box>
    );
  }

  const slide = slides[currentIndex];
  const slideImage = slide.styled_image ?? STYLED_FALLBACK;
  const slideName = slide.name_ar || slide.name_en;
  const slideDesc = slide.description_ar || slide.description_en;
  const startingPrice = slide.starting_price ?? slide.base_price;

  return (
    <Box
      as="section"
      position="relative"
      minH={{ base: '100vh', md: '85vh' }}
      w="100%"
      overflow="hidden"
      bg="#FAF8F3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label={t('sections.featured')}
      // Account for the sticky transparent navbar height — keep content clear of it
      pt={{ base: '72px', md: '88px' }}
      px={{ base: 6, md: 10, lg: 20 }}
      py={{ base: 8, md: 0 }}
      display="flex"
      alignItems="center"
    >
      <Container maxW="1400px" px={0} w="100%">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : FADE_MS, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Grid
              templateColumns={{ base: '1fr', md: '11fr 9fr' }}
              gap={{ base: 8, md: 12, lg: 20 }}
              alignItems="center"
              w="100%"
            >
              {/* ── Image column (left in LTR, right in RTL via logical column order) ── */}
              <GridItem
                display="flex"
                justifyContent="center"
                order={{ base: 0, md: 0 }}
              >
                <Box
                  w="100%"
                  maxW={{ base: '88vw', md: '420px', lg: '520px' }}
                  cursor="pointer"
                  onClick={() => goToSlide(slide.id)}
                  role="link"
                  aria-label={slideName}
                >
                  <AspectRatio ratio={1}>
                    <Box
                      position="relative"
                      overflow="hidden"
                      borderRadius="16px"
                      border="1px solid"
                      borderColor="rgba(201,169,97,0.3)"
                      bg="#FFFFFF"
                      p="24px"
                      boxShadow="0 24px 60px -20px rgba(168, 138, 77, 0.18)"
                    >
                      <Box position="relative" overflow="hidden" borderRadius="8px" w="100%" h="100%">
                        <motion.img
                          src={slideImage}
                          alt={slideName}
                          loading="eager"
                          initial={{ scale: 1 }}
                          animate={{ scale: reduceMotion ? 1 : 1.04 }}
                          transition={{ duration: reduceMotion ? 0 : SLIDE_INTERVAL_MS / 1000, ease: 'linear' }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            display: 'block',
                          }}
                        />
                      </Box>
                    </Box>
                  </AspectRatio>
                </Box>
              </GridItem>

              {/* ── Content column ── */}
              <GridItem
                textAlign={{ base: 'center', md: 'start' }}
                order={{ base: 1, md: 1 }}
              >
                <Stack spacing={6} maxW={{ base: '100%', md: '520px' }} mx={{ base: 'auto', md: 0 }}>
                  {/* Eyebrow with leading gold line */}
                  <HStack
                    spacing={3}
                    justify={{ base: 'center', md: 'flex-start' }}
                    align="center"
                  >
                    <Box w="24px" h="1px" bg="accent.gold" />
                    <Text
                      fontSize="12px"
                      letterSpacing="0.25em"
                      textTransform="uppercase"
                      color="accent.gold"
                      fontWeight={500}
                    >
                      {t('hero.eyebrow')}
                    </Text>
                  </HStack>

                  {/* Product name */}
                  <Text
                    as="h1"
                    fontFamily="heading"
                    fontSize={{ base: '36px', md: '44px', lg: '56px' }}
                    fontWeight={500}
                    color="warm.black"
                    lineHeight={1.1}
                    // Clamp to 2 lines
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {slideName}
                  </Text>

                  {/* Description (line-clamp 2) */}
                  {slideDesc && (
                    <Text
                      fontSize="16px"
                      lineHeight={1.7}
                      color="text.muted"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {slideDesc}
                    </Text>
                  )}

                  {/* Starting price */}
                  <Text fontSize="18px" color="accent.goldDeep" fontWeight={500}>
                    {formatStartingFrom(startingPrice, lang)}
                  </Text>

                  {/* CTA */}
                  <Box>
                    <Button
                      onClick={(e) => { e.stopPropagation(); goToSlide(slide.id); }}
                      h="56px"
                      px="48px"
                      bg="warm.black"
                      color="accent.gold"
                      border="1px solid"
                      borderColor="accent.gold"
                      fontSize="13px"
                      letterSpacing="0.18em"
                      textTransform="uppercase"
                      transition="all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                      _hover={{
                        bg: 'accent.gold',
                        color: 'warm.black',
                        transform: 'translateY(-2px)',
                        boxShadow: 'goldGlow',
                      }}
                    >
                      {t('product.orderNow')}
                    </Button>
                  </Box>
                </Stack>
              </GridItem>
            </Grid>
          </motion.div>
        </AnimatePresence>
      </Container>

      {/* ── Prev / Next arrows (left = previous always) ── */}
      {slides.length > 1 && (
        <>
          <Box
            {...ARROW_BUTTON_SX}
            left="24px"
            as="button"
            type="button"
            aria-label={t('hero.prev')}
            onClick={goPrev}
          >
            <ChevronLeft />
          </Box>
          <Box
            {...ARROW_BUTTON_SX}
            right="24px"
            as="button"
            type="button"
            aria-label={t('hero.next')}
            onClick={goNext}
          >
            <ChevronRight />
          </Box>
        </>
      )}

      {/* ── Dot indicators ── */}
      {slides.length > 1 && (
        <HStack
          position="absolute"
          bottom={{ base: 6, md: 8 }}
          left="50%"
          transform="translateX(-50%)"
          spacing={3}
          zIndex={2}
        >
          {slides.map((s, i) => {
            const active = i === currentIndex;
            return (
              <Box
                key={s.id}
                as="button"
                type="button"
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                w="40px"
                h="2px"
                bg={active ? 'accent.gold' : 'rgba(26,26,26,0.18)'}
                transition="background 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                _hover={{ bg: active ? 'accent.gold' : 'rgba(26,26,26,0.4)' }}
              />
            );
          })}
        </HStack>
      )}
    </Box>
  );
}

export default HeroCarousel;
