/**
 * AppLogo — the ordering-channel logos (WhatsApp + the delivery apps).
 *
 * The artwork is square app-icon tiles; they are drawn into a fixed square
 * with a proportional radius so all four read as siblings. The storefront
 * uses the 192px WebP renditions (a few KB each); the original PNGs remain
 * in public/apps/ as the source files.
 */

import { Box } from '@chakra-ui/react';

export const APP_LOGOS = {
  whatsapp: '/apps/whatsapp-192.webp',
  hungerstation: '/apps/hungerstation-192.webp',
  thechefz: '/apps/thechefz-192.webp',
  keeta: '/apps/keeta-192.webp',
} as const;

export type AppKey = keyof typeof APP_LOGOS;

/** APP_LOGO_SIZE — adjust to resize every delivery app logo at once. */
export const DEFAULT_SIZE = 40;

/** Matches the corner radius baked into the The Chefz artwork (~20%). */
const RADIUS_RATIO = 0.24;

interface AppLogoProps {
  app: AppKey;
  /** Square edge length in px. Defaults to DEFAULT_SIZE. */
  size?: number;
}

export function AppLogo({ app, size = DEFAULT_SIZE }: AppLogoProps) {
  return (
    <Box
      w={`${size}px`}
      h={`${size}px`}
      flexShrink={0}
      borderRadius={`${Math.round(size * RADIUS_RATIO)}px`}
      overflow="hidden"
      display="grid"
      placeItems="center"
      boxShadow="0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 10px -6px rgba(14,11,8,0.35)"
    >
      <Box
        as="img"
        src={APP_LOGOS[app]}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        w="100%"
        h="100%"
        sx={{ objectFit: 'cover', display: 'block' }}
      />
    </Box>
  );
}

export default AppLogo;
