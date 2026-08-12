import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  HStack,
  Link as ChakraLink,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

import AppLogo, { type AppKey } from './AppLogo';
import Logo from './Logo';
import { WhatsAppGlyph } from './WhatsAppIcon';
import { InstagramGlyph, SnapchatGlyph, TikTokGlyph } from './icons/SocialIcons';
import {
  BRANCH_DAMMAM_MAPS_URL,
  BRANCH_KHOBAR_MAPS_URL,
  HUNGERSTATION_URL,
  INSTAGRAM_URL,
  KEETA_URL,
  SNAPCHAT_URL,
  THECHEFZ_URL,
  TIKTOK_URL,
  WHATSAPP_ORDER_URL,
} from '../config/links';

const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

/** Condensed branch line — the full treatment now lives in the homepage
 *  branches section, so the footer only needs city · district + a map link. */
function BranchLine({
  city,
  district,
  mapsUrl,
}: {
  city: string;
  district: string;
  mapsUrl: string;
}) {
  return (
    <ChakraLink
      href={mapsUrl}
      isExternal
      display="block"
      transition={`color 300ms ${EASE}`}
      _hover={{ textDecoration: 'none', '& .dy-branch-city': { color: 'accent.goldDeep' } }}
    >
      <Text
        className="dy-branch-city"
        fontFamily="heading"
        fontSize="18px"
        fontWeight={500}
        color="text.primary"
        lineHeight={1.3}
        transition={`color 300ms ${EASE}`}
      >
        {city}
      </Text>
      <Text fontSize="13px" color="text.muted" mt={0.5}>
        {district}
      </Text>
    </ChakraLink>
  );
}

function SocialCircle({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <ChakraLink
      href={href}
      isExternal
      aria-label={label}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w="38px"
      h="38px"
      borderRadius="full"
      border="1px solid"
      borderColor="border.gold"
      color="accent.goldDeep"
      transition={`all 300ms ${EASE}`}
      _hover={{
        bg: 'accent.gold',
        color: 'warm.black',
        borderColor: 'accent.gold',
        textDecoration: 'none',
        transform: 'translateY(-2px)',
      }}
    >
      {children}
    </ChakraLink>
  );
}

function DeliveryLink({ href, label, app }: { href: string; label: string; app: AppKey }) {
  return (
    <ChakraLink
      href={href}
      isExternal
      display="inline-flex"
      alignItems="center"
      gap={2}
      fontSize="14px"
      color="text.muted"
      transition={`color 300ms ${EASE}`}
      _hover={{ color: 'accent.goldDeep', textDecoration: 'none' }}
    >
      <AppLogo app={app} size={22} />
      {label}
    </ChakraLink>
  );
}

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <Box
      as="footer"
      bg="#F2EDDF"
      borderTop="1px solid"
      borderColor="rgba(201,169,97,0.25)"
    >
      <Container
        maxW="1280px"
        px={{ base: 6, md: 10 }}
        pt={{ base: '40px', md: '56px' }}
        pb={{ base: '32px', md: '40px' }}
      >
        <Grid
          templateColumns={{ base: '1fr', md: '1.2fr 1fr' }}
          gap={{ base: 10, md: 16 }}
          alignItems="start"
        >
          {/* ── Brand column ── */}
          <GridItem>
            <Stack spacing={5} align={{ base: 'center', md: 'flex-start' }}>
              <Logo />
              <Text
                fontStyle="italic"
                color="text.muted"
                fontFamily="heading"
                fontSize="17px"
                lineHeight={1.7}
                maxW="320px"
                textAlign={{ base: 'center', md: 'start' }}
              >
                {t('hero.tagline')}
              </Text>

              <Button
                as={ChakraLink}
                href={WHATSAPP_ORDER_URL}
                isExternal
                variant="outline"
                size="sm"
                h="40px"
                px={5}
                borderRadius="full"
                leftIcon={<WhatsAppGlyph size={16} />}
                borderColor="border.gold"
                color="accent.goldDeep"
                fontSize="11px"
                letterSpacing="0.14em"
                textTransform="uppercase"
                transition={`all 300ms ${EASE}`}
                _hover={{
                  bg: 'accent.gold',
                  borderColor: 'accent.gold',
                  color: 'warm.black',
                  textDecoration: 'none',
                }}
              >
                {t('footer.whatsappCta')}
              </Button>

              <HStack spacing={2} pt={1}>
                <SocialCircle href={INSTAGRAM_URL} label="Instagram">
                  <InstagramGlyph size={18} />
                </SocialCircle>
                <SocialCircle href={TIKTOK_URL} label="TikTok">
                  <TikTokGlyph size={18} />
                </SocialCircle>
                <SocialCircle href={SNAPCHAT_URL} label="Snapchat">
                  <SnapchatGlyph size={18} />
                </SocialCircle>
              </HStack>
            </Stack>
          </GridItem>

          {/* ── Branches (condensed) ── */}
          <GridItem>
            <Stack spacing={5} align={{ base: 'center', md: 'flex-start' }}>
              <Text
                fontSize="11px"
                letterSpacing="0.28em"
                textTransform="uppercase"
                color="accent.goldDeep"
                fontWeight={500}
              >
                {t('footer.branches')}
              </Text>
              <Stack
                spacing={4}
                align={{ base: 'center', md: 'flex-start' }}
                textAlign={{ base: 'center', md: 'start' }}
              >
                <BranchLine
                  city={t('footer.branch1.city')}
                  district={t('footer.branch1.area')}
                  mapsUrl={BRANCH_KHOBAR_MAPS_URL}
                />
                <BranchLine
                  city={t('footer.branch2.city')}
                  district={t('footer.branch2.area')}
                  mapsUrl={BRANCH_DAMMAM_MAPS_URL}
                />
              </Stack>
            </Stack>
          </GridItem>
        </Grid>

        {/* ── Delivery apps ── */}
        <Flex
          mt={{ base: 9, md: 12 }}
          pt={5}
          borderTop="1px solid"
          borderColor="rgba(201,169,97,0.2)"
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'center', md: 'center' }}
          justify="space-between"
          gap={3}
        >
          <Text fontSize="12px" color="accent.goldDeep" fontWeight={500}>
            {t('footer.orderOnline')}
          </Text>
          <Flex align="center" gap={{ base: 3, sm: 5 }} flexWrap="wrap" justify="center">
            <DeliveryLink href={HUNGERSTATION_URL} label={t('footer.hungerstation')} app="hungerstation" />
            <DeliveryLink href={THECHEFZ_URL} label={t('footer.thechefz')} app="thechefz" />
            <DeliveryLink href={KEETA_URL} label={t('footer.keeta')} app="keeta" />
          </Flex>
        </Flex>

        {/* ── Bottom bar ── */}
        <Flex
          mt={5}
          pt={5}
          borderTop="1px solid"
          borderColor="rgba(201,169,97,0.2)"
          direction={{ base: 'column', md: 'row' }}
          align="center"
          justify="space-between"
          gap={2}
        >
          <Text fontSize="12px" color="text.muted" letterSpacing="0.1em">
            © {year} {t('brand.name')}. {t('footer.copyright')}
          </Text>
          <Text
            fontSize="11px"
            color="text.muted"
            opacity={0.65}
            letterSpacing="0.14em"
            textTransform="uppercase"
          >
            {t('footer.madeIn')}
          </Text>
        </Flex>
      </Container>
    </Box>
  );
}

export default Footer;
