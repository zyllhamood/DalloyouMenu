import { Box, Container, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { ArrowUpLeft, ArrowUpRight, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ArchOutline } from '../brand/Arch';
import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';
import { BRANCHES } from '../../config/links';
import { BRANCHES_ID } from '../../lib/useBranchesLink';

/** "Visit us" — the two branches, each a doorway to the map. */
export function VisitSection() {
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === 'rtl';

  return (
    <Box
      as="section"
      id={BRANCHES_ID}
      data-nav-theme="light"
      bg="ivory.200"
      py={{ base: 20, md: 28, xl: 32 }}
      aria-labelledby="home-visit"
    >
      <Container maxW="1320px">
        <SectionHeader
          headingId="home-visit"
          align="center"
          eyebrow={t('home.visitEyebrow')}
          title={t('home.visitTitle')}
          subtitle={t('home.visitSubtitle')}
        />

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 8 }} mt={{ base: 10, md: 14 }} maxW="1060px" mx="auto">
          {BRANCHES.map((branch, i) => (
            <Reveal key={branch.key} delay={i * 0.12}>
              <Box
                as="a"
                href={branch.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                role="group"
                position="relative"
                display="block"
                overflow="hidden"
                px={{ base: 7, md: 10 }}
                pt={{ base: 8, md: 10 }}
                pb={{ base: 7, md: 9 }}
                borderRadius="30px"
                bg="ivory.50"
                border="1px solid"
                borderColor="border.subtle"
                transition="transform 500ms var(--dy-ease), box-shadow 500ms var(--dy-ease), border-color 500ms"
                _hover={{
                  transform: 'translateY(-4px)',
                  borderColor: 'rgba(143, 91, 30, 0.35)',
                  boxShadow: '0 34px 60px -38px rgba(110, 69, 21, 0.55)',
                }}
              >
                <Box
                  position="absolute"
                  top="-26px"
                  insetInlineEnd="-26px"
                  w={{ base: '150px', md: '190px' }}
                  h={{ base: '188px', md: '238px' }}
                  opacity={0.9}
                  transition="transform 900ms var(--dy-ease)"
                  _groupHover={{ transform: 'translateY(6px)' }}
                  aria-hidden
                >
                  <ArchOutline color="rgba(194, 134, 62, 0.3)" duration={2.4} delay={0.2} />
                </Box>

                <Box
                  display="grid"
                  placeItems="center"
                  w="50px"
                  h="50px"
                  borderRadius="full"
                  bg="noir.800"
                  color="brand.300"
                  transition="transform 500ms var(--dy-ease)"
                  _groupHover={{ transform: 'scale(1.06)' }}
                >
                  <MapPin size={21} strokeWidth={1.6} />
                </Box>

                <Text mt={{ base: 7, md: 9 }} fontFamily="display" fontWeight={700} fontSize={{ base: '44px', md: '58px' }} lineHeight={1.15}>
                  {t(`branches.${branch.key}.city`)}
                </Text>
                <Text mt={1.5} fontSize={{ base: '15px', md: '16px' }} color="text.muted">
                  {t(`branches.${branch.key}.area`)}
                </Text>

                <HStack
                  mt={{ base: 7, md: 9 }}
                  spacing={2}
                  color="brand.700"
                  fontWeight={600}
                  fontSize="15px"
                  borderTop="1px solid"
                  borderColor="border.subtle"
                  pt={5}
                >
                  <Text>{t('branches.directions')}</Text>
                  <Box transition="transform 400ms var(--dy-ease)" _groupHover={{ transform: rtl ? 'translate(-3px, -3px)' : 'translate(3px, -3px)' }}>
                    {rtl ? <ArrowUpLeft size={18} /> : <ArrowUpRight size={18} />}
                  </Box>
                </HStack>
              </Box>
            </Reveal>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

export default VisitSection;
