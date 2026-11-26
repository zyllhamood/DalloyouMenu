import { Box, Button, Container, Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import Monogram from '../components/brand/Monogram';
import DesignTile from '../components/designs/DesignTile';
import OccasionsPackageButton from '../components/OccasionsPackageButton';
import Seo from '../components/Seo';
import Eyebrow from '../components/ui/Eyebrow';
import Reveal from '../components/ui/Reveal';
import SplitWords from '../components/ui/SplitWords';
import { WhatsAppGlyph } from '../components/WhatsAppIcon';
import { designIdeaUrl, useDesigns } from '../lib/designs';
import { EASE_OUT } from '../lib/motion';
import { breadcrumbJsonLd, designsJsonLd } from '../lib/seo';

const STEPS = [1, 2, 3] as const;
const TILE_SIZES = '(min-width: 62em) 300px, (min-width: 48em) 31vw, 46vw';

/**
 * Custom designs — cakes made to order. The gallery is the in-store
 * tablets' own «تصميمات خاصة», managed from the iPad admin. Orders come in
 * on WhatsApp ("send your idea").
 */
export default function DesignsPage() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { data, isLoading } = useDesigns();
  const designs = data?.designs ?? [];
  const title = data?.title || t('designs.title');

  return (
    <>
      <Seo
        title={t('seo.designsTitle')}
        description={t('seo.designsDesc')}
        path="/designs"
        jsonLd={[
          designsJsonLd(designs, t),
          breadcrumbJsonLd([
            { name: t('nav.home'), path: '/' },
            { name: title, path: '/designs' },
          ]),
        ]}
      />

      {/* ── Header ── */}
      <Box as="header" data-nav-theme="light" position="relative" overflow="hidden" pt={{ base: 'calc(var(--dy-nav-h) + 36px)', md: 'calc(var(--dy-nav-h) + 64px)' }} pb={{ base: 4, md: 6 }}>
        <Monogram
          large
          position="absolute"
          w={{ base: '320px', md: '520px' }}
          h={{ base: '320px', md: '520px' }}
          top={{ base: '-30px', md: '-60px' }}
          insetInlineEnd={{ base: '-130px', md: '-60px' }}
          opacity={0.08}
        />
        <Container maxW="1320px" position="relative">
          <Eyebrow>{t('designs.eyebrow')}</Eyebrow>
          <Flex mt={4} direction={{ base: 'column', lg: 'row' }} align={{ lg: 'flex-end' }} justify="space-between" gap={{ base: 6, lg: 10 }}>
            <Box maxW="720px">
              <Heading as="h1" fontFamily="display" fontWeight={700} fontSize={{ base: '46px', md: '72px' }} lineHeight={1.2}>
                <SplitWords text={title} />
              </Heading>
              <Text mt={3} color="text.muted" fontSize={{ base: '16px', md: '18px' }} lineHeight={1.8}>
                {t('designs.subtitle')}
              </Text>
            </Box>
            <Stack direction="row" spacing={3} align="center" flexShrink={0} flexWrap="wrap">
              <Button as="a" href={designIdeaUrl(t)} target="_blank" rel="noopener noreferrer" variant="noir" h="52px" px={7} leftIcon={<WhatsAppGlyph size={18} />}>
                {t('designs.sendIdea')}
              </Button>
              <OccasionsPackageButton h="52px" />
            </Stack>
          </Flex>

          {/* ── How it works ── */}
          <SimpleGrid as="ol" columns={{ base: 1, md: 3 }} spacing={{ base: 6, md: 10 }} mt={{ base: 10, md: 14 }} sx={{ listStyle: 'none' }}>
            {STEPS.map((n, i) => (
              <Reveal key={n} delay={i * 0.1}>
                <Box as="li" borderTop="1px solid" borderColor="rgba(143, 91, 30, 0.25)" pt={5} display="flex" gap={4}>
                  <Text lang="en" dir="ltr" fontFamily="latin" fontSize="15px" letterSpacing="0.14em" color="brand.700" pt="6px">
                    {String(n).padStart(2, '0')}
                  </Text>
                  <Box>
                    <Text fontFamily="display" fontWeight={700} fontSize={{ base: '22px', md: '24px' }} lineHeight={1.35}>
                      {t(`designs.step${n}Title`)}
                    </Text>
                    <Text mt={1} fontSize="15px" lineHeight={1.8} color="text.muted">
                      {t(`designs.step${n}Text`)}
                    </Text>
                  </Box>
                </Box>
              </Reveal>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ── The designs ── */}
      <Container maxW="1320px" pt={{ base: 8, md: 12 }} pb={{ base: 16, md: 24 }}>
        {isLoading ? (
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={{ base: 3, md: 8 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <Box key={i} className="dy-shimmer" borderRadius="24px" sx={{ aspectRatio: '1' }} />
            ))}
          </SimpleGrid>
        ) : designs.length === 0 ? (
          <Text textAlign="center" color="text.muted" fontSize="17px" lineHeight={1.9} py={16}>
            {t('designs.empty')}
          </Text>
        ) : (
          <SimpleGrid
            as={motion.ul}
            columns={{ base: 2, md: 3, lg: 4 }}
            spacingX={{ base: 3, md: 8 }}
            spacingY={{ base: 4, md: 10 }}
            sx={{ listStyle: 'none' }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          >
            {designs.map((design, i) => (
              <motion.li
                key={design.id}
                variants={{
                  hidden: { opacity: 0, y: reduce ? 0 : 26 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT, delay: Math.min(i, 8) * 0.06 } },
                }}
              >
                <DesignTile design={design} index={i} sizes={TILE_SIZES} />
              </motion.li>
            ))}
          </SimpleGrid>
        )}

        {/* ── A different idea ── */}
        <Reveal>
          <Flex
            mt={{ base: 14, md: 20 }}
            direction={{ base: 'column', md: 'row' }}
            align={{ md: 'center' }}
            justify="space-between"
            gap={6}
            p={{ base: 7, md: 10 }}
            borderRadius={{ base: '28px', md: '36px' }}
            bg="noir.800"
            color="text.onDark"
            className="dy-grain"
          >
            <Box position="relative" zIndex={1}>
              <Text fontFamily="display" fontWeight={700} fontSize={{ base: '28px', md: '36px' }} lineHeight={1.3}>
                {t('designs.ideaTitle')}
              </Text>
              <Text mt={2} color="text.onDarkMuted" fontSize={{ base: '15px', md: '16px' }} lineHeight={1.8}>
                {t('designs.ideaText')}
              </Text>
            </Box>
            <Button
              as="a"
              href={designIdeaUrl(t)}
              target="_blank"
              rel="noopener noreferrer"
              variant="gold"
              h="54px"
              px={8}
              flexShrink={0}
              position="relative"
              zIndex={1}
              leftIcon={<WhatsAppGlyph size={18} />}
            >
              {t('designs.sendIdea')}
            </Button>
          </Flex>
        </Reveal>
      </Container>

    </>
  );
}
