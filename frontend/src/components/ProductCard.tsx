import { useMemo } from 'react';
import { AspectRatio, Box, LinkBox, LinkOverlay, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { Product } from '../lib/api';
import { formatStartingFrom, localized } from '../lib/format';
import { getPrimaryVariantImage } from '../lib/productImages';

interface ProductCardProps {
  product: Product;
  eager?: boolean;
  /** When true (mobile list mode) the image aspect ratio is 4:3 instead of 4:5 */
  listMode?: boolean;
}

export function ProductCard({ product, eager = false }: ProductCardProps) {
  const { i18n, t } = useTranslation();
  const lang = i18n.language;

  const name = localized(product.name_en, product.name_ar, lang);
  const catName = localized(product.category.name_en, product.category.name_ar, lang);
  const price = product.starting_price ?? product.base_price;
  const unavailable = !product.is_available;
  const primaryImage = useMemo(() => getPrimaryVariantImage(product), [product]);

  return (
    <LinkBox
      as="article"
      role="group"
      position="relative"
      bg="bg.surface"
      borderRadius="lg"
      border="1px solid"
      borderColor="border.subtle"
      overflow="hidden"
      transition="all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      cursor={unavailable ? 'default' : 'pointer'}
      _hover={
        unavailable
          ? {}
          : {
            transform: 'translateY(-4px)',
            boxShadow: 'softHover',
            borderColor: 'border.gold',
          }
      }
    >
      <Box position="relative" bg="warm.cream" overflow="hidden">
        {/*
          * PRODUCT_CARD_IMAGE_ASPECT — change this single value to adjust card
          * image proportions across the entire app (home + menu, all viewports).
          * Common options: "1 / 1" (square), "5 / 4" (current), "10 / 7" (shorter),
          * "4 / 3" (boxier), "16 / 9" (wide).
          */}
        <AspectRatio ratio={5 / 4}>
          {primaryImage ? (
            <Box
              as="img"
              src={primaryImage}
              alt={name}
              loading={eager ? 'eager' : 'lazy'}
              sx={{
                objectFit: 'cover',
                objectPosition: 'center',
                width: '100%',
                height: '100%',
                filter: unavailable ? 'grayscale(1) opacity(0.6)' : 'none',
                transition: 'transform 600ms ease-out',
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }}
              _groupHover={unavailable ? undefined : { transform: 'scale(1.04)' }}
            />
          ) : (
            <Box bg="border.subtle" opacity={0.45} />
          )}
        </AspectRatio>

        {unavailable && (
          <Box
            position="absolute"
            inset={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            pointerEvents="none"
          >
            <Box
              bg="rgba(26,26,26,0.85)"
              color="accent.gold"
              px={4}
              py={2}
              borderRadius="sm"
              border="1px solid"
              borderColor="accent.gold"
              fontSize="11px"
              letterSpacing="0.24em"
              textTransform="uppercase"
            >
              {t('product.unavailable')}
            </Box>
          </Box>
        )}
      </Box>

      <Box p={{ base: 5, md: 6 }}>
        <Text
          fontSize="10px"
          letterSpacing="0.24em"
          textTransform="uppercase"
          color="accent.goldDeep"
          mb={2}
        >
          {catName}
        </Text>
        <LinkOverlay
          as={unavailable ? 'span' : RouterLink}
          {...(unavailable ? {} : { to: `/product/${product.id}` })}
          fontFamily="heading"
          fontSize="27px"
          fontWeight={500}
          color="text.primary"
          lineHeight={1.2}
          display="block"
          mb={3}
        >
          {name}
        </LinkOverlay>
        <Text fontSize="13px" color="text.muted" letterSpacing="0.04em">
          {formatStartingFrom(price, lang)}
        </Text>
      </Box>
    </LinkBox>
  );
}

export function ProductCardSkeleton() {
  return (
    <Box
      bg="bg.surface"
      borderRadius="lg"
      border="1px solid"
      borderColor="border.subtle"
      overflow="hidden"
    >
      <AspectRatio ratio={5 / 4}>
        <Box bg="warm.cream" className="dy-shimmer" />
      </AspectRatio>
      <Box p={6}>
        <Box h="10px" w="40%" bg="warm.cream" mb={3} className="dy-shimmer" borderRadius="sm" />
        <Box h="20px" w="80%" bg="warm.cream" mb={3} className="dy-shimmer" borderRadius="sm" />
        <Box h="12px" w="30%" bg="warm.cream" className="dy-shimmer" borderRadius="sm" />
      </Box>
    </Box>
  );
}

export default ProductCard;
