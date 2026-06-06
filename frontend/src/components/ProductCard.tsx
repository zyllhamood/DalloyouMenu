import { useMemo } from 'react';
import { AspectRatio, Box, LinkBox, LinkOverlay, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { Product } from '../lib/api';
import { formatPrice, localized } from '../lib/format';
import { getPrimaryProductImage } from '../lib/productImages';

interface ProductCardProps {
  product: Product;
  eager?: boolean;
  /** When true, the parent grid renders this card as a single full-width column */
  listMode?: boolean;
}

function normalisePrice(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

function formatCardPrice(product: Product, lang: string): string {
  const startingPrice = normalisePrice(product.starting_price);
  const basePrice = normalisePrice(product.base_price);
  const price = startingPrice ?? basePrice;
  if (price === null || price === undefined) return '—';
  return formatPrice(price, lang);
}

// ── Small gold "New" pill, anchored to the image's leading-top corner ──────────
function NewBadge({ label }: { label: string }) {
  return (
    <Box
      position="absolute"
      top={3}
      insetInlineStart={3}
      zIndex={2}
      bg="rgba(250,248,243,0.92)"
      backdropFilter="blur(4px)"
      color="accent.goldDeep"
      border="1px solid"
      borderColor="border.gold"
      px={2.5}
      py={1}
      borderRadius="full"
      fontSize="9px"
      fontWeight={600}
      letterSpacing="0.18em"
      textTransform="uppercase"
      lineHeight={1}
      pointerEvents="none"
    >
      {label}
    </Box>
  );
}

export function ProductCard({ product, eager = false }: ProductCardProps) {
  const { i18n, t } = useTranslation();
  const lang = i18n.language;

  const name = localized(product.name_en, product.name_ar, lang);
  const catName = localized(product.category.name_en, product.category.name_ar, lang);
  const sizeName = t(`sizes.${product.size.toLowerCase()}`);
  const price = formatCardPrice(product, lang);
  const unavailable = !product.is_available;
  const isNew = Boolean(product.is_new) && !unavailable;
  const primaryImage = useMemo(() => getPrimaryProductImage(product), [product]);

  const ImageInner = (
    <>
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
        <Box bg="border.subtle" opacity={0.45} w="100%" h="100%" />
      )}
    </>
  );

  const UnavailableTag = unavailable ? (
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
  ) : null;

  // ── Vertical product card ───────────────────────────────────────────────────
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
          <Box>{ImageInner}</Box>
        </AspectRatio>

        {isNew && <NewBadge label={t('product.new')} />}
        {UnavailableTag}
      </Box>

      <Box p={{ base: 5, md: 6 }}>
        <Text
          fontSize="10px"
          letterSpacing="0.24em"
          textTransform="uppercase"
          color="accent.goldDeep"
          mb={2}
        >
          {catName} · {sizeName}
        </Text>
        <LinkOverlay
          as={unavailable ? 'span' : RouterLink}
          {...(unavailable ? {} : { to: `/product/${product.id}` })}
          fontFamily="heading"
          fontSize={{ base: '22px', md: '27px' }}
          fontWeight={500}
          color="text.primary"
          lineHeight={1.2}
          display="block"
          mb={3}
          noOfLines={2}
        >
          {name}
        </LinkOverlay>
        <Text fontSize="13px" color="text.muted" letterSpacing="0.04em">
          {price}
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
