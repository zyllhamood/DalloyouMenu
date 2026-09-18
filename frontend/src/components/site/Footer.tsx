import type { ReactNode } from 'react';
import { Box, Container, Divider, Flex, Grid, Heading, HStack, Link, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import BrandLockup from '../brand/BrandLockup';
import { SocialGlyph } from '../icons/SocialIcons';
import OrderChannels from '../product/OrderChannels';
import Eyebrow from '../ui/Eyebrow';
import Reveal from '../ui/Reveal';
import { WhatsAppGlyph } from '../WhatsAppIcon';
import { BRANCHES, SOCIALS, WHATSAPP_DISPLAY, WHATSAPP_ORDER_URL, WHATSAPP_URL } from '../../config/links';
import { categoryName, useMenuIndex } from '../../lib/menu';

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack spacing={4}>
      <Text fontSize="13px" fontWeight={600} color="brand.300">
        {title}
      </Text>
      <Stack spacing={3} fontSize="15px">
        {children}
      </Stack>
    </Stack>
  );
}

const linkStyle = {
  color: 'text.onDark',
  opacity: 0.78,
  transition: 'opacity 300ms, color 300ms',
  _hover: { opacity: 1, color: 'brand.300', textDecoration: 'none' },
} as const;

/** The closing act: one last invitation to order, then everything else. */
export function Footer() {
  const { t } = useTranslation();
  const { index } = useMenuIndex();
  const year = new Date().getFullYear();

  return (
    <Box
      as="footer"
      data-nav-theme="dark"
      className="dy-grain"
      bg="noir.800"
      color="text.onDark"
      overflow="hidden"
      pb={{ base: '112px', md: 0 }}
    >
      <Container maxW="1320px" position="relative" zIndex={1} pt={{ base: 20, md: 28 }}>
        <Grid templateColumns={{ base: '1fr', lg: '1.1fr 0.9fr' }} gap={{ base: 10, lg: 24 }} alignItems="center">
          <Reveal>
            <Eyebrow tone="dark" mb={5}>
              {t('nav.order')}
            </Eyebrow>
            <Heading
              as="h2"
              fontFamily="display"
              fontWeight={700}
              fontSize={{ base: '38px', md: '56px', xl: '64px' }}
              lineHeight={1.25}
              color="text.onDark"
              maxW="620px"
            >
              {t('order.headline')}
            </Heading>
            <Text mt={5} maxW="460px" fontSize={{ base: '15px', md: '17px' }} lineHeight={1.85} color="text.onDarkMuted">
              {t('order.subtitle')}
            </Text>
          </Reveal>
          <Reveal delay={0.1}>
            <Box
              p={{ base: 5, md: 7 }}
              borderRadius="28px"
              border="1px solid rgba(227, 183, 117, 0.14)"
              bg="rgba(23, 19, 15, 0.7)"
            >
              <OrderChannels whatsappUrl={WHATSAPP_ORDER_URL} whatsappLabel={t('order.whatsappCta')} tone="dark" />
            </Box>
          </Reveal>
        </Grid>

        <Divider borderColor="rgba(227, 183, 117, 0.14)" opacity={1} my={{ base: 14, md: 20 }} />

        <Grid templateColumns={{ base: '1fr 1fr', md: '1.5fr 1fr 1fr 1fr' }} gap={{ base: 10, md: 10 }} rowGap={12}>
          <Stack spacing={5} gridColumn={{ base: '1 / -1', md: 'auto' }}>
            <BrandLockup tone="light" height="46px" />
            <Text maxW="320px" fontSize="14.5px" lineHeight={1.9} color="text.onDarkMuted">
              {t('brand.statement')}
            </Text>
            <HStack spacing={2}>
              {SOCIALS.map((social) => (
                <Link
                  key={social.key}
                  href={social.url}
                  isExternal
                  aria-label={t('social.follow', { name: t(`social.${social.key}`) })}
                  display="grid"
                  placeItems="center"
                  w="42px"
                  h="42px"
                  borderRadius="full"
                  border="1px solid rgba(227, 183, 117, 0.22)"
                  color="brand.200"
                  transition="all 300ms var(--dy-ease)"
                  _hover={{ bg: 'brand.500', borderColor: 'brand.500', color: 'noir.800', transform: 'translateY(-2px)' }}
                >
                  <SocialGlyph network={social.key} size={18} />
                </Link>
              ))}
            </HStack>
          </Stack>

          <Column title={t('footer.menu')}>
            {index.categories.map((category) => (
              <Link key={category.id} as={RouterLink} to={`/menu/${category.slug}`} {...linkStyle}>
                {categoryName(category)}
              </Link>
            ))}
            <Link as={RouterLink} to="/menu" {...linkStyle}>
              {t('home.viewAll')}
            </Link>
          </Column>

          <Column title={t('footer.visit')}>
            {BRANCHES.map((branch) => (
              <Link key={branch.key} href={branch.mapsUrl} isExternal {...linkStyle}>
                {t(`branches.${branch.key}.city`)}
                <Text as="span" display="block" fontSize="13px" color="text.onDarkMuted" mt={0.5}>
                  {t(`branches.${branch.key}.area`)}
                </Text>
              </Link>
            ))}
          </Column>

          <Column title={t('footer.contact')}>
            <Link href={WHATSAPP_URL} isExternal display="inline-flex" alignItems="center" gap={2} {...linkStyle}>
              <WhatsAppGlyph size={16} />
              <Box as="span" className="dy-ltr">
                {WHATSAPP_DISPLAY}
              </Box>
            </Link>
            {SOCIALS.map((social) => (
              <Link key={social.key} href={social.url} isExternal {...linkStyle}>
                {t(`social.${social.key}`)}
              </Link>
            ))}
          </Column>
        </Grid>

        <Flex
          mt={{ base: 14, md: 20 }}
          pt={6}
          borderTop="1px solid rgba(227, 183, 117, 0.12)"
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          gap={2}
          fontSize="13px"
          color="text.onDarkMuted"
        >
          <Text>{t('footer.rights', { year })}</Text>
          <Text>{t('footer.madeIn')}</Text>
        </Flex>
      </Container>

      <Box
        aria-hidden
        lang="en"
        dir="ltr"
        mt={{ base: 10, md: 14 }}
        mb={{ base: '-0.2em' }}
        textAlign="center"
        whiteSpace="nowrap"
        userSelect="none"
        fontFamily="latin"
        fontWeight={500}
        fontSize="clamp(52px, 12.5vw, 210px)"
        lineHeight={0.82}
        letterSpacing="0.16em"
        color="transparent"
        sx={{ WebkitTextStroke: '1px rgba(227, 183, 117, 0.2)', paddingInlineStart: '0.16em' }}
      >
        DALLOYOU
      </Box>
    </Box>
  );
}

export default Footer;
