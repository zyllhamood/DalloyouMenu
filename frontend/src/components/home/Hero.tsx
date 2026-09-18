import { useMemo } from 'react';
import { Box, Button, Container, Grid, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import AppLogo from '../AppLogo';
import Monogram from '../brand/Monogram';
import Eyebrow from '../ui/Eyebrow';
import SplitWords from '../ui/SplitWords';
import HeroShowcase from './HeroShowcase';
import { DELIVERY_APPS } from '../../config/links';
import { useMenuIndex } from '../../lib/menu';
import { EASE_OUT } from '../../lib/motion';
import { useUiStore } from '../../stores/uiStore';

/** Deterministic pseudo-random numbers, so the particles never jump between renders. */
function seeded(seed: number) {
  let state = seed * 9301 + 49297;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

const PARTICLES = Array.from({ length: 22 }, (_, i) => {
  const rand = seeded(i + 1);
  return {
    left: `${(rand() * 100).toFixed(2)}%`,
    top: `${(30 + rand() * 70).toFixed(2)}%`,
    size: 1.4 + rand() * 2.6,
    duration: 8 + rand() * 9,
    delay: -rand() * 14,
    drift: `${((rand() - 0.5) * 60).toFixed(1)}px`,
    opacity: (0.25 + rand() * 0.55).toFixed(2),
  };
});

function HeroBackdrop({ play }: { play: boolean }) {
  const reduce = useReducedMotion();
  return (
    <Box position="absolute" inset={0} pointerEvents="none" aria-hidden>
      <Box
        position="absolute"
        inset={0}
        sx={{
          background: {
            base: 'radial-gradient(70% 45% at 50% 60%, rgba(194,134,62,0.22), rgba(194,134,62,0) 70%)',
            lg: 'radial-gradient(45% 55% at 28% 52%, rgba(194,134,62,0.24), rgba(194,134,62,0) 70%), radial-gradient(30% 30% at 90% 8%, rgba(194,134,62,0.08), rgba(194,134,62,0) 70%)',
          },
        }}
      />
      <Monogram
        large
        position="absolute"
        w={{ base: '120vw', lg: '62vw' }}
        h={{ base: '120vw', lg: '62vw' }}
        maxW="880px"
        maxH="880px"
        top={{ base: '-18%', lg: '-22%' }}
        insetInlineStart={{ base: '-40%', lg: '-12%' }}
        opacity={0.045}
      />
      {!reduce &&
        PARTICLES.map((p, i) => (
          <Box
            key={i}
            position="absolute"
            left={p.left}
            top={p.top}
            w={`${p.size}px`}
            h={`${p.size}px`}
            borderRadius="full"
            bg="brand.300"
            boxShadow="0 0 6px rgba(227,183,117,0.8)"
            opacity={play ? 1 : 0}
            transition="opacity 2s"
            sx={{
              '--dy-p-x': p.drift,
              '--dy-p-o': p.opacity,
              animation: `dy-float ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      {/* Fade into the marquee band below */}
      <Box position="absolute" insetInline={0} bottom={0} h="120px" sx={{ background: 'linear-gradient(180deg, rgba(14,11,8,0), rgba(14,11,8,0.9))' }} />
    </Box>
  );
}

/**
 * The opening: noir, a line of gold, and one of the house's creations
 * standing in a lit arch. Its entrance waits for the intro curtain.
 */
export function Hero() {
  const { t, i18n } = useTranslation();
  const introActive = useUiStore((s) => s.introActive);
  const openOrder = useUiStore((s) => s.openOrder);
  const { index, isLoading } = useMenuIndex();
  const play = !introActive;
  const rtl = i18n.dir() === 'rtl';

  const showcase = useMemo(() => {
    const pool = index.featured.length ? index.featured : index.fresh.length ? index.fresh : index.products;
    return pool.slice(0, 8);
  }, [index]);

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: play ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 1, ease: EASE_OUT, delay },
  });

  return (
    <Box
      as="section"
      data-nav-theme="dark"
      className="dy-grain"
      position="relative"
      bg="noir.800"
      color="text.onDark"
      overflow="hidden"
      minH={{ base: '100svh', lg: '100vh' }}
      display="flex"
      alignItems="center"
    >
      <HeroBackdrop play={play} />

      <Container
        maxW="1320px"
        position="relative"
        zIndex={1}
        pt={{ base: 'calc(var(--dy-nav-h) + 10px)', lg: 'calc(var(--dy-nav-h) + 24px)' }}
        pb={{ base: 9, md: 14 }}
      >
        <Grid
          templateAreas={{ base: `"copy" "show" "cta"`, lg: `"copy show" "cta show"` }}
          templateColumns={{ base: '1fr', lg: '1.1fr 0.9fr' }}
          templateRows={{ lg: '1fr 1fr' }}
          columnGap={{ lg: 16 }}
          rowGap={{ base: 5, md: 10, lg: 0 }}
        >
          <Box gridArea="copy" alignSelf={{ lg: 'end' }} textAlign={{ base: 'center', lg: 'start' }} pb={{ lg: 10 }}>
            <motion.div {...reveal(0.05)}>
              <Eyebrow latin tone="dark" justify={{ base: 'center', lg: 'flex-start' }}>
                Pâtisserie · Chocolaterie · Cakes
              </Eyebrow>
            </motion.div>
            <Heading
              as="h1"
              mt={{ base: 4, md: 7 }}
              fontFamily="display"
              fontWeight={700}
              fontSize={{ base: '40px', sm: '54px', md: '72px', xl: '90px' }}
              lineHeight={1.2}
              color="text.onDark"
            >
              <SplitWords text={t('hero.line1')} play={play} delay={0.2} />
              <br />
              <SplitWords text={t('hero.line2')} play={play} delay={0.45} wordClassName="dy-metal-text" />
            </Heading>
          </Box>

          <Box gridArea="show" alignSelf="center">
            <HeroShowcase products={showcase} loading={isLoading} play={play} />
          </Box>

          <Box gridArea="cta" alignSelf={{ lg: 'start' }}>
            <motion.div {...reveal(0.85)}>
              <Stack direction="row" spacing={3} justify={{ base: 'center', lg: 'flex-start' }}>
                <Button
                  as={RouterLink}
                  to="/menu"
                  variant="gold"
                  size="lg"
                  h={{ base: '52px', md: '58px' }}
                  px={{ base: 5, md: 9 }}
                  flex={{ base: 1, sm: 'none' }}
                  maxW={{ base: '220px', sm: 'none' }}
                  rightIcon={rtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                >
                  {t('hero.ctaMenu')}
                </Button>
                <Button
                  variant="ghostOnDark"
                  size="lg"
                  h={{ base: '52px', md: '58px' }}
                  px={{ base: 5, md: 8 }}
                  flex={{ base: 1, sm: 'none' }}
                  maxW={{ base: '180px', sm: 'none' }}
                  onClick={openOrder}
                >
                  {t('hero.ctaOrder')}
                </Button>
              </Stack>

              <HStack mt={9} spacing={4} display={{ base: 'none', lg: 'flex' }}>
                <Text fontSize="13px" color="text.onDarkMuted">
                  {t('hero.alsoOn')}
                </Text>
                <HStack spacing={2}>
                  {DELIVERY_APPS.map((app) => (
                    <Box
                      key={app.key}
                      as="a"
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t(`apps.${app.key}`)}
                      title={t(`apps.${app.key}`)}
                      opacity={0.85}
                      transition="opacity 300ms, transform 300ms"
                      _hover={{ opacity: 1, transform: 'translateY(-2px)' }}
                    >
                      <AppLogo app={app.key} size={28} />
                    </Box>
                  ))}
                </HStack>
              </HStack>
            </motion.div>
          </Box>
        </Grid>
      </Container>

      {/* Scroll cue */}
      <Box
        position="absolute"
        bottom={7}
        left="50%"
        transform="translateX(-50%)"
        display={{ base: 'none', md: 'flex' }}
        flexDirection="column"
        alignItems="center"
        gap={3}
        zIndex={1}
        opacity={play ? 0.7 : 0}
        transition="opacity 1.2s 1.4s"
        aria-hidden
      >
        <Text fontSize="12px" color="text.onDarkMuted">
          {t('hero.scroll')}
        </Text>
        <Box w="1px" h="46px" bg="rgba(227,183,117,0.2)" overflow="hidden" position="relative">
          <Box position="absolute" top={0} insetInline={0} h="40%" bg="brand.400" sx={{ animation: 'dy-cue 2.4s var(--dy-ease-in-out) infinite' }} />
        </Box>
      </Box>
    </Box>
  );
}

export default Hero;
