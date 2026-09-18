import { Box, Button, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

import AppLogo from '../AppLogo';
import { WhatsAppGlyph } from '../WhatsAppIcon';
import { DELIVERY_APPS } from '../../config/links';

interface OrderChannelsProps {
  whatsappUrl: string;
  whatsappLabel?: string;
  tone?: 'light' | 'dark';
  /** Explain that the apps open the full menu (product context only). */
  note?: string;
}

/**
 * WhatsApp first — it's the only channel that can carry a specific item —
 * then the delivery apps as three equal tiles.
 */
export function OrderChannels({ whatsappUrl, whatsappLabel, tone = 'light', note }: OrderChannelsProps) {
  const { t } = useTranslation();
  const dark = tone === 'dark';

  return (
    <Stack spacing={4}>
      <Button
        as="a"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        variant={dark ? 'gold' : 'noir'}
        size="lg"
        w="100%"
        h={{ base: '56px', md: '60px' }}
        fontSize={{ base: '16px', md: '17px' }}
        leftIcon={<WhatsAppGlyph size={21} />}
        iconSpacing={3}
      >
        {whatsappLabel ?? t('product.orderWhatsapp')}
      </Button>

      <Box>
        <Text
          fontSize="13px"
          color={dark ? 'text.onDarkMuted' : 'text.muted'}
          textAlign="center"
          mb={3}
        >
          {t('product.orderApps')}
        </Text>
        <SimpleGrid columns={3} spacing={{ base: 2, md: 2.5 }}>
          {DELIVERY_APPS.map((app) => (
            <Box
              key={app.key}
              as="a"
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap={2}
              py={3}
              px={2}
              borderRadius="18px"
              border="1px solid"
              borderColor={dark ? 'rgba(227,183,117,0.16)' : 'rgba(22,18,14,0.1)'}
              bg={dark ? 'rgba(34,28,22,0.6)' : 'ivory.50'}
              transition="transform 300ms var(--dy-ease), border-color 300ms, box-shadow 300ms"
              _hover={{
                transform: 'translateY(-3px)',
                borderColor: dark ? 'rgba(227,183,117,0.45)' : 'rgba(143,91,30,0.4)',
                boxShadow: dark ? 'none' : '0 14px 30px -18px rgba(110,69,21,0.45)',
              }}
              _active={{ transform: 'scale(0.97)' }}
            >
              <AppLogo app={app.key} size={34} />
              <Text fontSize="13px" fontWeight={500} lineHeight={1.2} textAlign="center">
                {t(`apps.${app.key}`)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
        {note && (
          <Text mt={3} fontSize="12px" lineHeight={1.7} textAlign="center" color={dark ? 'text.onDarkMuted' : 'text.muted'}>
            {note}
          </Text>
        )}
      </Box>
    </Stack>
  );
}

export default OrderChannels;
