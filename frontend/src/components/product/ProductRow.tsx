import { Box, Flex, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { Product } from '../../lib/api';
import { displayName, measurementText } from '../../lib/menu';
import { useModalLinkState } from '../../lib/routing';
import PhotoFrame from './PhotoFrame';
import Price from './Price';
import ProductImage from './ProductImage';

/**
 * The "printed menu" view: a small photo, the name, a dotted leader and the
 * price — the way a patisserie card reads, and the fastest way to scan prices.
 */
export function ProductRow({ product }: { product: Product }) {
  const { t } = useTranslation();
  const linkState = useModalLinkState();
  const name = displayName(product);
  const measure = measurementText(product, t);
  const meta = [measure, product.is_new ? t('product.new') : ''].filter(Boolean).join(' · ');

  return (
    <Box
      as={RouterLink}
      to={`/product/${product.id}`}
      state={linkState}
      aria-label={t('product.view', { name })}
      display="flex"
      alignItems="center"
      gap={{ base: 3.5, md: 4 }}
      py={{ base: 3.5, md: 4 }}
      borderBottom="1px solid"
      borderColor="border.subtle"
      role="group"
      transition="background-color 300ms"
      sx={{
        '@media (hover: hover)': {
          '&:hover .dy-row-img': { transform: 'scale(1.1)' },
          '&:hover .dy-row-name': { color: 'brand.700' },
        },
      }}
    >
      <PhotoFrame w={{ base: '64px', md: '72px' }} flexShrink={0} radius="14px">
        <ProductImage
          product={product}
          sizes="72px"
          widths={[160, 320]}
          baseWidth={160}
          className="dy-row-img"
          style={{ position: 'absolute', inset: 0 }}
        />
      </PhotoFrame>

      <Box flex={1} minW={0}>
        <Flex align="baseline" gap={2}>
          <Text
            className="dy-row-name"
            fontFamily="display"
            fontWeight={700}
            fontSize={{ base: '17px', md: '19px' }}
            lineHeight={1.45}
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            pb="0.3em"
            mb="-0.3em"
            minW={0}
            transition="color 300ms"
          >
            {name}
          </Text>
          <Box
            flex={1}
            minW="18px"
            borderBottom="2px dotted"
            borderColor="rgba(143, 91, 30, 0.28)"
            transform="translateY(-5px)"
            aria-hidden
          />
          <Price value={product.base_price} size="sm" />
        </Flex>
        {meta && (
          <Text mt={0.5} fontSize="12.5px" color="text.muted" noOfLines={1}>
            {meta}
          </Text>
        )}
      </Box>
    </Box>
  );
}

export default ProductRow;
