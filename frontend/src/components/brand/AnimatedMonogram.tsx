import { useEffect, useId, useRef, useState } from 'react';
import { Box, type BoxProps } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'framer-motion';

import { EASE_PEN, MONOGRAM_SRC } from '../home/tokens';

/*
 * The D monogram, written by a pen.
 *
 * The artwork is the brand's own raster file — never redrawn. Three thick
 * strokes follow the letter's ductus (the stem top to bottom, the foot
 * serif, then one continuous sweep along the top bar, round the bowl, back
 * across the stem and into the inner curl). Each stroke is painted *with the
 * artwork as its pattern*, so wherever the pen has passed, the real letter
 * shows. A glowing nib rides the tip, and once complete a band of light
 * crosses the gold every few seconds.
 *
 * (Painting the strokes with a pattern instead of animating an SVG <mask>
 * matters: Chrome does not always repaint masked content when only the mask
 * changes, and the letter would stay invisible.)
 *
 * Driven by one 0 → 1 progress value: its own timeline (`play`) or one
 * handed in from outside (`progress`, e.g. scroll). Coordinates are in the
 * 512 × 512 space of the artwork.
 */

const STEM = 'M 161 2 L 161 402';
const FOOT = 'M 100 395 L 222 395';
const SWEEP =
  'M 98 10 L 270 10 C 392 12 462 112 458 250 C 454 372 382 470 262 497 C 150 520 62 462 46 360 C 34 276 88 204 164 192 C 246 180 314 228 318 292 C 321 334 304 360 284 378';

/** Share of the timeline each stroke occupies (they overlap a little, like a hand). */
const SEGMENTS = {
  stem: [0, 0.26],
  foot: [0.22, 0.32],
  sweep: [0.3, 1],
} as const;

const WIDTH = { stem: 60, foot: 26, sweep: 62 } as const;

const glint = keyframes`
  0% { background-position: 130% 0; }
  22%, 100% { background-position: -30% 0; }
`;

/** Resolves once the artwork is decoded, so the pen never draws an empty letter. */
function useArtworkReady(src: string) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.src = src;
    img
      .decode()
      .catch(() => undefined)
      .then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [src]);
  return ready;
}

interface AnimatedMonogramProps extends Omit<BoxProps, 'children'> {
  /** Start the built-in timeline (ignored when `progress` is given). */
  play?: boolean;
  /** Drive the drawing from outside (0 → 1), e.g. from scroll. */
  progress?: MotionValue<number>;
  delay?: number;
  duration?: number;
  /** The glowing pen tip. */
  nib?: boolean;
  /** Light crossing the gold once drawn, then every few seconds. */
  sheen?: boolean;
  onDrawn?: () => void;
  /** Overlay the pen strokes (for tuning the ductus). */
  debug?: boolean;
}

export function AnimatedMonogram({
  play = true,
  progress: external,
  delay = 0,
  duration = 2.1,
  nib = true,
  sheen = true,
  onDrawn,
  debug = false,
  ...rest
}: AnimatedMonogramProps) {
  const reduce = useReducedMotion();
  const ready = useArtworkReady(MONOGRAM_SRC);
  // Mask ids end up in url(#…) — keep them to characters every engine accepts.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const internal = useMotionValue(0);
  const progress = external ?? internal;
  const [drawn, setDrawn] = useState(false);

  const stem = useTransform(progress, [...SEGMENTS.stem], [0, 1]);
  const foot = useTransform(progress, [...SEGMENTS.foot], [0, 1]);
  const sweep = useTransform(progress, [...SEGMENTS.sweep], [0, 1]);
  // Round caps would leave a dot at length 0 — each stroke stays hidden until it starts.
  const stemOn = useTransform(stem, (v) => (v > 0.002 ? 1 : 0));
  const footOn = useTransform(foot, (v) => (v > 0.002 ? 1 : 0));
  const sweepOn = useTransform(sweep, (v) => (v > 0.002 ? 1 : 0));

  // ── Built-in timeline ──────────────────────────────────────────────────
  useEffect(() => {
    if (external || !play || !ready) return;
    if (reduce) {
      internal.set(1);
      return;
    }
    const controls = animate(internal, 1, { duration, delay, ease: EASE_PEN });
    return () => controls.stop();
  }, [external, play, ready, reduce, duration, delay, internal]);

  // ── The nib rides the tip of whichever stroke is being drawn ──────────
  const stemRef = useRef<SVGPathElement>(null);
  const footRef = useRef<SVGPathElement>(null);
  const sweepRef = useRef<SVGPathElement>(null);
  const nibX = useMotionValue(161);
  const nibY = useMotionValue(2);
  const nibOpacity = useTransform(progress, [0, 0.02, 0.93, 1], [0, 1, 1, 0]);

  useMotionValueEvent(progress, 'change', (p) => {
    const complete = p >= 0.999;
    if (complete !== drawn) {
      setDrawn(complete);
      if (complete) onDrawn?.();
    }
    if (!nib) return;
    const s = sweep.get();
    const f = foot.get();
    const active = s > 0 ? { el: sweepRef.current, t: s } : f > 0 && f < 1 ? { el: footRef.current, t: f } : { el: stemRef.current, t: stem.get() };
    if (!active.el) return;
    const point = active.el.getPointAtLength(active.el.getTotalLength() * active.t);
    nibX.set(point.x);
    nibY.set(point.y);
  });

  const paint = `url(#dyp-${uid})`;
  const nibFill = `url(#dyn-${uid})`;

  return (
    <Box as="span" display="block" position="relative" aria-hidden {...rest}>
      <svg viewBox="0 0 512 512" width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          {/* The tile is padded well past the strokes' reach, so it never repeats into view. */}
          <pattern id={`dyp-${uid}`} patternUnits="userSpaceOnUse" x="-120" y="-120" width="752" height="752">
            {ready && <image href={MONOGRAM_SRC} x="120" y="120" width="512" height="512" />}
          </pattern>
          <radialGradient id={`dyn-${uid}`}>
            <stop offset="0" stopColor="#FFF1D2" stopOpacity="1" />
            <stop offset="0.25" stopColor="#F0CF95" stopOpacity="0.85" />
            <stop offset="1" stopColor="#C2863E" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g fill="none" stroke={paint} strokeLinecap="round" strokeLinejoin="round">
          <motion.path ref={stemRef} d={STEM} strokeWidth={WIDTH.stem} style={{ pathLength: stem, opacity: stemOn }} />
          <motion.path ref={footRef} d={FOOT} strokeWidth={WIDTH.foot} style={{ pathLength: foot, opacity: footOn }} />
          <motion.path ref={sweepRef} d={SWEEP} strokeWidth={WIDTH.sweep} style={{ pathLength: sweep, opacity: sweepOn }} />
        </g>

        {nib && !reduce && (
          <motion.g style={{ opacity: nibOpacity }}>
            <motion.circle cx={nibX} cy={nibY} r={34} fill={nibFill} />
            <motion.circle cx={nibX} cy={nibY} r={5} fill="#FFF6E4" />
          </motion.g>
        )}

        {debug && (
          <g fill="none" stroke="rgba(255, 40, 40, 0.35)" strokeLinecap="round" strokeLinejoin="round">
            <path d={STEM} strokeWidth={WIDTH.stem} />
            <path d={FOOT} strokeWidth={WIDTH.foot} />
            <path d={SWEEP} strokeWidth={WIDTH.sweep} />
          </g>
        )}
      </svg>

      {/* The glint: the letter itself as a CSS mask over a travelling band of light. */}
      {sheen && !reduce && (
        <Box
          as="span"
          position="absolute"
          inset={0}
          pointerEvents="none"
          opacity={drawn ? 1 : 0}
          transition="opacity 600ms"
          sx={{
            WebkitMask: `url(${MONOGRAM_SRC}) center / contain no-repeat`,
            mask: `url(${MONOGRAM_SRC}) center / contain no-repeat`,
            backgroundImage: 'linear-gradient(105deg, rgba(255,244,220,0) 40%, rgba(255,244,220,0.9) 50%, rgba(255,244,220,0) 60%)',
            backgroundSize: '260% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '130% 0',
            mixBlendMode: 'soft-light',
            animation: drawn ? `${glint} 7s cubic-bezier(0.65, 0, 0.35, 1) infinite` : undefined,
          }}
        />
      )}
    </Box>
  );
}

export default AnimatedMonogram;
