/**
 * AppLogo — the ordering-channel logos (WhatsApp + the delivery apps).
 *
 * Used everywhere a delivery app appears: the hero's order block, the footer
 * links, and the product page's order grid.
 *
 * ── The two things you'll want to change ────────────────────────────────────
 *
 *   APP_LOGOS      single source of truth for the image paths. Change a path
 *                  here and every usage follows.
 *   DEFAULT_SIZE   single source of truth for how big the logos render.
 *                  Change it here to resize every delivery app logo at once.
 *
 * The supplied assets are .png. If SVGs are added later, flip APP_LOGO_EXT to
 * 'svg' — that one line reponts all four.
 *
 * The artwork is square app-icon tiles: three are opaque colour fields with
 * hard corners, The Chefz ships with its own rounded corners. They're drawn
 * into a fixed square with objectFit "contain" and a proportional radius so
 * all four read as siblings whatever their source proportions.
 */

import { Box } from '@chakra-ui/react';

/** Swap to 'svg' if/when vector versions land in public/apps/. */
const APP_LOGO_EXT = 'png';

export const APP_LOGOS = {
  whatsapp: `/apps/whatsapp.${APP_LOGO_EXT}`,
  hungerstation: `/apps/hungerstation.${APP_LOGO_EXT}`,
  thechefz: `/apps/thechefz.${APP_LOGO_EXT}`,
  keeta: `/apps/keeta.${APP_LOGO_EXT}`,
} as const;

export type AppKey = keyof typeof APP_LOGOS;

/** APP_LOGO_SIZE — adjust to resize every delivery app logo at once. */
export const DEFAULT_SIZE = 40;

/** Matches the corner radius baked into the The Chefz artwork (~20%). */
const RADIUS_RATIO = 0.22;

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
      bg="bg.surface"
      display="grid"
      placeItems="center"
    >
      <Box
        as="img"
        src={APP_LOGOS[app]}
        alt=""
        aria-hidden
        loading="lazy"
        w="100%"
        h="100%"
        sx={{ objectFit: 'contain', display: 'block' }}
      />
    </Box>
  );
}

export default AppLogo;
