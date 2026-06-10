/**
 * HomeHero — parent component that owns carousel state and renders
 * the correct sub-hero based on viewport width.
 *
 *  < 768px (base)  → MobileHero  (full-bleed image + swipe)
 *  ≥ 768px (md)    → DesktopHero (two-column layout)
 *
 * Both components are always mounted (CSS display, not conditional
 * rendering) so the shared carousel state never resets on resize.
 */

import { useEffect, useMemo } from 'react';
import { Box, Container, Skeleton, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

import type { Product } from '../lib/api';
import { useCarousel } from '../hooks/useCarousel';
import { MobileHero } from './MobileHero';
import { DesktopHero } from './DesktopHero';

interface HomeHeroProps {
  products: Product[];
  isLoading?: boolean;
}

const HERO_INTERVAL_MS = 5000;

function shuffleProducts(products: Product[]): Product[] {
  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function HomeHero({ products, isLoading = false }: HomeHeroProps) {
  const { t } = useTranslation();

  const slides = useMemo(
    () => shuffleProducts(products.filter((p) => p.styled_image)),
    [products],
  );

  const carousel = useCarousel({ length: slides.length, interval: HERO_INTERVAL_MS });

  // Preload the next slide's image to avoid flash on transition
  useEffect(() => {
    if (slides.length < 2) return;
    const next = slides[(carousel.currentIndex + 1) % slides.length];
    const url = next.styled_image;
    if (!url) return;
    const img = new Image();
    img.src = url;
  }, [carousel.currentIndex, slides]);

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Box
        bg="warm.cream"
        minH={{ base: '100vw', md: '85vh' }}
        display="grid"
        placeItems="center"
        /* Account for negative margin applied by HomePage */
        pt={{ base: '72px', md: '88px' }}
      >
        <Skeleton
          h={{ base: '80vw', md: '60vh' }}
          w="min(90vw, 480px)"
          borderRadius="lg"
          startColor="warm.cream"
          endColor="border.subtle"
        />
      </Box>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (slides.length === 0) {
    return (
      <Box
        minH={{ base: '100vw', md: '85vh' }}
        bg="warm.cream"
        display="flex"
        alignItems="center"
        justifyContent="center"
        pt={{ base: '72px', md: '88px' }}
      >
        <Container maxW="1280px" textAlign="center">
          <Text
            fontSize="11px"
            letterSpacing="0.32em"
            textTransform="uppercase"
            color="accent.gold"
            mb={4}
          >
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

  return (
    <>
      {/* ── Mobile (< 768px) ── */}
      <Box display={{ base: 'block', md: 'none' }}>
        <MobileHero slides={slides} carousel={carousel} navbarHeight={72} />
      </Box>

      {/* ── Desktop / Tablet (≥ 768px) ── */}
      <Box display={{ base: 'none', md: 'block' }}>
        <DesktopHero slides={slides} carousel={carousel} />
      </Box>
    </>
  );
}

export default HomeHero;
