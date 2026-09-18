import { Box, type ResponsiveValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LOCKUP_RATIO = '623 / 180';

interface BrandLockupProps {
  /** `dark` = black wordmark for ivory; `light` = ivory wordmark for noir. */
  tone?: 'dark' | 'light';
  height?: ResponsiveValue<string>;
  to?: string | null;
}

/**
 * The full DALLOYOU / داليو lockup. Both colourways are stacked and
 * cross-faded, so the navbar can change surface without a flash. The artwork
 * is directional (Latin left, Arabic right) and is never mirrored.
 */
export function BrandLockup({ tone = 'dark', height = { base: '34px', md: '40px' }, to = '/' }: BrandLockupProps) {
  const { t } = useTranslation();

  const art = (
    <Box as="span" position="relative" display="block" h={height} sx={{ aspectRatio: LOCKUP_RATIO }}>
      {(['dark', 'light'] as const).map((variant) => (
        <Box
          key={variant}
          as="img"
          src={`/brand/lockup-${variant}.webp`}
          alt=""
          aria-hidden
          draggable={false}
          position="absolute"
          inset={0}
          w="100%"
          h="100%"
          opacity={tone === variant ? 1 : 0}
          transition="opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)"
        />
      ))}
    </Box>
  );

  if (!to) {
    return (
      <Box as="span" role="img" aria-label={t('brand.name')} display="inline-block">
        {art}
      </Box>
    );
  }

  return (
    <Box
      as={RouterLink}
      to={to}
      aria-label={t('a11y.home')}
      display="inline-flex"
      alignItems="center"
      flexShrink={0}
      transition="opacity 300ms"
      _hover={{ opacity: 0.85 }}
    >
      {art}
    </Box>
  );
}

export default BrandLockup;
