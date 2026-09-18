import { useRef } from 'react';
import { Box, Container, SimpleGrid, Text } from '@chakra-ui/react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { Hand, Sparkles, Sun, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Eyebrow from '../ui/Eyebrow';
import Reveal from '../ui/Reveal';
import { normalizeArabic } from '../../lib/menu';

/** Words of the statement set in gold as they light up. */
const HIGHLIGHTS = new Set(
  ['الحرفة', 'الفرنسية', 'الضيافة', 'السعودية', 'يدوياً', 'طازجة', 'French', 'craft', 'Saudi', 'hospitality', 'hand', 'fresh'].map(
    (w) => normalizeArabic(w),
  ),
);

function Word({ word, range, progress, gold }: { word: string; range: [number, number]; progress: MotionValue<number>; gold: boolean }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <>
      <motion.span style={{ opacity, color: gold ? 'var(--dy-gold-light)' : undefined }}>{word}</motion.span>{' '}
    </>
  );
}

/** The brand statement, lit word by word as it scrolls through the viewport. */
function ScrollLitText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.82', 'end 0.42'] });
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <Text
      as="p"
      ref={ref}
      fontFamily="display"
      fontWeight={700}
      fontSize={{ base: '29px', md: '44px', xl: '54px' }}
      lineHeight={1.6}
      color="text.onDark"
      maxW="1080px"
    >
      {reduce
        ? text
        : words.map((word, i) => (
            <Word
              key={`${word}-${i}`}
              word={word}
              progress={scrollYProgress}
              range={[i / words.length, (i + 1) / words.length]}
              gold={HIGHLIGHTS.has(normalizeArabic(word))}
            />
          ))}
    </Text>
  );
}

const PILLARS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Hand, title: 'home.pillarHand', text: 'home.pillarHandText' },
  { icon: Sun, title: 'home.pillarFresh', text: 'home.pillarFreshText' },
  { icon: Sparkles, title: 'home.pillarCraft', text: 'home.pillarCraftText' },
];

export function StorySection() {
  const { t } = useTranslation();

  return (
    <Box as="section" data-nav-theme="dark" className="dy-grain" bg="noir.800" color="text.onDark" py={{ base: 24, md: 36, xl: 44 }} overflow="hidden">
      <Container maxW="1320px" position="relative" zIndex={1}>
        <Eyebrow tone="dark" mb={{ base: 7, md: 10 }}>
          {t('home.storyEyebrow')}
        </Eyebrow>
        <ScrollLitText text={t('brand.statement')} />

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 10, md: 12 }} mt={{ base: 16, md: 24 }}>
          {PILLARS.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.12}>
              <Box borderTop="1px solid rgba(227, 183, 117, 0.18)" pt={{ base: 7, md: 9 }}>
                <Box
                  display="grid"
                  placeItems="center"
                  w="54px"
                  h="54px"
                  borderRadius="full"
                  border="1px solid rgba(227, 183, 117, 0.35)"
                  color="brand.300"
                >
                  <Icon size={22} strokeWidth={1.5} />
                </Box>
                <Text mt={6} fontFamily="display" fontWeight={700} fontSize={{ base: '24px', md: '27px' }}>
                  {t(title)}
                </Text>
                <Text mt={2} fontSize="15.5px" lineHeight={1.85} color="text.onDarkMuted" maxW="320px">
                  {t(text)}
                </Text>
              </Box>
            </Reveal>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

export default StorySection;
