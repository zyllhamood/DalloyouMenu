import { Box, type BoxProps } from '@chakra-ui/react';

interface MonogramProps extends BoxProps {
  /** Drifting highlight across the gold. */
  sheen?: boolean;
  /** Use the 1024px mask for very large renders. */
  large?: boolean;
}

/** The D monogram rendered as a polished-gold mask (crisp at any size). */
export function Monogram({ sheen = false, large = false, className, ...rest }: MonogramProps) {
  const classes = ['dy-mono', large && 'dy-mono--lg', sheen && 'dy-mono--sheen', className].filter(Boolean).join(' ');
  return <Box as="span" className={classes} aria-hidden flexShrink={0} {...rest} />;
}

export default Monogram;
