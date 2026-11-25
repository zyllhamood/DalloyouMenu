import { useRef } from 'react';
import { Box, Container, Flex, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowUpLeft, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { BRANCHES } from '../../config/links';
import { BRANCHES_ID } from '../../lib/useBranchesLink';
import AnimatedMonogram from '../brand/AnimatedMonogram';
import { COPY } from './content';
import { ARCH_RADIUS, CONTAINER_W, DUR, EASE, TYPE, VIEWPORT } from './tokens';
import HomeSection from './HomeSection';
import RevealWords from './RevealWords';
import SectionMarker from './SectionMarker';

/**
 * 7 · Visit. The page closes the way it opened: the monogram is signed once
 * more, smaller, like a seal at the foot of a letter. The two branches are
 * arched doorways; hovering one lets the light in from below.
 */
export function HomeVisit() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const sealRef = useRef<HTMLDivElement>(null);
  const sealInView = useInView(sealRef, VIEWPORT);

  return (
    <HomeSection id={BRANCHES_ID} surface="tint" aria-labelledby="home-visit-title">
      <Container maxW={CONTAINER_W}>
        <Flex direction="column" align="center" textAlign="center">
          <Box ref={sealRef} w={{ base: '64px', md: '76px' }} mb={{ base: 6, md: 8 }}>
            <AnimatedMonogram play={sealInView} duration={1.8} nib={!reduce} w="100%" sx={{ aspectRatio: '1' }} />
          </Box>
          <SectionMarker index={5} label={COPY.visit.marker} justify="center" />
          <RevealWords id="home-visit-title" as="h2" text={COPY.visit.title} mt={{ base: 5, md: 6 }} {...TYPE.title} />
          <RevealWords text={t('home.visitTitle')} delay={0.2} mt={{ base: 2, md: 3 }} color="text.muted" {...TYPE.lead} />
        </Flex>

        <SimpleGrid
          as={motion.div}
          columns={{ base: 1, md: 2 }}
          spacing={{ base: 5, md: 8 }}
          mt={{ base: 10, md: 14 }}
          maxW="980px"
          mx="auto"
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
        >
          {BRANCHES.map((branch, i) => (
            <motion.div
              key={branch.key}
              variants={{
                hidden: { opacity: 0, y: reduce ? 0 : 40 },
                show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE, delay: i * 0.12 } },
              }}
            >
            <Box
              as="a"
              href={branch.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              role="group"
              position="relative"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="flex-end"
              textAlign="center"
              overflow="hidden"
              borderRadius={ARCH_RADIUS}
              border="1px solid rgba(143, 91, 30, 0.28)"
              bg="ivory.50"
              minH={{ base: '360px', md: '440px' }}
              px={{ base: 6, md: 10 }}
              pb={{ base: 8, md: 10 }}
              sx={{ isolation: 'isolate' }}
              transition="border-color 500ms, box-shadow 600ms var(--dy-ease), transform 600ms var(--dy-ease)"
              _hover={{ borderColor: 'rgba(143, 91, 30, 0.5)', boxShadow: '0 40px 70px -45px rgba(110, 69, 21, 0.6)', transform: 'translateY(-4px)' }}
            >
              {/* Light coming in through the doorway */}
              <Box
                position="absolute"
                inset={0}
                zIndex={-1}
                transform="translateY(100%)"
                transition="transform 900ms var(--dy-ease)"
                _groupHover={{ transform: 'translateY(0)' }}
                sx={{ background: 'linear-gradient(0deg, rgba(227,183,117,0.34) 0%, rgba(241,221,179,0.16) 55%, rgba(241,221,179,0) 100%)' }}
              />
              {/* Inner frame */}
              <Box position="absolute" inset="10px" borderRadius="inherit" border="1px solid rgba(143, 91, 30, 0.14)" pointerEvents="none" />

              <Flex
                w="54px"
                h="54px"
                borderRadius="full"
                align="center"
                justify="center"
                bg="noir.800"
                color="brand.300"
                transition="transform 600ms var(--dy-ease)"
                _groupHover={{ transform: 'translateY(-6px)' }}
              >
                <MapPin size={22} strokeWidth={1.6} />
              </Flex>
              <Text mt={{ base: 6, md: 8 }} fontFamily="display" fontWeight={700} fontSize={{ base: '46px', md: '60px' }} lineHeight={1.15}>
                {t(`branches.${branch.key}.city`)}
              </Text>
              <Text mt={2} fontSize={{ base: '15px', md: '16px' }} color="text.muted">
                {t(`branches.${branch.key}.area`)}
              </Text>
              <HStack
                mt={{ base: 7, md: 9 }}
                spacing={2}
                color="brand.700"
                fontWeight={600}
                fontSize="15px"
                borderTop="1px solid"
                borderColor="rgba(143, 91, 30, 0.2)"
                pt={5}
                px={6}
              >
                <Text>{t('branches.directions')}</Text>
                <Box transition="transform 400ms var(--dy-ease)" _groupHover={{ transform: 'translate(-3px, -3px)' }}>
                  <ArrowUpLeft size={18} />
                </Box>
              </HStack>
            </Box>
            </motion.div>
          ))}
        </SimpleGrid>
      </Container>
    </HomeSection>
  );
}

export default HomeVisit;
