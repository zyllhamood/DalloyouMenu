/**
 * BranchesSection — homepage section 5.
 *
 * Promotes the two branches out of the footer into their own section, on the
 * warm tint so it reads as a distinct "come visit us" moment between the
 * product grid and the footer.
 */

import {
  Box,
  Container,
  Link as ChakraLink,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import SectionHeading from './SectionHeading';
import { BRANCH_DAMMAM_MAPS_URL, BRANCH_KHOBAR_MAPS_URL } from '../config/links';

const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

interface BranchCardProps {
  city: string;
  district: string;
  mapsUrl: string;
  openInMaps: string;
}

function BranchCard({ city, district, mapsUrl, openInMaps }: BranchCardProps) {
  return (
    <Stack
      spacing={0}
      bg="bg.surface"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      boxShadow="soft"
      px={{ base: 6, md: 8 }}
      py={{ base: 7, md: 9 }}
      h="100%"
      transition={`all 400ms ${EASE}`}
      _hover={{ borderColor: 'border.gold', boxShadow: 'softHover', transform: 'translateY(-3px)' }}
    >
      <Box h="1px" w="32px" bg="accent.gold" opacity={0.8} mb={5} aria-hidden />

      <Text
        fontFamily="heading"
        fontSize={{ base: '26px', md: '30px' }}
        fontWeight={500}
        color="text.primary"
        lineHeight={1.15}
      >
        {city}
      </Text>

      <Text fontSize={{ base: '14px', md: '15px' }} color="text.muted" mt={2} lineHeight={1.6}>
        {district}
      </Text>

      <Box mt={7}>
        <ChakraLink
          href={mapsUrl}
          isExternal
          display="inline-flex"
          alignItems="center"
          gap={2}
          px={5}
          py={2.5}
          borderRadius="full"
          border="1px solid"
          borderColor="border.gold"
          fontSize="12px"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="accent.goldDeep"
          fontWeight={500}
          transition={`all 400ms ${EASE}`}
          _hover={{
            bg: 'accent.gold',
            borderColor: 'accent.gold',
            color: 'warm.black',
            textDecoration: 'none',
          }}
          _focusVisible={{
            outline: '2px solid',
            outlineColor: 'accent.goldDeep',
            outlineOffset: '3px',
          }}
        >
          {openInMaps}
          <ExternalLink size={13} />
        </ChakraLink>
      </Box>
    </Stack>
  );
}

export function BranchesSection() {
  const { t } = useTranslation();

  return (
    <Box
      as="section"
      id="branches"
      scrollMarginTop={{ base: '80px', md: '96px' }}
      /* Plain cream: the tinted band now starts at the order section below,
         so it can run unbroken into the footer. The white cards and the
         heading carry the separation here. */
      py={{ base: '52px', md: '88px' }}
    >
      <Container maxW="1280px" px={{ base: 6, md: 10 }}>
        <SectionHeading title={t('sections.branches')} />
        <Text
          mt={5}
          mx="auto"
          maxW="560px"
          textAlign="center"
          color="text.muted"
          fontSize={{ base: '15px', md: '16px' }}
          lineHeight={1.8}
        >
          {t('branches.subtitle')}
        </Text>

        <SimpleGrid
          columns={{ base: 1, md: 2 }}
          spacing={{ base: 5, md: 8 }}
          mt={{ base: 9, md: 12 }}
          maxW="960px"
          mx="auto"
        >
          <BranchCard
            city={t('footer.branch1.city')}
            district={t('footer.branch1.area')}
            mapsUrl={BRANCH_KHOBAR_MAPS_URL}
            openInMaps={t('footer.openInMaps')}
          />
          <BranchCard
            city={t('footer.branch2.city')}
            district={t('footer.branch2.area')}
            mapsUrl={BRANCH_DAMMAM_MAPS_URL}
            openInMaps={t('footer.openInMaps')}
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
}

export default BranchesSection;
