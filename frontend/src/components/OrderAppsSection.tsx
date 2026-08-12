/**
 * OrderAppsSection — "Order via Delivery Apps".
 *
 * Sits just above the footer: ordering is a conversion step that belongs
 * after someone has browsed, not before it.
 *
 * Four cards — WhatsApp plus the three delivery apps — 4-across on desktop,
 * 2×2 on mobile. Logo paths and sizing come from AppLogo.
 */

import { Box, Container, Link as ChakraLink, SimpleGrid, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

import AppLogo, { type AppKey } from './AppLogo';
import SectionHeading from './SectionHeading';
import {
  HUNGERSTATION_URL,
  KEETA_URL,
  THECHEFZ_URL,
  WHATSAPP_ORDER_URL,
} from '../config/links';

const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

function OrderAppCard({ href, label, app }: { href: string; label: string; app: AppKey }) {
  return (
    <ChakraLink
      href={href}
      isExternal
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={{ base: 3, md: 4 }}
      px={{ base: 3, md: 5 }}
      py={{ base: 6, md: 8 }}
      minH={{ base: '128px', md: '156px' }}
      bg="bg.surface"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      textAlign="center"
      role="group"
      transition={`all 400ms ${EASE}`}
      _hover={{
        borderColor: 'accent.gold',
        transform: 'translateY(-4px)',
        boxShadow: 'softHover',
        textDecoration: 'none',
      }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'accent.goldDeep', outlineOffset: '3px' }}
    >
      <AppLogo app={app} size={52} />
      <Text
        fontSize={{ base: '14px', md: '15px' }}
        fontWeight={500}
        color="text.primary"
        lineHeight={1.35}
        transition={`color 400ms ${EASE}`}
        _groupHover={{ color: 'accent.goldDeep' }}
      >
        {label}
      </Text>
    </ChakraLink>
  );
}

export function OrderAppsSection() {
  const { t } = useTranslation();

  return (
    <Box
      as="section"
      id="order"
      scrollMarginTop={{ base: '80px', md: '96px' }}
      /* The tint starts here and runs unbroken into the footer, making the
         foot of the page one "ready to order" zone. The footer supplies the
         closing border, so there is none at the bottom. */
      bg="rgba(242, 237, 223, 0.5)"
      borderTop="1px solid"
      borderColor="rgba(201, 169, 97, 0.2)"
      py={{ base: '56px', md: '88px' }}
    >
      <Container maxW="1280px" px={{ base: 6, md: 10 }}>
        <SectionHeading title={t('sections.orderApps')} />
        <Text
          mt={5}
          mx="auto"
          maxW="560px"
          textAlign="center"
          color="text.muted"
          fontSize={{ base: '15px', md: '16px' }}
          lineHeight={1.8}
        >
          {t('orderApps.subtitle')}
        </Text>

        <SimpleGrid
          columns={{ base: 2, lg: 4 }}
          spacing={{ base: 3, md: 5 }}
          mt={{ base: 9, md: 12 }}
          maxW="1080px"
          mx="auto"
        >
          <OrderAppCard href={WHATSAPP_ORDER_URL} label={t('hero.order.whatsapp')} app="whatsapp" />
          <OrderAppCard href={HUNGERSTATION_URL} label={t('hero.order.hungerstation')} app="hungerstation" />
          <OrderAppCard href={THECHEFZ_URL} label={t('hero.order.thechefz')} app="thechefz" />
          <OrderAppCard href={KEETA_URL} label={t('hero.order.keeta')} app="keeta" />
        </SimpleGrid>
      </Container>
    </Box>
  );
}

export default OrderAppsSection;
