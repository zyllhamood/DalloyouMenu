import { useState } from 'react';
import { Box, Button, FormControl, FormHelperText, FormLabel, Grid, HStack, Input, Stack, Text, useToast } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';

import { saveErrorMessage } from '../../../lib/apiErrors';
import { IPAD_QUERY_KEY, ipadSettingsUpdate, type IpadSettings } from '../../../lib/ipad';

const FOCUS = { borderColor: 'accent.gold', boxShadow: '0 0 0 1px rgba(201,169,97,0.4)' };

/** Remount with a new `key` when the saved settings change. */
export default function IpadSettingsPanel({ settings }: { settings: IpadSettings }) {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const queryClient = useQueryClient();
  const [idle, setIdle] = useState(String(settings.idle_seconds));
  const [location, setLocation] = useState(settings.location);
  const [currency, setCurrency] = useState(settings.currency);

  const idleValue = Number(idle);
  const idleInvalid = !Number.isInteger(idleValue) || idleValue < 10 || idleValue > 3600;

  const save = useMutation({
    mutationFn: () =>
      ipadSettingsUpdate({ idle_seconds: idleValue, location: location.trim(), currency: currency.trim() }),
    onSuccess: () => {
      toast({ title: t('saved'), status: 'success', duration: 2500, position: 'top' });
      void queryClient.invalidateQueries({ queryKey: IPAD_QUERY_KEY });
    },
    onError: (error) => toast({ title: saveErrorMessage(error, t), status: 'error', duration: 5000, position: 'top' }),
  });

  return (
    <Stack spacing={4} maxW="760px">
      <Box bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={{ base: 4, md: 6 }}>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5}>
          <FormControl isInvalid={idleInvalid}>
            <FormLabel fontSize="13px" fontWeight={500} mb={1}>{t('ipad.settings.idleSeconds')}</FormLabel>
            <Input
              size="sm"
              borderRadius="sm"
              inputMode="numeric"
              dir="ltr"
              _focus={FOCUS}
              value={idle}
              onChange={(e) => setIdle(e.target.value)}
            />
            <FormHelperText fontSize="11px" color={idleInvalid ? 'red.500' : undefined}>
              {t('ipad.settings.idleSecondsHelper')}
            </FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="13px" fontWeight={500} mb={1}>{t('ipad.settings.currency')}</FormLabel>
            <Input size="sm" borderRadius="sm" _focus={FOCUS} value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </FormControl>
          <FormControl gridColumn={{ md: '1 / -1' }}>
            <FormLabel fontSize="13px" fontWeight={500} mb={1}>{t('ipad.settings.location')}</FormLabel>
            <Input size="sm" borderRadius="sm" _focus={FOCUS} value={location} onChange={(e) => setLocation(e.target.value)} />
            <FormHelperText fontSize="11px">{t('ipad.settings.locationHelper')}</FormHelperText>
          </FormControl>
        </Grid>
        <HStack justify="flex-end" mt={6}>
          <Button
            size="sm"
            bg="warm.black"
            color="accent.gold"
            border="1px solid"
            borderColor="accent.gold"
            _hover={{ bg: 'accent.gold', color: 'warm.black' }}
            isDisabled={idleInvalid || !currency.trim()}
            isLoading={save.isPending}
            onClick={() => save.mutate()}
          >
            {t('ipad.settings.save')}
          </Button>
        </HStack>
      </Box>
      <HStack spacing={2} color="text.muted" px={1}>
        <RefreshCw size={13} />
        <Text fontSize="12px">{t('ipad.settings.syncNote')}</Text>
      </HStack>
    </Stack>
  );
}
