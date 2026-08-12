/**
 * BrandLogo — the full brand lockup as a single image.
 *
 * The artwork already contains the monogram AND both wordmarks
 * (DALLOYOU / داليو), so no text label is rendered beside it.
 *
 * ─ Asset note ───────────────────────────────────────────────────────────────
 * `public/brand-logo.svg` does not exist yet; the supplied file is
 * `public/brand-logo.png`, a 2000×2000 canvas in which the lockup occupies
 * only a 1787×507 band, on an opaque #F7F3E9 field (not the brand cream).
 * Rendered at `height: 52px` that would put the wordmark at ~13px tall inside
 * a visible off-cream rectangle. `brand-logo-lockup.png` is that same artwork
 * trimmed to its content box with the flat background knocked out to alpha, so
 * it sizes and sits correctly on cream, on the tinted footer and while the
 * navbar is translucent.
 *
 * When a real `brand-logo.svg` is added, point BRAND_LOGO_SRC at it — that is
 * the only change required.
 */

import { Box } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const BRAND_LOGO_SRC = '/brand-logo-lockup.png';

interface BrandLogoProps {
  /** Rendered height. Defaults to 44px mobile / 52px desktop. */
  height?: { base: string; md: string } | string;
  /** Where the logo links to. Pass null to render a plain image. */
  to?: string | null;
}

export function BrandLogo({
  height = { base: '44px', md: '52px' },
  to = '/',
}: BrandLogoProps) {
  const { t } = useTranslation();

  const img = (
    <Box
      as="img"
      src={BRAND_LOGO_SRC}
      alt={t('brand.name')}
      h={height}
      w="auto"
      sx={{
        display: 'block',
        objectFit: 'contain',
        // The lockup is inherently directional artwork (Latin left, Arabic
        // right); never let a RTL context flip it.
        transform: 'none',
      }}
      mt={1}
    />
  );

  if (!to) return img;

  return (
    <Box
      as={RouterLink}
      to={to}
      display="inline-flex"
      alignItems="center"
      flexShrink={0}
      transition="opacity 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      _hover={{ opacity: 0.82 }}
      sx={{ textDecoration: 'none !important' }}
    >
      {img}
    </Box>
  );
}

export default BrandLogo;
