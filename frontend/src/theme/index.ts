import { extendTheme, type ThemeConfig, type ThemeOverride } from '@chakra-ui/react';

/**
 * DALLOYOU design tokens — "noir & ivoire".
 *
 *   noir   warm near-black for the cinematic moments (hero, story, footer)
 *   ivory  the brand cream (#F7F3E9 — the logo's own background) for browsing
 *   gold   sampled from the monogram artwork (#C2863E), with a light/deep range
 *
 * Contrast notes (WCAG AA, normal text):
 *   gold.700 #8F5B1E on ivory  ≈ 5.1:1  → small gold text on light surfaces
 *   gold.500 #C2863E on noir   ≈ 6.3:1  → gold text on dark surfaces
 *   gold.500 on ivory          ≈ 2.8:1  → decorative / large display only
 */

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

export const FONT_DISPLAY = `'Amiri', 'Times New Roman', serif`;
export const FONT_BODY = `'IBM Plex Sans Arabic', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif`;
export const FONT_LATIN = `'Bodoni Moda', 'Didot', 'Bodoni 72', Georgia, serif`;

// Kept for useDirection (admin + storefront share it).
export const ARABIC_HEADING = FONT_DISPLAY;
export const ARABIC_BODY = FONT_BODY;

export const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

const overrides: ThemeOverride = {
  config,
  // The whole product is Arabic. Chakra resolves its logical props
  // (insetInlineStart, InputLeftElement, Drawer "start", …) from this value,
  // not from <html dir>, so it must say rtl for "start" to mean right.
  direction: 'rtl',
  colors: {
    brand: {
      50: '#FBF3E4',
      100: '#F1DDB3',
      200: '#E9C993',
      300: '#E3B775',
      400: '#D39D55',
      500: '#C2863E',
      600: '#A87132',
      700: '#8F5B1E',
      800: '#6E4515',
      900: '#4A2E0E',
    },
    noir: {
      900: '#080605',
      800: '#0E0B08',
      700: '#17130F',
      600: '#221C16',
      500: '#2E261E',
      400: '#4A4036',
    },
    ivory: {
      50: '#FFFDF8',
      100: '#F7F3E9',
      200: '#EFE8D8',
      300: '#E4D9C3',
      400: '#D6C7AA',
    },
    // Legacy names still used by the admin screens.
    warm: {
      black: '#0E0B08',
      cream: '#F7F3E9',
      card: '#FFFDF8',
      muted: '#6F6558',
      border: '#E4D9C3',
    },
  },
  semanticTokens: {
    colors: {
      'bg.canvas': { default: '#F7F3E9' },
      'bg.surface': { default: '#FFFDF8' },
      'bg.tint': { default: '#EFE8D8' },
      'bg.noir': { default: '#0E0B08' },
      'text.primary': { default: '#16120E' },
      'text.muted': { default: '#6F6558' },
      'text.onDark': { default: '#F4EEE3' },
      'text.onDarkMuted': { default: '#A99F91' },
      'border.subtle': { default: '#E4D9C3' },
      'border.gold': { default: 'rgba(194, 134, 62, 0.35)' },
      'accent.gold': { default: '#C2863E' },
      'accent.goldLight': { default: '#E3B775' },
      'accent.goldDeep': { default: '#8F5B1E' },
    },
  },
  fonts: {
    // The storefront opts into the display face explicitly (fontFamily="display");
    // admin headings stay on the clean sans.
    heading: FONT_BODY,
    body: FONT_BODY,
    display: FONT_DISPLAY,
    latin: FONT_LATIN,
  },
  styles: {
    global: {
      'html, body, #root': {
        minHeight: '100%',
      },
      body: {
        bg: 'bg.canvas',
        color: 'text.primary',
        fontFamily: 'body',
        fontWeight: 400,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        WebkitTapHighlightColor: 'transparent',
      },
      // Arabic letters must never be tracked apart. Latin accents opt out with
      // lang="en" (see <Eyebrow latin>).
      'html[dir="rtl"] *:not(:lang(en))': {
        letterSpacing: '0 !important',
      },
      '::selection': {
        background: 'rgba(194, 134, 62, 0.28)',
      },
      '@keyframes dyShimmer': {
        '0%': { backgroundPosition: '-400px 0' },
        '100%': { backgroundPosition: '400px 0' },
      },
      '.dy-shimmer': {
        backgroundImage:
          'linear-gradient(90deg, rgba(228,217,195,0) 0%, rgba(228,217,195,0.9) 50%, rgba(228,217,195,0) 100%)',
        backgroundSize: '800px 100%',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#EFE8D8',
        animation: 'dyShimmer 1.6s ease-in-out infinite',
      },
      '@media (prefers-reduced-motion: reduce)': {
        '*, *::before, *::after': {
          animationDuration: '0.01ms !important',
          animationIterationCount: '1 !important',
          transitionDuration: '0.01ms !important',
          scrollBehavior: 'auto !important',
        },
        '.dy-shimmer': { animation: 'none' },
      },
    },
  },
  shadows: {
    soft: '0 4px 24px rgba(110, 69, 21, 0.08)',
    softHover: '0 16px 40px -8px rgba(110, 69, 21, 0.18)',
    goldGlow: '0 10px 30px -8px rgba(194, 134, 62, 0.45)',
    outline: '0 0 0 3px rgba(194, 134, 62, 0.45)',
  },
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '22px',
    '2xl': '28px',
  },
  space: {
    'section-y': '80px',
    'section-y-mobile': '48px',
  },
  components: {
    Container: {
      baseStyle: {
        maxW: { base: '100%', md: '1200px' },
        px: { base: 5, md: 10 },
      },
    },
    Heading: {
      baseStyle: {
        fontFamily: 'heading',
        fontWeight: 600,
        color: 'text.primary',
      },
      sizes: {
        display: {
          fontSize: { base: '40px', md: '64px' },
          lineHeight: 1.2,
          fontWeight: 700,
        },
      },
    },
    Button: {
      baseStyle: {
        fontFamily: 'body',
        fontWeight: 500,
        letterSpacing: 0,
        textTransform: 'none',
        borderRadius: 'md',
        transition: `background 300ms ${EASE_OUT}, color 300ms ${EASE_OUT}, border-color 300ms ${EASE_OUT}, box-shadow 300ms ${EASE_OUT}, transform 300ms ${EASE_OUT}`,
        _focusVisible: {
          boxShadow: 'outline',
        },
      },
      sizes: {
        md: { h: '46px', px: 6, fontSize: '15px' },
        lg: { h: '54px', px: 8, fontSize: '16px' },
      },
      variants: {
        // ── Storefront ──
        /** Metallic gold pill — the primary call to action everywhere. */
        gold: {
          borderRadius: 'full',
          color: '#1A1208',
          bgImage: 'linear-gradient(100deg, #A8702F 0%, #C2863E 30%, #EFD09A 55%, #C2863E 78%, #9A6425 100%)',
          bgSize: '220% 100%',
          bgPosition: '0% 50%',
          boxShadow: '0 10px 30px -12px rgba(194, 134, 62, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
          transition: `background-position 900ms ${EASE_OUT}, transform 300ms ${EASE_OUT}, box-shadow 300ms ${EASE_OUT}`,
          _hover: {
            bgPosition: '100% 50%',
            transform: 'translateY(-2px)',
            boxShadow: '0 16px 36px -12px rgba(194, 134, 62, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            _disabled: { transform: 'none' },
          },
          _active: { transform: 'translateY(0) scale(0.98)' },
        },
        /** Noir pill with gold type — primary action on light surfaces. */
        noir: {
          borderRadius: 'full',
          bg: 'noir.800',
          color: 'brand.100',
          _hover: {
            bg: 'noir.600',
            transform: 'translateY(-2px)',
            boxShadow: '0 14px 30px -14px rgba(14, 11, 8, 0.6)',
            _disabled: { bg: 'noir.800', transform: 'none' },
          },
          _active: { transform: 'translateY(0) scale(0.98)' },
        },
        /** Hairline gold outline for dark surfaces. */
        ghostOnDark: {
          borderRadius: 'full',
          bg: 'transparent',
          color: 'text.onDark',
          border: '1px solid',
          borderColor: 'rgba(227, 183, 117, 0.45)',
          _hover: { bg: 'rgba(227, 183, 117, 0.08)', borderColor: 'brand.300', color: 'brand.100' },
          _active: { transform: 'scale(0.98)' },
        },
        /** Hairline outline for light surfaces. */
        outlineInk: {
          borderRadius: 'full',
          bg: 'transparent',
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'rgba(22, 18, 14, 0.18)',
          _hover: { borderColor: 'brand.700', color: 'brand.700', bg: 'rgba(194, 134, 62, 0.06)' },
          _active: { transform: 'scale(0.98)' },
        },

        // ── Admin (unchanged names) ──
        goldOutline: {
          bg: 'transparent',
          color: 'accent.goldDeep',
          border: '1px solid',
          borderColor: 'accent.gold',
          _hover: {
            bg: 'accent.gold',
            color: 'noir.800',
            boxShadow: 'goldGlow',
          },
        },
        blackGold: {
          bg: 'noir.800',
          color: 'brand.300',
          _hover: {
            bg: 'noir.600',
            color: 'brand.200',
            boxShadow: 'softHover',
          },
        },
        ghostGold: {
          bg: 'transparent',
          color: 'text.primary',
          _hover: { color: 'accent.goldDeep', bg: 'rgba(194, 134, 62, 0.08)' },
        },
      },
      defaultProps: { variant: 'goldOutline', size: 'md' },
    },
    Card: {
      parts: ['container', 'header', 'body', 'footer'],
      baseStyle: {
        container: {
          bg: 'bg.surface',
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'border.subtle',
          boxShadow: 'soft',
        },
      },
    },
    Input: { defaultProps: { focusBorderColor: 'brand.500' } },
    Textarea: { defaultProps: { focusBorderColor: 'brand.500' } },
    NumberInput: { defaultProps: { focusBorderColor: 'brand.500' } },
    Select: { defaultProps: { focusBorderColor: 'brand.500' } },
  },
};

export const theme = extendTheme(overrides);

export default theme;
