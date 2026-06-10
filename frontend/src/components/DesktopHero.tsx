/**
 * DesktopHero — shown only on screens ≥ 768px (md).
 *
 * Two-column layout: image card (left) + product copy (right).
 * Image card: up to 480px on tablet, 600px on desktop (lg).
 * Arrows, overlaid pill indicators inside the image, Ken Burns zoom.
 */

import {
  AspectRatio,
  Box,
  Button,
  Container,
  Grid,
  GridItem,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { Product } from '../lib/api';
import type { UseCarouselReturn } from '../hooks/useCarousel';
import { formatStartingFrom } from '../lib/format';

const FALLBACK = 'https://placehold.co/800x800/FFFFFF/C9A961?text=Dalloyou&font=cormorant';
const SLIDE_INTERVAL_MS = 5000;
const FADE_DURATION = 0.4;

// ── Inline chevron glyphs ────────────────────────────────────────────────────
function ChevronLeft() {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="20px" h="20px" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}
function ChevronRight() {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="20px" h="20px" aria-hidden>
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}

const ARROW_SX = {
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

interface DesktopHeroProps {
  slides: Product[];
  carousel: UseCarouselReturn;
}

export function DesktopHero({ slides, carousel }: DesktopHeroProps) {
  const { currentIndex, goNext, goPrev, goTo, setIsPaused } = carousel;
  const { t } = useTranslation();
  const lang = 'ar';
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  if (slides.length === 0) return null;

  const slide = slides[currentIndex];
  const slideImage = slide.styled_image ?? FALLBACK;
  const slideName = slide.name_ar || slide.name_en;
  const slideDesc = slide.description_ar || slide.description_en;
  const startingPrice = slide.starting_price ?? slide.base_price;

  const handleImageClick = () => navigate(`/product/${slide.id}`);
  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/product/${slide.id}`);
  };

  return (
    <Box
      as="section"
      position="relative"
      minH={{ md: '85vh' }}
      w="100%"
      overflow="hidden"
      bg="#FAF8F3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label={t('sections.featured')}
      pt={{ md: '88px' }}
      px={{ md: 10, lg: 20 }}
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
            transition={{
              duration: reduceMotion ? 0 : FADE_DURATION,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <Grid
              templateColumns={{ md: '11fr 9fr' }}
              gap={{ md: 12, lg: 20 }}
              alignItems="center"
              w="100%"
            >
              {/* ── Image column ── */}
              <GridItem display="flex" justifyContent="center">
                <Box
                  w="100%"
                  maxW={{ md: '480px', lg: '600px' }}
                  cursor="pointer"
                  onClick={handleImageClick}
                  role="link"
                  aria-label={slideName}
                >
                  <AspectRatio ratio={1}>
                    {/*
                     * position="relative" is required here so the overlaid
                     * indicators can anchor to this card (not the section).
                     */}
                    <Box
                      position="relative"
                      overflow="hidden"
                      borderRadius="16px"
                      border="1px solid"
                      borderColor="rgba(201,169,97,0.3)"
                      bg="#FFFFFF"
                      p="24px"
                      boxShadow="0 24px 60px -20px rgba(168,138,77,0.18)"
                    >
                      {/* Image box */}
                      <Box
                        position="relative"
                        overflow="hidden"
                        borderRadius="8px"
                        w="100%"
                        h="100%"
                      >
                        <motion.img
                          src={slideImage}
                          alt={slideName}
                          loading="eager"
                          key={currentIndex}
                          initial={{ scale: 1 }}
                          animate={{ scale: reduceMotion ? 1 : 1.04 }}
                          transition={{
                            duration: reduceMotion ? 0 : SLIDE_INTERVAL_MS / 1000,
                            ease: 'linear',
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            display: 'block',
                          }}
                        />

                        {/* ── Slide indicators — overlaid on image lower edge ── */}
                        {slides.length > 1 && (
                          <Box
                            position="absolute"
                            bottom="16px"
                            left="50%"
                            transform="translateX(-50%)"
                            display="flex"
                            gap="6px"
                            alignItems="center"
                            zIndex={4}
                            bg="rgba(255,255,255,0.75)"
                            backdropFilter="blur(6px)"
                            px="12px"
                            py="8px"
                            borderRadius="full"
                            // Prevent click bubbling to the image link
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          >
                            {slides.map((s, i) => {
                              const active = i === currentIndex;
                              return (
                                <Box
                                  key={s.id}
                                  as="button"
                                  type="button"
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    goTo(i);
                                  }}
                                  aria-label={t('a11y.goToSlide', { n: i + 1 })}
                                  w="24px"
                                  h="3px"
                                  borderRadius="full"
                                  bg={active ? '#C9A961' : 'rgba(26,26,26,0.25)'}
                                  transition="background 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                                  _hover={{
                                    bg: active ? '#C9A961' : 'rgba(26,26,26,0.45)',
                                  }}
                                />
                              );
                            })}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </AspectRatio>
                </Box>
              </GridItem>

              {/* ── Content column ── */}
              <GridItem textAlign={{ md: 'start' }}>
                <Stack spacing={6} maxW={{ md: '520px' }}>
                  {/* Eyebrow */}
                  <HStack spacing={3} justify={{ md: 'flex-start' }} align="center">
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
                    fontSize={{ md: '44px', lg: '56px' }}
                    fontWeight={500}
                    color="warm.black"
                    lineHeight={1.1}
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {slideName}
                  </Text>

                  {/* Description */}
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

                  {/* Price */}
                  <Text fontSize="18px" color="accent.goldDeep" fontWeight={500}>
                    {formatStartingFrom(startingPrice, lang)}
                  </Text>

                  {/* CTA */}
                  <Box>
                    <Button
                      onClick={handleCtaClick}
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

      {/* ── Prev / Next section arrows ── */}
      {slides.length > 1 && (
        <>
          <Box
            {...ARROW_SX}
            left="24px"
            as="button"
            type="button"
            aria-label={t('hero.prev')}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              goPrev();
            }}
          >
            <ChevronLeft />
          </Box>
          <Box
            {...ARROW_SX}
            right="24px"
            as="button"
            type="button"
            aria-label={t('hero.next')}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              goNext();
            }}
          >
            <ChevronRight />
          </Box>
        </>
      )}
      {/* NOTE: No section-level dot indicators — they live inside the image card above. */}
    </Box>
  );
}

export default DesktopHero;
