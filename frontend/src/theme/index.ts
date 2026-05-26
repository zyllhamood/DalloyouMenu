import { extendTheme, type ThemeConfig, type ThemeOverride } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const LATIN_HEADING = `'Cormorant Garamond', 'El Messiri', Georgia, serif`;
const LATIN_BODY = `'Inter', 'Tajawal', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;

export const ARABIC_HEADING = `'El Messiri', 'Cormorant Garamond', Georgia, serif`;
export const ARABIC_BODY = `'Tajawal', 'Inter', system-ui, sans-serif`;

const overrides: ThemeOverride = {
  config,
  colors: {
    brand: {
      50: '#FBF7EC',
      100: '#F4ECD2',
      200: '#E8D9A4',
      300: '#DCC677',
      400: '#D0B25E',
      500: '#C9A961',
      600: '#A88A4D',
      700: '#8A7040',
      800: '#665232',
      900: '#3F3320',
    },
    warm: {
      black: '#1A1A1A',
      cream: '#FAF8F3',
      card: '#FFFFFF',
      muted: '#6B6B6B',
      border: '#EAE4D5',
    },
  },
  semanticTokens: {
    colors: {
      'bg.canvas': { default: '#FAF8F3' },
      'bg.surface': { default: '#FFFFFF' },
      'text.primary': { default: '#1A1A1A' },
      'text.muted': { default: '#6B6B6B' },
      'text.onDark': { default: '#FAF8F3' },
      'border.subtle': { default: '#EAE4D5' },
      'border.gold': { default: 'rgba(201, 169, 97, 0.4)' },
      'accent.gold': { default: '#C9A961' },
      'accent.goldDeep': { default: '#A88A4D' },
    },
  },
  fonts: {
    heading: LATIN_HEADING,
    body: LATIN_BODY,
  },
  styles: {
    global: {
      'html, body, #root': {
        height: '100%',
      },
      body: {
        bg: 'bg.canvas',
        color: 'text.primary',
        fontFamily: 'body',
        fontWeight: 400,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      'html[dir="rtl"] body': {
        fontFamily: ARABIC_BODY,
      },
      'html[dir="rtl"] h1, html[dir="rtl"] h2, html[dir="rtl"] h3, html[dir="rtl"] h4, html[dir="rtl"] h5, html[dir="rtl"] h6': {
        fontFamily: ARABIC_HEADING,
      },
      '::selection': {
        background: 'rgba(201, 169, 97, 0.3)',
      },
      '@keyframes dyShimmer': {
        '0%': { backgroundPosition: '-400px 0' },
        '100%': { backgroundPosition: '400px 0' },
      },
      '.dy-shimmer': {
        backgroundImage:
          'linear-gradient(90deg, rgba(234,228,213,0) 0%, rgba(234,228,213,0.85) 50%, rgba(234,228,213,0) 100%)',
        backgroundSize: '800px 100%',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#F1ECDD',
        animation: 'dyShimmer 1.6s ease-in-out infinite',
      },
      '@media (prefers-reduced-motion: reduce)': {
        '.dy-shimmer': { animation: 'none' },
      },
    },
  },
  shadows: {
    soft: '0 4px 24px rgba(168, 138, 77, 0.08)',
    softHover: '0 12px 32px rgba(168, 138, 77, 0.16)',
    goldGlow: '0 8px 24px rgba(201, 169, 97, 0.22)',
  },
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
  },
  space: {
    'section-y': '80px',
    'section-y-mobile': '48px',
  },
  components: {
    Container: {
      baseStyle: {
        maxW: { base: '100%', md: '1200px' },
        px: { base: 6, md: 10 },
      },
    },
    Heading: {
      baseStyle: {
        fontFamily: 'heading',
        fontWeight: 500,
        letterSpacing: '-0.01em',
        color: 'text.primary',
      },
      sizes: {
        display: {
          fontSize: { base: '44px', md: '72px' },
          lineHeight: 1.05,
          fontWeight: 500,
        },
      },
    },
    Button: {
      baseStyle: {
        fontFamily: 'body',
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        borderRadius: 'sm',
        transition: 'all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        _focusVisible: {
          boxShadow: '0 0 0 3px rgba(201, 169, 97, 0.5)',
        },
      },
      sizes: {
        md: { h: '48px', px: 7, fontSize: '13px' },
        lg: { h: '56px', px: 9, fontSize: '14px' },
      },
      variants: {
        goldOutline: {
          bg: 'transparent',
          color: 'accent.goldDeep',
          border: '1px solid',
          borderColor: 'accent.gold',
          _hover: {
            bg: 'accent.gold',
            color: 'warm.black',
            transform: 'translateY(-2px)',
            boxShadow: 'goldGlow',
          },
          _active: { transform: 'translateY(0)' },
        },
        blackGold: {
          bg: 'warm.black',
          color: 'accent.gold',
          _hover: {
            bg: '#000',
            color: 'brand.300',
            transform: 'translateY(-2px)',
            boxShadow: 'softHover',
          },
          _active: { transform: 'translateY(0)' },
        },
        ghostGold: {
          bg: 'transparent',
          color: 'text.primary',
          _hover: { color: 'accent.goldDeep', bg: 'transparent' },
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
          transition: 'all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          _hover: {
            transform: 'translateY(-4px)',
            boxShadow: 'softHover',
          },
        },
      },
    },
  },
};

export const theme = extendTheme(overrides);

export default theme;
