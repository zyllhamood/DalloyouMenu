import { Fragment } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import { useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import Monogram from '../brand/Monogram';
import { categoryName, useMenuIndex } from '../../lib/menu';

/**
 * A slow ribbon of the house's categories and promises, set in the display
 * face and separated by the monogram. It runs left → right, the way Arabic
 * tickers do, so every phrase enters with its first word.
 */
export function Marquee() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { index } = useMenuIndex();

  const phrases = [
    ...index.categories.map(categoryName),
    t('marquee.crafted'),
    t('marquee.served'),
    t('marquee.fresh'),
  ];
  // Each copy is doubled so it always spans the widest screens.
  const loop = [...phrases, ...phrases];

  const copy = (hidden: boolean) => (
    <HStack as="span" spacing={{ base: 7, md: 12 }} pe={{ base: 7, md: 12 }} flexShrink={0} aria-hidden={hidden || undefined}>
      {loop.map((phrase, i) => (
        <Fragment key={`${phrase}-${i}`}>
          <Text
            as="span"
            fontFamily="display"
            fontWeight={700}
            fontSize={{ base: '26px', md: '38px' }}
            lineHeight={1.6}
            whiteSpace="nowrap"
            className={i % 2 === 0 ? 'dy-metal-text' : undefined}
            color={i % 2 === 0 ? undefined : 'text.onDark'}
            opacity={i % 2 === 0 ? 1 : 0.88}
          >
            {phrase}
          </Text>
          <Monogram w={{ base: '18px', md: '22px' }} h={{ base: '18px', md: '22px' }} opacity={0.75} />
        </Fragment>
      ))}
    </HStack>
  );

  return (
    <Box
      data-nav-theme="dark"
      bg="noir.800"
      borderTop="1px solid rgba(227, 183, 117, 0.12)"
      borderBottom="1px solid rgba(227, 183, 117, 0.12)"
      py={{ base: 4, md: 6 }}
      overflow="hidden"
      sx={{
        maskImage: 'linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%)',
      }}
    >
      <Box
        display="flex"
        w="max-content"
        sx={{
          animation: reduce ? undefined : 'dy-marquee 46s linear infinite',
          '&:hover': { animationPlayState: 'paused' },
        }}
      >
        {copy(false)}
        {copy(true)}
      </Box>
    </Box>
  );
}

export default Marquee;
