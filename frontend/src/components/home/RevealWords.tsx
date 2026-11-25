import { Fragment } from 'react';
import { Box, Text, type BoxProps, type TextProps } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';

import { EASE, STAGGER, VIEWPORT } from './tokens';

const TAGS = { h1: motion.h1, h2: motion.h2, h3: motion.h3, p: motion.p } as const;

interface RevealWordsProps extends Omit<TextProps, 'children' | 'as'> {
  text: string;
  /** The semantic element (rendered as its motion counterpart). */
  as?: keyof typeof TAGS;
  /** Words (exact match, punctuation included) set in polished gold. */
  gold?: string[];
  delay?: number;
  /** Drive it from a timeline instead of the viewport. */
  play?: boolean;
  duration?: number;
  /** How a "\n" in `text` renders — e.g. { base: 'none', lg: 'inline' } breaks on desktop only. */
  lineBreak?: BoxProps['display'];
}

/**
 * Text that rises word by word out of its own line, like type set into a
 * press. Arabic is only ever split at spaces — never into letters — so the
 * script keeps its joins. The mask is padded so tashkeel and the tall
 * Amiri ascenders are never clipped.
 */
export function RevealWords({ text, as = 'p', gold = [], delay = 0, play, duration = 1.05, lineBreak = 'inline', ...rest }: RevealWordsProps) {
  const reduce = useReducedMotion();
  const words = text
    .split('\n')
    .flatMap((line) => {
      const lineWords = line.split(/\s+/).filter(Boolean);
      return lineWords.map((word, i) => ({ word, endsLine: i === lineWords.length - 1 }));
    });
  const golden = new Set(gold);
  const trigger = play === undefined ? { whileInView: 'show', viewport: VIEWPORT } : { animate: play ? 'show' : 'hidden' };

  return (
    <Text
      as={TAGS[as]}
      initial="hidden"
      {...trigger}
      variants={{ hidden: {}, show: { transition: { staggerChildren: STAGGER, delayChildren: delay } } }}
      {...rest}
    >
      {words.map(({ word, endsLine }, i) => (
        <Fragment key={`${word}-${i}`}>
          <Box
            as="span"
            display="inline-block"
            overflow="hidden"
            verticalAlign="top"
            // Room for marks above and below the line, without moving the text.
            sx={{ paddingBlock: '0.22em 0.3em', marginBlock: '-0.22em -0.3em', paddingInline: '0.04em', marginInline: '-0.04em' }}
          >
            <motion.span
              className={golden.has(word) ? 'dy-metal-text' : undefined}
              style={{ display: 'inline-block', willChange: 'transform' }}
              variants={{
                hidden: { y: reduce ? 0 : '112%', opacity: reduce ? 0 : 1 },
                show: { y: '0%', opacity: 1, transition: { duration, ease: EASE } },
              }}
            >
              {word}
            </motion.span>
            {i < words.length - 1 ? ' ' : null}
          </Box>
          {endsLine && i < words.length - 1 && <Box as="br" display={lineBreak} />}
        </Fragment>
      ))}
    </Text>
  );
}

export default RevealWords;
