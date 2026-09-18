import type { CSSProperties, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { EASE_OUT } from '../../lib/motion';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  /** Distance travelled upwards, in px. */
  y?: number;
  duration?: number;
  /** Share of the element that must be visible before it animates. */
  amount?: number;
  className?: string;
  style?: CSSProperties;
}

/** Fades and lifts its content into place the first time it scrolls into view. */
export function Reveal({ children, delay = 0, y = 28, duration = 0.9, amount = 0.2, className, style }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: '0px 0px -6% 0px' }}
      transition={{ duration: reduce ? 0.3 : duration, ease: EASE_OUT, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;
