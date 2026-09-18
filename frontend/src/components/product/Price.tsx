import { Box, type BoxProps } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

import { formatAmount } from '../../lib/format';

interface PriceProps extends Omit<BoxProps, 'children'> {
  value: number | string | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'gold' | 'ink' | 'onDark';
}

const AMOUNT_SIZE = {
  sm: { base: '15px', md: '16px' },
  md: { base: '18px', md: '20px' },
  lg: { base: '26px', md: '30px' },
  xl: { base: '34px', md: '42px' },
} as const;

const CURRENCY_SIZE = { sm: '11px', md: '12px', lg: '14px', xl: '16px' } as const;

/** "130 ر.س" with the amount set large and the currency small. */
export function Price({ value, size = 'md', tone = 'gold', ...rest }: PriceProps) {
  const { t } = useTranslation();
  const amount = formatAmount(value);
  if (!amount) return null;

  const color = tone === 'onDark' ? 'brand.300' : tone === 'ink' ? 'text.primary' : 'brand.700';
  const display = size === 'lg' || size === 'xl';

  return (
    <Box as="span" display="inline-flex" alignItems="baseline" gap="0.3em" color={color} whiteSpace="nowrap" {...rest}>
      <Box
        as="span"
        fontFamily={display ? 'display' : 'body'}
        fontWeight={display ? 700 : 600}
        fontSize={AMOUNT_SIZE[size]}
        lineHeight={1}
        sx={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
      >
        {amount}
      </Box>
      <Box as="span" fontSize={CURRENCY_SIZE[size]} fontWeight={500} opacity={0.8} lineHeight={1}>
        {t('product.currency')}
      </Box>
    </Box>
  );
}

export default Price;
