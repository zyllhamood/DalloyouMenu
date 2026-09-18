import { Box, HStack, Text, type StackProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface EyebrowProps extends StackProps {
  children: ReactNode;
  /** Latin small caps with wide tracking (Arabic is never tracked). */
  latin?: boolean;
  tone?: 'light' | 'dark';
  rule?: boolean;
}

/** The small gold label that sits above headings. */
export function Eyebrow({ children, latin = false, tone = 'light', rule = true, ...rest }: EyebrowProps) {
  const color = tone === 'dark' ? 'brand.300' : 'brand.700';
  return (
    <HStack spacing={3} {...rest}>
      {rule && <Box w="22px" h="1px" bg={color} opacity={0.75} flexShrink={0} aria-hidden />}
      <Text
        as="span"
        lang={latin ? 'en' : undefined}
        dir={latin ? 'ltr' : undefined}
        fontFamily={latin ? 'latin' : 'body'}
        fontSize={latin ? { base: '10px', md: '11.5px' } : { base: '13px', md: '14px' }}
        fontWeight={500}
        letterSpacing={latin ? { base: '0.2em', sm: '0.28em', md: '0.34em' } : undefined}
        textTransform={latin ? 'uppercase' : undefined}
        color={color}
        lineHeight={1.4}
        whiteSpace={latin ? 'nowrap' : undefined}
      >
        {children}
      </Text>
    </HStack>
  );
}

export default Eyebrow;
