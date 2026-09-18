import { Box, Flex, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { Product } from '../../lib/api';
import { displayName, measurementText } from '../../lib/menu';
import { useModalLinkState } from '../../lib/routing';
import PhotoFrame, { FrameSheen, NewBadge } from './PhotoFrame';
import Price from './Price';
import ProductImage from './ProductImage';

interface ProductCardProps {
  product: Product;
  /** `sizes` for the image — how wide the card renders. */
  sizes?: string;
  eager?: boolean;
  tone?: 'light' | 'dark';
  /** Replace the history entry (used when switching products inside the quick view). */
  replace?: boolean;
}

export const CARD_SIZES = '(min-width: 80em) 280px, (min-width: 62em) 23vw, (min-width: 48em) 31vw, 46vw';

/**
 * The menu card: the square product photo, edge to edge, with the name and
 * price beneath. On hover the photo drifts closer and a glint crosses it; on
 * touch the press is felt as a slight settle. Opens the quick-view sheet.
 */
export function ProductCard({ product, sizes = CARD_SIZES, eager = false, tone = 'light', replace = false }: ProductCardProps) {
  const { t } = useTranslation();
  const linkState = useModalLinkState();
  const name = displayName(product);
  const measure = measurementText(product, t);

  return (
    <Box
      as={RouterLink}
      to={`/product/${product.id}`}
      state={linkState}
      replace={replace}
      aria-label={t('product.view', { name })}
      display="block"
      role="group"
      sx={{
        WebkitTapHighlightColor: 'transparent',
        '.dy-card-frame': {
          boxShadow: '0 18px 36px -30px rgba(62, 38, 14, 0.55)',
          transition: 'transform 500ms var(--dy-ease), box-shadow 700ms var(--dy-ease)',
        },
        '.dy-card-sheen': { transition: 'transform 1100ms var(--dy-ease)' },
        '&:active .dy-card-frame': { transform: 'scale(0.985)' },
        '@media (hover: hover)': {
          '&:hover .dy-card-frame': { boxShadow: '0 30px 54px -30px rgba(62, 38, 14, 0.6)' },
          '&:hover .dy-card-img': { transform: 'scale(1.06)' },
          '&:hover .dy-card-sheen': { transform: 'translateX(-110%)' },
          '&:hover .dy-card-name': { color: tone === 'dark' ? 'brand.200' : 'brand.700' },
        },
      }}
    >
      <PhotoFrame className="dy-card-frame">
        <ProductImage
          product={product}
          sizes={sizes}
          eager={eager}
          className="dy-card-img"
          style={{ position: 'absolute', inset: 0 }}
        />
        <FrameSheen className="dy-card-sheen" />
        {product.is_new && <NewBadge label={t('product.new')} />}
      </PhotoFrame>

      <Box pt={{ base: 3, md: 4 }} px={0.5}>
        <Text
          as="h3"
          className="dy-card-name"
          fontFamily="display"
          fontWeight={700}
          fontSize={{ base: '17px', md: '19px', xl: '20px' }}
          lineHeight={1.55}
          color={tone === 'dark' ? 'text.onDark' : 'text.primary'}
          noOfLines={2}
          transition="color 300ms"
        >
          {name}
        </Text>
        <Flex mt={1.5} align="center" justify="space-between" gap={2} minH="20px">
          <Text fontSize={{ base: '12px', md: '13px' }} color={tone === 'dark' ? 'text.onDarkMuted' : 'text.muted'} noOfLines={1}>
            {measure}
          </Text>
          <Price value={product.base_price} size="sm" tone={tone === 'dark' ? 'onDark' : 'gold'} />
        </Flex>
      </Box>
    </Box>
  );
}

export function ProductCardSkeleton() {
  return (
    <Box>
      <Box className="dy-shimmer" borderRadius={{ base: '18px', md: '22px' }} sx={{ aspectRatio: '1 / 1' }} />
      <Box mt={4} h="16px" w="72%" borderRadius="sm" className="dy-shimmer" />
      <Box mt={2.5} h="12px" w="40%" borderRadius="sm" className="dy-shimmer" />
    </Box>
  );
}

export default ProductCard;
