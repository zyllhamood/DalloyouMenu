/**
 * BrandStatement — a short opening line, directly under the carousel.
 *
 * Deliberately brief: one or two sentences in the display face, centred
 * between two thin gold rules. Anyone who wants more reads on down the page.
 */

import { Box, Container, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export function BrandStatement() {
  const { t } = useTranslation();

  return (
    <Box as="section" py={{ base: '52px', md: '72px', lg: '88px' }}>
      <Container maxW="820px" px={{ base: 6, md: 10 }}>
        <Stack spacing={{ base: 6, md: 7 }} align="center">
          <Box h="1px" w="56px" bg="accent.gold" opacity={0.7} aria-hidden />

          <Text
            fontFamily="heading"
            fontSize={{ base: '20px', md: '24px', lg: '26px' }}
            lineHeight={1.75}
            color="text.primary"
            textAlign="center"
          >
            {t('hero.statement')}
          </Text>

          <Box h="1px" w="56px" bg="accent.gold" opacity={0.7} aria-hidden />
        </Stack>
      </Container>
    </Box>
  );
}

export default BrandStatement;
