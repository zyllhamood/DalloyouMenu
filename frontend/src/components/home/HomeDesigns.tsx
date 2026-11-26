import { Box, Button, Container, Flex, HStack } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import DesignTile from '../designs/DesignTile';
import { WhatsAppGlyph } from '../WhatsAppIcon';
import { designIdeaUrl, useDesigns } from '../../lib/designs';
import HomeSection from './HomeSection';
import RevealWords from './RevealWords';
import SectionMarker from './SectionMarker';
import { CONTAINER_W, DUR, EASE, TYPE, VIEWPORT } from './tokens';

const SHOWN = 8;
const TILE_SIZES = '(min-width: 62em) 300px, (min-width: 48em) 24vw, 62vw';

/**
 * 3 · Custom designs — right after the occasions, as their natural next
 * step: cakes the house has designed to order, standing free on the ivory
 * (they're photographed on it); the rest are on /designs. Hidden when the
 * iPad admin hides the gallery or it is empty.
 */
export function HomeDesigns() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { data } = useDesigns();
  const designs = data?.designs ?? [];
  if (!designs.length) return null;

  const title = data?.title || t('designs.title');
  const shown = designs.slice(0, SHOWN);

  const actions = (
    <>
      <Button as={RouterLink} to="/designs" variant="outlineInk" h="50px" px={6} rightIcon={<ArrowLeft size={17} />}>
        {t('designs.viewAll')}
      </Button>
      <Button as="a" href={designIdeaUrl(t)} target="_blank" rel="noopener noreferrer" variant="noir" h="50px" px={6} leftIcon={<WhatsAppGlyph size={18} />}>
        {t('designs.sendIdea')}
      </Button>
    </>
  );

  return (
    <HomeSection surface="ivory" aria-labelledby="home-designs-title">
      <Container maxW={CONTAINER_W}>
        <Flex direction={{ base: 'column', md: 'row' }} align={{ md: 'flex-end' }} justify="space-between" gap={6}>
          <Box maxW="680px">
            <SectionMarker index={3} label={title} />
            <RevealWords id="home-designs-title" as="h2" text={t('designs.homeTitle')} mt={{ base: 5, md: 6 }} {...TYPE.title} />
            <RevealWords text={t('designs.homeSub')} delay={0.25} mt={{ base: 3, md: 4 }} color="text.muted" {...TYPE.lead} />
          </Box>
          <HStack spacing={3} flexShrink={0} display={{ base: 'none', md: 'flex' }}>
            {actions}
          </HStack>
        </Flex>

        <Box
          as={motion.ul}
          mt={{ base: 8, md: 12 }}
          className="dy-no-scrollbar"
          display="grid"
          gridAutoFlow={{ base: 'column', md: 'row' }}
          gridAutoColumns={{ base: '62%', sm: '40%' }}
          gridTemplateColumns={{ md: 'repeat(4, minmax(0, 1fr))' }}
          columnGap={{ base: 2, md: 6 }}
          rowGap={{ md: 6 }}
          overflowX={{ base: 'auto', md: 'visible' }}
          mx={{ base: -5, md: 0 }}
          px={{ base: 5, md: 0 }}
          sx={{ listStyle: 'none', scrollSnapType: { base: 'x mandatory', md: 'none' }, scrollPaddingInline: { base: '20px', md: 0 } }}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          {shown.map((design, i) => (
            <Box
              as={motion.li}
              key={design.id}
              sx={{ scrollSnapAlign: 'start' }}
              variants={{
                hidden: { opacity: 0, y: reduce ? 0 : 30 },
                show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE, delay: i * 0.06 } },
              }}
            >
              <DesignTile design={design} index={i} sizes={TILE_SIZES} />
            </Box>
          ))}
        </Box>

        <Flex mt={6} gap={3} direction="column" display={{ base: 'flex', md: 'none' }}>
          {actions}
        </Flex>
      </Container>

    </HomeSection>
  );
}

export default HomeDesigns;
