import { Box, HStack, Text, type StackProps } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';

import { DUR, EASE, EASE_PEN, VIEWPORT } from './tokens';

interface SectionMarkerProps extends StackProps {
  index: number;
  label: string;
  tone?: 'light' | 'dark';
  justify?: StackProps['justify'];
}

/**
 * "01 ——— تشكيلاتنا". The chapter number in Bodoni, then a gold hairline
 * drawn by the same pen that writes the monogram in the hero, then the
 * section's name. It opens every section, so the page reads as chapters.
 */
export function SectionMarker({ index, label, tone = 'light', ...rest }: SectionMarkerProps) {
  const reduce = useReducedMotion();
  const gold = tone === 'dark' ? 'brand.300' : 'brand.700';

  return (
    <HStack
      as={motion.div}
      spacing={{ base: 3, md: 4 }}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      {...rest}
    >
      <Text
        as={motion.span}
        lang="en"
        dir="ltr"
        fontFamily="latin"
        fontSize={{ base: '13px', md: '14px' }}
        letterSpacing="0.12em"
        color={gold}
        lineHeight={1}
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: DUR.quick } } }}
      >
        {String(index).padStart(2, '0')}
      </Text>
      <Box w={{ base: '36px', md: '56px' }} h="1px" position="relative" aria-hidden>
        <Box
          as={motion.span}
          position="absolute"
          inset={0}
          bg={gold}
          transformOrigin="right"
          variants={{
            hidden: { scaleX: reduce ? 1 : 0 },
            show: { scaleX: 1, transition: { duration: DUR.base, ease: EASE_PEN, delay: 0.1 } },
          }}
        />
      </Box>
      <Text
        as={motion.span}
        fontSize={{ base: '13.5px', md: '14.5px' }}
        fontWeight={500}
        color={gold}
        lineHeight={1.4}
        variants={{
          hidden: { opacity: 0, x: reduce ? 0 : -8 },
          show: { opacity: 1, x: 0, transition: { duration: DUR.base, ease: EASE, delay: 0.45 } },
        }}
      >
        {label}
      </Text>
    </HStack>
  );
}

export default SectionMarker;
