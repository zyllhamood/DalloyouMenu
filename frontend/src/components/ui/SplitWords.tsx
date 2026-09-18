import { Fragment, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { EASE_OUT } from '../../lib/motion';

interface SplitWordsProps {
  text: string;
  /** Start the reveal (lets the hero wait for the intro curtain). */
  play?: boolean;
  delay?: number;
  stagger?: number;
  /** Applied to every word — e.g. `dy-metal-text` for polished gold. */
  wordClassName?: string;
}

/**
 * Each word rises out of an invisible mask. Arabic is split on spaces only,
 * never into letters, so the script's joining is always preserved. The mask
 * is generously padded, and removed once the words have landed, so tall
 * tashkeel (a shadda carrying a fatha) and descenders are never clipped.
 */
export function SplitWords({ text, play = true, delay = 0, stagger = 0.09, wordClassName }: SplitWordsProps) {
  const reduce = useReducedMotion();
  const [landed, setLanded] = useState(false);
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            style={{
              display: 'inline-block',
              overflow: landed ? 'visible' : 'hidden',
              paddingBlock: '0.5em 0.4em',
              marginBlock: '-0.5em -0.4em',
              paddingInline: '0.06em',
              marginInline: '-0.06em',
            }}
          >
            <motion.span
              className={wordClassName}
              style={{ display: 'inline-block' }}
              initial={reduce ? { opacity: 0 } : { y: '130%' }}
              animate={play ? (reduce ? { opacity: 1 } : { y: '0%' }) : undefined}
              transition={{ duration: reduce ? 0.4 : 1.15, ease: EASE_OUT, delay: delay + i * stagger }}
              onAnimationComplete={i === words.length - 1 ? () => setLanded(true) : undefined}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 && ' '}
        </Fragment>
      ))}
    </>
  );
}

export default SplitWords;
