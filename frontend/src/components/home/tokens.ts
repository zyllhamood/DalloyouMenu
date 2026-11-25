/**
 * The home page's shared foundation — every section builds on it. Colours and fonts come from the existing Chakra theme (noir,
 * ivory, brand gold; Amiri / IBM Plex Sans Arabic / Bodoni Moda), so the
 * page stays one identity with the rest of the storefront. What is new here
 * is the rhythm: one easing, one set of durations, one section spacing, one
 * shape language (the arch + the pen stroke drawn from the monogram).
 */
import type { Variants } from 'framer-motion';

// ─── Motion ────────────────────────────────────────────────────────────────

/** Every entrance on the page settles with this curve (expo-out). */
export const EASE = [0.16, 1, 0.3, 1] as const;
/** For things that travel and land (the pen, carousels, wipes). */
export const EASE_PEN = [0.65, 0, 0.35, 1] as const;

export const DUR = {
  quick: 0.45,
  base: 0.9,
  slow: 1.3,
} as const;

/** Delay between siblings (words, cards). */
export const STAGGER = 0.07;

/** Elements animate once, when ~15% inside the viewport. */
export const VIEWPORT = { once: true, margin: '0px 0px -15% 0px' } as const;

export const riseIn: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE, delay } }),
};

// ─── Layout ────────────────────────────────────────────────────────────────

export const CONTAINER_W = '1320px';

/** Vertical breathing room of every section. */
export const SECTION_PY = { base: '96px', md: '128px', xl: '152px' } as const;

/**
 * Sections overlap the one above by this much and round their top corners,
 * so each surface slides over the last like a sheet of patisserie paper.
 */
export const SHEET_RADIUS = { base: '28px', md: '48px' } as const;
export const SHEET_OVERLAP = { base: '-28px', md: '-48px' } as const;

/** The arch — the house motif (vitrine niches, Gulf arches). */
export const ARCH_RADIUS = '999px 999px 22px 22px';

// ─── Surfaces ──────────────────────────────────────────────────────────────

export const SURFACE = {
  noir: { bg: 'noir.800', color: 'text.onDark', muted: 'text.onDarkMuted', accent: 'brand.300', line: 'rgba(227, 183, 117, 0.16)' },
  ivory: { bg: 'ivory.100', color: 'text.primary', muted: 'text.muted', accent: 'brand.700', line: 'rgba(22, 18, 14, 0.1)' },
  tint: { bg: 'ivory.200', color: 'text.primary', muted: 'text.muted', accent: 'brand.700', line: 'rgba(22, 18, 14, 0.1)' },
} as const;

export type SurfaceKey = keyof typeof SURFACE;

// ─── Type scale ────────────────────────────────────────────────────────────

export const TYPE = {
  /** Section titles. */
  title: { fontFamily: 'display', fontWeight: 700, fontSize: { base: '36px', md: '50px', xl: '60px' }, lineHeight: 1.25 },
  /** Card and panel titles. */
  card: { fontFamily: 'display', fontWeight: 700, fontSize: { base: '28px', md: '34px' }, lineHeight: 1.3 },
  lead: { fontSize: { base: '15.5px', md: '17px' }, lineHeight: 1.9 },
  /** Latin numerals and small caps (never used on Arabic). */
  latin: { fontFamily: 'latin', letterSpacing: '0.18em' },
} as const;

// ─── Images ────────────────────────────────────────────────────────────────

export const MONOGRAM_SRC = '/brand/monogram-1024.webp';
export const LOCKUP_LIGHT_SRC = '/brand/lockup-light.webp';
export const LOCKUP_DARK_SRC = '/brand/lockup-dark.webp';
