import { Box, Flex, Heading, Link, Text } from '@chakra-ui/react';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Monogram from '../brand/Monogram';
import OrderChannels from '../product/OrderChannels';
import Sheet from './Sheet';
import { BRANCHES, WHATSAPP_ORDER_URL } from '../../config/links';
import { useUiStore } from '../../stores/uiStore';

/** "Order now" from anywhere: WhatsApp, the delivery apps, and the branches. */
export function OrderSheet() {
  const { t } = useTranslation();
  const isOpen = useUiStore((s) => s.orderOpen);
  const close = useUiStore((s) => s.closeOrder);

  return (
    <Sheet isOpen={isOpen} onClose={close} label={t('order.title')} maxW="500px" tone="dark">
      <Box className="dy-grain" px={{ base: 5, md: 9 }} pt={{ base: 10, md: 12 }} pb={{ base: 8, md: 10 }}>
        <Box position="relative" zIndex={1}>
          <Flex direction="column" align="center" textAlign="center">
            <Monogram w="44px" h="44px" sheen />
            <Heading as="h2" mt={5} fontFamily="display" fontWeight={700} fontSize={{ base: '30px', md: '34px' }} color="text.onDark">
              {t('order.title')}
            </Heading>
            <Text mt={2.5} maxW="360px" fontSize="15px" lineHeight={1.8} color="text.onDarkMuted">
              {t('order.subtitle')}
            </Text>
          </Flex>

          <Box mt={8}>
            <OrderChannels whatsappUrl={WHATSAPP_ORDER_URL} whatsappLabel={t('order.whatsappCta')} tone="dark" />
          </Box>

          <Flex mt={8} pt={6} borderTop="1px solid" borderColor="rgba(227,183,117,0.14)" justify="center" gap={{ base: 5, md: 8 }} wrap="wrap">
            {BRANCHES.map((branch) => (
              <Link
                key={branch.key}
                href={branch.mapsUrl}
                isExternal
                display="inline-flex"
                alignItems="center"
                gap={2}
                fontSize="14px"
                color="text.onDark"
                _hover={{ color: 'brand.300', textDecoration: 'none' }}
              >
                <MapPin size={16} color="var(--dy-gold)" />
                {t(`branches.${branch.key}.city`)}
                <Text as="span" color="text.onDarkMuted">· {t(`branches.${branch.key}.area`)}</Text>
              </Link>
            ))}
          </Flex>
        </Box>
      </Box>
    </Sheet>
  );
}

export default OrderSheet;
