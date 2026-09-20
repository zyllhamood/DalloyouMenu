import { forwardRef, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Box, type BoxProps, type ResponsiveValue } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';

import { EASE_IN_OUT } from '../../lib/motion';

/**
 * Product photography frame. The house shoots every product as a styled 1:1
 * photo (the same images used on the delivery apps and the WhatsApp
 * catalogue), so the photo fills the frame edge to edge — nothing is
 * cropped or tinted. Older transparent cut-outs still read well: the warm
 * stage colour shows through their empty areas.
 */

interface PhotoFrameProps extends BoxProps {
  /** width / height — 1 for the house's square photos. */
  ratio?: number;
  radius?: ResponsiveValue<string>;
}

export const PhotoFrame = forwardRef<HTMLDivElement, PhotoFrameProps>(function PhotoFrame(
  { ratio = 1, radius = { base: '18px', md: '22px' }, sx, children, ...rest },
  ref,
) {
  return (
    <Box
      ref={ref}
      position="relative"
      overflow="hidden"
      borderRadius={radius}
      sx={{
        aspectRatio: String(ratio),
        background: 'var(--dy-stage)',
        isolation: 'isolate',
        // A hairline keeps pale photos from dissolving into the ivory page.
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          boxShadow: 'inset 0 0 0 1px rgba(22, 18, 14, 0.06)',
          pointerEvents: 'none',
          zIndex: 3,
        },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
});

/** A diagonal glint that crosses the photo on hover (parents move it). */
export function FrameSheen({ className }: { className?: string }) {
  return (
    <Box
      className={className}
      position="absolute"
      inset={0}
      zIndex={2}
      pointerEvents="none"
      aria-hidden
      sx={{
        background:
          'linear-gradient(105deg, rgba(255,255,255,0) 40%, rgba(255,250,240,0.32) 50%, rgba(255,255,255,0) 60%)',
        transform: 'translateX(110%)',
      }}
    />
  );
}

/** Stacks flags ("جديد", a discount) in the photo's leading top corner. */
export function FrameBadges({ children }: { children: ReactNode }) {
  return (
    <Box
      position="absolute"
      top={{ base: 2.5, md: 3 }}
      insetInlineStart={{ base: 2.5, md: 3 }}
      zIndex={4}
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      gap={1.5}
      pointerEvents="none"
    >
      {children}
    </Box>
  );
}

/** "جديد" */
export function NewBadge({ label }: { label: string }) {
  return (
    <Box
      as="span"
      px={2.5}
      py="3px"
      borderRadius="full"
      bg="rgba(14, 11, 8, 0.78)"
      backdropFilter="blur(6px)"
      color="brand.100"
      fontSize="11px"
      fontWeight={500}
      lineHeight={1.5}
      whiteSpace="nowrap"
      pointerEvents="none"
      boxShadow="0 6px 14px -8px rgba(14, 11, 8, 0.6)"
    >
      {label}
    </Box>
  );
}

/**
 * Hairline rounded-rectangle outline that fills its parent, drawn in from
 * the top centre down both sides at once. Built in the box's measured pixel
 * size so corners stay round and the line stays `strokeWidth` px.
 */
export function FrameOutline({
  radius = 40,
  color = 'rgba(227, 183, 117, 0.45)',
  play = true,
  delay = 0,
  duration = 1.8,
  strokeWidth = 1,
}: {
  radius?: number;
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
  const h = size?.h ?? 100;
  const i = strokeWidth / 2;
  const r = Math.min(radius, w / 2, h / 2);
  const a = r - i;
  const cx = w / 2;
  const right = `M ${cx} ${i} H ${w - r} A ${a} ${a} 0 0 1 ${w - i} ${r} V ${h - r} A ${a} ${a} 0 0 1 ${w - r} ${h - i} H ${cx}`;
  const left = `M ${cx} ${i} H ${r} A ${a} ${a} 0 0 0 ${i} ${r} V ${h - r} A ${a} ${a} 0 0 0 ${r} ${h - i} H ${cx}`;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
    >
      {size &&
        [
          { side: 'right', d: right },
          { side: 'left', d: left },
        ].map(({ side, d }) => (
          <motion.path
            key={side}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
            animate={play ? { pathLength: 1, opacity: 1 } : undefined}
            transition={{ duration, delay, ease: EASE_IN_OUT }}
          />
        ))}
    </svg>
  );
}

export default PhotoFrame;
