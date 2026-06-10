import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  HStack,
  Link as ChakraLink,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Logo from './Logo';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '966532370777';
const KEETA_ORDER_URL = 'https://url.mykeeta.com/oI6Yp71z';

const BRANCH_1_MAPS = 'https://maps.google.com?q=%D8%AF%D8%A7%D9%84%D9%8A%D9%88+%D8%A7%D9%84%D8%AE%D8%A8%D8%B1';
const BRANCH_2_MAPS = 'https://maps.app.goo.gl/GbjJkWRAbfvi9tTp6';

function TikTokIcon() {
  return (
    <Box
      as="svg"
      width="20px"
      height="20px"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.55a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.08z" />
    </Box>
  );
}

function WhatsAppGlyph() {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="16px" h="16px" aria-hidden>
      <path
        fill="currentColor"
        d="M19.11 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91a9.86 9.86 0 0 0 1.32 4.94L2 22l5.29-1.39a9.91 9.91 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91a9.85 9.85 0 0 0-2.85-6.99z"
      />
    </Box>
  );
}

interface BranchCardProps {
  city: string;
  area: string;
  mapsUrl: string;
  openInMaps: string;
}

function BranchCard({ city, area, mapsUrl, openInMaps }: BranchCardProps) {
  return (
    <Stack spacing={3}>
      {/* Thin gold rule */}
      <Box h="1px" w="28px" bg="accent.gold" opacity={0.7} />
      <Text
        fontFamily="heading"
        fontSize={{ base: '20px', md: '22px' }}
        fontWeight={500}
        color="text.primary"
        lineHeight={1.2}
      >
        {city}
      </Text>
      <Text fontSize="13px" color="text.muted" letterSpacing="0.04em">
        {area}
      </Text>
      <ChakraLink
        href={mapsUrl}
        isExternal
        display="inline-flex"
        alignItems="center"
        gap={1.5}
        px={4}
        py={2}
        borderRadius="full"
        border="1px solid"
        borderColor="border.gold"
        fontSize="11px"
        letterSpacing="0.18em"
        textTransform="uppercase"
        color="accent.goldDeep"
        fontWeight={500}
        alignSelf="flex-start"
        transition="all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        _hover={{
          bg: 'accent.gold',
          borderColor: 'accent.gold',
          color: 'warm.black',
          textDecoration: 'none',
        }}
      >
        {openInMaps}
        <ExternalLink size={11} />
      </ChakraLink>
    </Stack>
  );
}

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <Box
      as="footer"
      mt={{ base: 16, md: 24 }}
      bg="#F2EDDF"
      borderTop="1px solid"
      borderColor="rgba(201,169,97,0.25)"
    >
      <Container
        maxW="1280px"
        px={{ base: 6, md: 10 }}
        pt={{ base: '48px', md: '64px' }}
        pb={{ base: '32px', md: '40px' }}
      >
        <Grid
          templateColumns={{ base: '1fr', md: '1fr 1.6fr' }}
          gap={{ base: 12, md: 20 }}
          alignItems="start"
        >
          {/* ── Brand column ── */}
          <GridItem>
            <Stack spacing={5}>
              <Logo />
              <Text
                fontStyle="italic"
                color="text.muted"
                fontFamily="heading"
                fontSize="17px"
                lineHeight={1.7}
                maxW="300px"
              >
                {t('hero.tagline')}
              </Text>

              <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} align="flex-start">
                {/* WhatsApp CTA */}
                <Button
                  as={ChakraLink}
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  isExternal
                  variant="outline"
                  size="sm"
                  h="40px"
                  px={5}
                  borderRadius="full"
                  leftIcon={<WhatsAppGlyph />}
                  borderColor="border.gold"
                  color="accent.goldDeep"
                  fontSize="11px"
                  letterSpacing="0.14em"
                  textTransform="uppercase"
                  transition="all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                  _hover={{
                    bg: 'accent.gold',
                    borderColor: 'accent.gold',
                    color: 'warm.black',
                    textDecoration: 'none',
                  }}
                >
                  {t('footer.whatsappCta')}
                </Button>
                <Button
                  as={ChakraLink}
                  href={KEETA_ORDER_URL}
                  isExternal
                  variant="outline"
                  size="sm"
                  h="40px"
                  px={5}
                  borderRadius="full"
                  leftIcon={<ExternalLink size={14} />}
                  borderColor="border.gold"
                  color="accent.goldDeep"
                  fontSize="11px"
                  letterSpacing="0.14em"
                  textTransform="uppercase"
                  transition="all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                  _hover={{
                    bg: 'accent.gold',
                    borderColor: 'accent.gold',
                    color: 'warm.black',
                    textDecoration: 'none',
                  }}
                >
                  {t('footer.keetaCta')}
                </Button>
              </Stack>

              {/* Social icon buttons */}
              <Flex mt={4} justify={{ base: 'center', md: 'flex-start' }}>
                <HStack spacing={1}>
                  <Box
                    as="a"
                    href="https://www.instagram.com/dalloyauksa"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    w="36px"
                    h="36px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="full"
                    color="text.primary"
                    transition="all 200ms ease-out"
                    _hover={{ color: 'accent.gold', transform: 'scale(1.05)' }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  </Box>
                  <Box
                    as="a"
                    href="https://www.tiktok.com/@dalloyauksa"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    w="36px"
                    h="36px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="full"
                    color="text.primary"
                    transition="all 200ms ease-out"
                    _hover={{ color: 'accent.gold', transform: 'scale(1.05)' }}
                  >
                    <TikTokIcon />
                  </Box>
                </HStack>
              </Flex>
            </Stack>
          </GridItem>

          {/* ── Branches column ── */}
          <GridItem>
            <Stack spacing={8}>
              <Text
                fontSize="11px"
                letterSpacing="0.32em"
                textTransform="uppercase"
                color="accent.goldDeep"
                fontWeight={500}
              >
                {t('footer.branches')}
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={{ base: 8, md: 10 }}>
                <BranchCard
                  city={t('footer.branch1.city')}
                  area={t('footer.branch1.area')}
                  mapsUrl={BRANCH_1_MAPS}
                  openInMaps={t('footer.openInMaps')}
                />
                <BranchCard
                  city={t('footer.branch2.city')}
                  area={t('footer.branch2.area')}
                  mapsUrl={BRANCH_2_MAPS}
                  openInMaps={t('footer.openInMaps')}
                />
              </SimpleGrid>
            </Stack>
          </GridItem>
        </Grid>

        {/* ── Bottom bar ── */}
        <Flex
          mt={{ base: 10, md: 14 }}
          pt={5}
          borderTop="1px solid"
          borderColor="rgba(201,169,97,0.2)"
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'center' }}
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
