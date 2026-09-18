import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { Box, type BoxProps } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';

import { archRadius } from '../../lib/arch';
import { EASE_IN_OUT } from '../../lib/motion';

/*
 * The arch — Dalloyou's decorative motif (part patisserie vitrine, part the
 * arches of Gulf architecture). Product photography uses the square
 * PhotoFrame instead; the arch dresses places without a photo: the 404
 * niche, empty states and the branch cards.
 */

interface ArchStageProps extends BoxProps {
  /** width / height */
  ratio?: number;
  /** Radius of the two lower corners, px. */
  foot?: number;
}

/** A lit niche with the warm stage gradient (e.g. around the monogram). */
export const ArchStage = forwardRef<HTMLDivElement, ArchStageProps>(function ArchStage(
  { ratio = 4 / 5, foot = 18, sx, children, ...rest },
  ref,
) {
  return (
    <Box
      ref={ref}
      position="relative"
      overflow="hidden"
      sx={{
        aspectRatio: String(ratio),
        borderRadius: archRadius(ratio, foot),
        background: 'var(--dy-stage)',
        isolation: 'isolate',
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
});

/**
 * Hairline arch outline that fills its parent box, "drawn" in with a stroke
 * animation once `play` is set. The path is built in the box's real pixel
 * size (measured), so the arc is a true semicircle, the line is exactly
 * `strokeWidth` px at any size, and the draw-in dash maths stays exact.
 */
export function ArchOutline({
  color = 'rgba(227, 183, 117, 0.45)',
  play = true,
  delay = 0,
  duration = 1.8,
  strokeWidth = 1,
}: {
  color?: string;
  play?: boolean;
  delay?: number;
  duration?: number;
  strokeWidth?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Layout size, not getBoundingClientRect: a parent's scale animation must
    // not shrink the drawing.
    const measure = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const w = size?.w ?? 100;
  const h = size?.h ?? 125;
  const inset = strokeWidth / 2;
  const r = w / 2 - inset;
  const d = `M ${inset} ${h} L ${inset} ${w / 2} A ${r} ${r} 0 0 1 ${w - inset} ${w / 2} L ${w - inset} ${h}`;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
    >
      {size && (
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
          animate={play ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration, delay, ease: EASE_IN_OUT }}
        />
      )}
    </svg>
  );
}

export default ArchStage;
