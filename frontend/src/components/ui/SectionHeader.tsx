import { Box, Flex, Heading, Text, type FlexProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

import Eyebrow from './Eyebrow';
import Reveal from './Reveal';

interface SectionHeaderProps extends Omit<FlexProps, 'title'> {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Rendered at the end of the row on wide screens (e.g. "view all"). */
  action?: ReactNode;
  tone?: 'light' | 'dark';
  align?: 'start' | 'center';
  headingId?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  tone = 'light',
  align = 'start',
  headingId,
  ...rest
}: SectionHeaderProps) {
  const centered = align === 'center';
  return (
    <Flex
      direction={{ base: 'column', md: centered ? 'column' : 'row' }}
      align={{ base: centered ? 'center' : 'flex-start', md: centered ? 'center' : 'flex-end' }}
      justify="space-between"
      gap={{ base: 5, md: 8 }}
      textAlign={centered ? 'center' : 'start'}
      {...rest}
    >
      <Reveal>
        <Box maxW="640px">
          {eyebrow && (
            <Eyebrow tone={tone} mb={{ base: 3, md: 4 }} justify={centered ? 'center' : 'flex-start'}>
              {eyebrow}
            </Eyebrow>
          )}
          <Heading
            as="h2"
            id={headingId}
            fontFamily="display"
            fontWeight={700}
            fontSize={{ base: '34px', md: '46px', xl: '54px' }}
            lineHeight={1.25}
            color={tone === 'dark' ? 'text.onDark' : 'text.primary'}
          >
            {title}
          </Heading>
          {subtitle && (
            <Text
              mt={{ base: 3, md: 4 }}
              fontSize={{ base: '15px', md: '17px' }}
              lineHeight={1.85}
              color={tone === 'dark' ? 'text.onDarkMuted' : 'text.muted'}
              maxW="520px"
              mx={centered ? 'auto' : undefined}
            >
              {subtitle}
            </Text>
          )}
        </Box>
      </Reveal>
      {action && <Box flexShrink={0}>{action}</Box>}
    </Flex>
  );
}

export default SectionHeader;
