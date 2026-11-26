import { useRef } from 'react';
import { Box, Button, Container, Flex, Grid, Text } from '@chakra-ui/react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';

import OccasionsPackageButton from '../OccasionsPackageButton';
import { WhatsAppGlyph } from '../WhatsAppIcon';
import { createWhatsAppUrl } from '../../config/links';
import { COPY } from './content';
import { ARCH_RADIUS, CONTAINER_W, TYPE } from './tokens';
import HomeSection from './HomeSection';
import RevealWords from './RevealWords';
import SectionMarker from './SectionMarker';

type Occasion = (typeof COPY.occasions.items)[number];

interface CardProps {
  occasion: Occasion;
  index: number;
  count: number;
  progress: MotionValue<number>;
}

/**
 * One occasion. Cards stick one after another below the navbar; as the next
 * slides up over it, the one beneath settles back (shrinks and dims), so the
 * stack reads like invitation cards laid on a table.
 */
function OccasionCard({ occasion, index, count, progress }: CardProps) {
  const reduce = useReducedMotion();
  const dark = index % 2 === 1;
  const targetScale = 1 - (count - 1 - index) * 0.045;
  // This card is on top from index/count; the next one covers it over the following slice.
  const covered = (index + 0.55) / count;
  const scale = useTransform(progress, [covered, 1], [1, reduce ? 1 : targetScale]);
  const dim = useTransform(progress, [covered, Math.min(1, covered + 0.7 / count)], [0, reduce ? 0 : 0.2]);
  const last = index === count - 1;

  return (
    <Box
      position="sticky"
      top={{ base: `calc(72px + ${index * 8}px)`, md: `calc(104px + ${index * 16}px)` }}
      h={{ base: 'auto', lg: '560px' }}
      mb={last ? 0 : { base: '28vh', md: '30vh' }}
    >
      <motion.div style={{ scale, transformOrigin: '50% 0%', height: '100%' }}>
        <Grid
          position="relative"
          h="100%"
          templateColumns={{ base: '1fr', md: '0.9fr 1.1fr', lg: '0.95fr 1.05fr' }}
          overflow="hidden"
          borderRadius={{ base: '28px', md: '40px' }}
          bg={dark ? 'noir.800' : 'ivory.50'}
          color={dark ? 'text.onDark' : 'text.primary'}
          border="1px solid"
          borderColor={dark ? 'rgba(227, 183, 117, 0.18)' : 'border.subtle'}
          boxShadow="0 40px 80px -50px rgba(62, 38, 14, 0.6)"
          className={dark ? 'dy-grain' : undefined}
        >
          {/* The occasion's own scene, in an arch */}
          <Box position="relative" p={{ base: 4, md: 6, lg: 7 }} pb={{ base: 0, md: 6, lg: 7 }} h={{ lg: '100%' }} zIndex={1}>
            <Box
              position="relative"
              overflow="hidden"
              borderRadius={ARCH_RADIUS}
              bg="ivory.300"
              // The scenes are square and shown whole. On phones the square follows the
              // screen's height (centred, smaller on short phones), so the pinned card
              // keeps its button above the bottom bar.
              w={{ base: 'min(100%, clamp(170px, calc(100svh - 440px), 420px))', md: '100%' }}
              mx="auto"
              h={{ lg: '100%' }}
              sx={{ aspectRatio: { base: '1', lg: 'auto' } }}
            >
              <Box
                as="img"
                src={`${occasion.image}-1200.webp`}
                srcSet={`${occasion.image}-640.webp 640w, ${occasion.image}-1200.webp 1200w`}
                sizes="(min-width: 62em) 540px, (min-width: 48em) 45vw, 92vw"
                alt={occasion.title}
                loading="lazy"
                decoding="async"
                draggable={false}
                position="absolute"
                inset={0}
                w="100%"
                h="100%"
                objectFit="cover"
                objectPosition={{ base: '50% 50%', lg: '50% 60%' }}
              />
              <Box
                position="absolute"
                inset={{ base: '6px', md: '10px' }}
                borderRadius="inherit"
                border="1px solid rgba(244, 238, 227, 0.4)"
                pointerEvents="none"
              />
            </Box>
          </Box>

          {/* Words */}
          <Flex
            position="relative"
            zIndex={1}
            direction="column"
            justify="center"
            px={{ base: 6, md: 8, lg: 12, xl: 16 }}
            pt={{ base: 4, md: 8, lg: 10 }}
            pb={{ base: 5, md: 8, lg: 10 }}
          >
            <Text lang="en" dir="ltr" alignSelf="flex-end" fontFamily="latin" fontSize={{ base: '34px', md: '72px' }} lineHeight={1} color={dark ? 'rgba(227,183,117,0.22)' : 'rgba(143,91,30,0.16)'}>
              {String(index + 1).padStart(2, '0')}
            </Text>
            <Text {...TYPE.card} fontSize={{ base: '27px', md: '42px', xl: '48px' }} mt={{ base: -2, md: -2 }}>
              {occasion.title}
            </Text>
            <Text mt={{ base: 3, md: 4 }} maxW="420px" color={dark ? 'text.onDarkMuted' : 'text.muted'} {...TYPE.lead}>
              {occasion.text}
            </Text>

            <Flex mt={{ base: 4, md: 9 }} gap={3} wrap="wrap">
              <Button
                as="a"
                href={createWhatsAppUrl(COPY.occasions.message(occasion.title))}
                target="_blank"
                rel="noopener noreferrer"
                variant={dark ? 'gold' : 'noir'}
                h={{ base: '48px', md: '52px' }}
                px={6}
                leftIcon={<WhatsAppGlyph size={18} />}
              >
                {COPY.occasions.cta}
              </Button>
            </Flex>
          </Flex>

          {/* The dimming veil as a newer card covers this one */}
          <motion.div
            aria-hidden
            style={{ position: 'absolute', inset: 0, zIndex: 2, background: '#0E0B08', opacity: dim, pointerEvents: 'none' }}
          />
        </Grid>
      </motion.div>
    </Box>
  );
}

/**
 * 4 · Occasions. What the house makes for a wedding, a birthday, a
 * graduation, the seasons and the office — each a card in a stack, each one
 * a direct line to WhatsApp with the occasion already written.
 */
export function HomeOccasions() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });


  return (
    <HomeSection surface="tint" aria-labelledby="home-occasions-title">
      <Container maxW={CONTAINER_W}>
        <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'flex-start', md: 'flex-end' }} justify="space-between" gap={{ base: 6, md: 8 }}>
          <Box maxW="720px">
            <SectionMarker index={2} label={COPY.occasions.marker} />
            <RevealWords id="home-occasions-title" as="h2" text={COPY.occasions.title} gold={['داليو']} mt={{ base: 5, md: 6 }} {...TYPE.title} />
            <RevealWords text={COPY.occasions.sub} delay={0.25} mt={{ base: 3, md: 4 }} color="text.muted" maxW="560px" {...TYPE.lead} />
          </Box>
          {/* The occasions package (the trays catalogue, a PDF) for anyone planning ahead. */}
          <OccasionsPackageButton flexShrink={0} />
        </Flex>

        <Box ref={ref} mt={{ base: 10, md: 16 }}>
          {COPY.occasions.items.map((occasion, i) => (
            <OccasionCard
              key={occasion.key}
              occasion={occasion}
              index={i}
              count={COPY.occasions.items.length}
              progress={scrollYProgress}
            />
          ))}
        </Box>
      </Container>
    </HomeSection>
  );
}

export default HomeOccasions;
