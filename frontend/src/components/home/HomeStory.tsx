import { useRef } from 'react';
import { Box, Container, Grid, SimpleGrid, Text, useMediaQuery } from '@chakra-ui/react';
import { motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { Hand, Sparkles, Sun, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import AnimatedMonogram from '../brand/AnimatedMonogram';
import { COPY } from './content';
import { CONTAINER_W, VIEWPORT } from './tokens';
import HomeSection from './HomeSection';
import SectionMarker from './SectionMarker';

function Word({ word, range, progress, gold }: { word: string; range: [number, number]; progress: MotionValue<number>; gold: boolean }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <>
      <motion.span style={{ opacity, color: gold ? 'var(--dy-gold-light)' : undefined }}>{word}</motion.span>{' '}
    </>
  );
}

const PILLARS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Hand, title: 'home.pillarHand', text: 'home.pillarHandText' },
  { icon: Sun, title: 'home.pillarFresh', text: 'home.pillarFreshText' },
  { icon: Sparkles, title: 'home.pillarCraft', text: 'home.pillarCraftText' },
];

const PEN_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

/** A pillar whose rule and icon are drawn with the same pen as the monogram. */
function Pillar({ icon: Icon, title, text, index }: { icon: LucideIcon; title: string; text: string; index: number }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, VIEWPORT);
  const on = inView || Boolean(reduce);
  const delay = index * 0.14;

  return (
    <Box
      ref={ref}
      position="relative"
      pt={{ base: 7, md: 9 }}
      opacity={on ? 1 : 0}
      transform={on ? 'none' : 'translateY(24px)'}
      transition={`opacity 900ms var(--dy-ease) ${delay}s, transform 900ms var(--dy-ease) ${delay}s`}
    >
      <Box
        position="absolute"
        top={0}
        insetInline={0}
        h="1px"
        bg="rgba(227, 183, 117, 0.28)"
        transformOrigin="right"
        transform={on ? 'scaleX(1)' : 'scaleX(0)'}
        transition={`transform 1.2s ${PEN_EASE} ${delay}s`}
      />
      <Box
        display="grid"
        placeItems="center"
        w="56px"
        h="56px"
        borderRadius="full"
        border="1px solid rgba(227, 183, 117, 0.35)"
        color="brand.300"
        sx={{
          // Every line of the icon is drawn in (dash longer than any segment).
          'svg *': {
            strokeDasharray: 80,
            strokeDashoffset: on ? 0 : 80,
            transition: `stroke-dashoffset 1.8s ${PEN_EASE} ${delay + 0.35}s`,
          },
        }}
      >
        <Icon size={23} strokeWidth={1.4} />
      </Box>
      <Text
        lang="en"
        dir="ltr"
        position="absolute"
        top={{ base: 7, md: 9 }}
        insetInlineEnd={0}
        fontFamily="latin"
        fontSize="13px"
        letterSpacing="0.16em"
        color="rgba(227,183,117,0.55)"
      >
        {String(index + 1).padStart(2, '0')}
      </Text>
      <Text mt={6} fontFamily="display" fontWeight={700} fontSize={{ base: '25px', md: '28px' }}>
        {t(title)}
      </Text>
      <Text mt={2} fontSize="15.5px" lineHeight={1.85} color="text.onDarkMuted" maxW="320px">
        {t(text)}
      </Text>
    </Box>
  );
}

/**
 * 5 · Story. The house statement lights up word by word as it is read —
 * and beside it, the monogram from the overture is written again, this
 * time by the scroll itself: the reader's progress is the pen.
 */
export function HomeStory() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.45'] });
  const words = t('brand.statement').split(/\s+/).filter(Boolean);
  const gold = new Set<string>(COPY.story.gold);
  // The pen runs a little ahead of the words and is done before the last line.
  const pen = useTransform(scrollYProgress, [0, 0.85], [0, 1]);
  // Beside the text on desktop the monogram drifts against the scroll; on
  // phones it sits above the text and stays put.
  const [isDesktop] = useMediaQuery('(min-width: 62em)', { ssr: false });
  const drift = reduce || !isDesktop ? 0 : 60;
  const markY = useTransform(scrollYProgress, [0, 1], [drift, -drift]);

  return (
    <HomeSection surface="noir" overflow="hidden" aria-labelledby="home-story-title">
      <Container maxW={CONTAINER_W} position="relative" zIndex={1}>
        <SectionMarker index={3} label={COPY.story.marker} tone="dark" />

        <Grid ref={ref} templateColumns={{ base: '1fr', lg: '1fr 0.42fr' }} gap={{ base: 10, lg: 16 }} alignItems="center" mt={{ base: 8, md: 12 }}>
          <Text
            as="h2"
            id="home-story-title"
            fontFamily="display"
            fontWeight={700}
            fontSize={{ base: '30px', md: '46px', xl: '56px' }}
            lineHeight={1.6}
            color="text.onDark"
          >
            {reduce
              ? t('brand.statement')
              : words.map((word, i) => (
                  <Word
                    key={`${word}-${i}`}
                    word={word}
                    progress={scrollYProgress}
                    range={[i / words.length, (i + 1) / words.length]}
                    gold={gold.has(word)}
                  />
                ))}
          </Text>

          <Box as={motion.div} order={{ base: -1, lg: 0 }} style={{ y: markY }}>
            <Box position="relative" w={{ base: '42%', sm: '36%', lg: '100%' }} maxW="380px" mx={{ base: 'auto', lg: 0 }} aria-hidden>
              <Box
                position="absolute"
                inset="-25%"
                pointerEvents="none"
                sx={{ background: 'radial-gradient(closest-side, rgba(194,134,62,0.2), rgba(194,134,62,0) 70%)' }}
              />
              <AnimatedMonogram progress={reduce ? undefined : pen} play={Boolean(reduce)} w="100%" sx={{ aspectRatio: '1' }} />
            </Box>
          </Box>
        </Grid>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 10, md: 12 }} mt={{ base: 16, md: 24 }}>
          {PILLARS.map((pillar, i) => (
            <Pillar key={pillar.title} {...pillar} index={i} />
          ))}
        </SimpleGrid>
      </Container>
    </HomeSection>
  );
}

export default HomeStory;
