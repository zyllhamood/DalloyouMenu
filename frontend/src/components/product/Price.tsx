import { Box, type BoxProps } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

import { formatAmount } from '../../lib/format';

interface PriceProps extends Omit<BoxProps, 'children'> {
  value: number | string | null | undefined;
  /** The pre-discount price — struck through beside the price when given. */
  original?: number | string | null;
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
const ORIGINAL_SIZE = { sm: '12px', md: '13.5px', lg: '16px', xl: '19px' } as const;

/** "130 ر.س", or "80 ر.س  ̶1̶3̶0̶" when the product is on sale. */
export function Price({ value, original, size = 'md', tone = 'gold', ...rest }: PriceProps) {
  const { t } = useTranslation();
  const amount = formatAmount(value);
  const was = formatAmount(original);
  if (!amount) return null;

  const color = tone === 'onDark' ? 'brand.300' : tone === 'ink' ? 'text.primary' : 'brand.700';
  const display = size === 'lg' || size === 'xl';
  const showWasCurrency = size !== 'sm';

  return (
    <Box as="span" display="inline-flex" alignItems="baseline" gap="0.55em" whiteSpace="nowrap" {...rest}>
      <Box as="span" display="inline-flex" alignItems="baseline" gap="0.3em" color={color}>
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

      {was && (
        <Box
          as="span"
          aria-label={t('product.wasPrice', { price: was })}
          fontSize={ORIGINAL_SIZE[size]}
          fontWeight={500}
          lineHeight={1}
          color={tone === 'onDark' ? 'text.onDarkMuted' : 'text.muted'}
          textDecoration="line-through"
          textDecorationThickness="1px"
          opacity={0.85}
          sx={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
        >
          {was}
          {showWasCurrency && (
            <Box as="span" fontSize="0.8em" ms="0.3em" fontWeight={400}>
              {t('product.currency')}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

/** Small gold flag: "خصم ٢٠٪". */
export function DiscountBadge({ percent }: { percent: number }) {
  const { t } = useTranslation();
  if (!percent) return null;
  return (
    <Box
      as="span"
      px={2.5}
      py="3px"
      borderRadius="full"
      bgImage="linear-gradient(100deg, #A8702F 0%, #C2863E 35%, #EFD09A 60%, #C2863E 85%)"
      color="#1A1208"
      fontSize="11px"
      fontWeight={600}
      lineHeight={1.5}
      whiteSpace="nowrap"
      boxShadow="0 6px 14px -8px rgba(194, 134, 62, 0.8)"
    >
      {t('product.discountBadge', { percent })}
    </Box>
  );
}

export default Price;
