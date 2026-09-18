import type { Ref } from 'react';
import { Box, Button, Divider, Flex, Grid, Heading, HStack, Text, useToast } from '@chakra-ui/react';
import { Share2 } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { Product } from '../../lib/api';
import { categoryName, displayName, measurementText, productDescription } from '../../lib/menu';
import { productUrl, productWhatsAppUrl } from '../../lib/order';
import OrderChannels from './OrderChannels';
import Price from './Price';
import ProductGallery from './ProductGallery';

interface ProductDetailsProps {
  product: Product;
  /** `sheet` = quick view; `page` = the standalone product page. */
  layout: 'sheet' | 'page';
  /** Attached to the ordering block (the product page watches it for its sticky bar). */
  orderRef?: Ref<HTMLDivElement>;
}

/** Name, price, story and ordering for one product — shared by the quick view and the product page. */
export function ProductDetails({ product, layout, orderRef }: ProductDetailsProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const page = layout === 'page';

  const name = displayName(product);
  const measure = measurementText(product, t);
  const description = productDescription(product);
  const url = productUrl(product);
  const whatsappUrl = productWhatsAppUrl(product, measure);

  const share = async () => {
    const title = `${name} — ${t('brand.name')}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
      } catch {
        // dismissed by the user
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: t('product.linkCopied'),
        status: 'success',
        duration: 2200,
        position: 'bottom',
        variant: 'subtle',
      });
    } catch {
      window.prompt(title, url);
    }
  };

  return (
    <Grid
      templateColumns={{ base: '1fr', md: page ? '1.05fr 0.95fr' : '1fr 1fr' }}
      gap={{ base: 7, md: page ? 16 : 10 }}
      alignItems="start"
    >
      <Box position={{ md: page ? 'sticky' : 'static' }} top={{ md: 'calc(var(--dy-nav-h) + 24px)' }}>
        <ProductGallery
          key={product.id}
          product={product}
          eager
          sizes={page ? '(min-width: 62em) 560px, 92vw' : '(min-width: 48em) 440px, 92vw'}
        />
      </Box>

      <Box pt={{ md: page ? 6 : 2 }}>
        <HStack spacing={3} mb={{ base: 3, md: 4 }}>
          <Text
            as={RouterLink}
            to={`/menu/${product.category.slug ?? ''}`}
            fontSize="14px"
            fontWeight={500}
            color="brand.700"
            _hover={{ color: 'brand.800' }}
          >
            {categoryName(product.category)}
          </Text>
          {product.is_new && (
            <Box as="span" px={2.5} py="2px" borderRadius="full" bg="noir.800" color="brand.100" fontSize="11.5px" fontWeight={500}>
              {t('product.new')}
            </Box>
          )}
        </HStack>

        <Heading
          as={page ? 'h1' : 'h2'}
          fontFamily="display"
          fontWeight={700}
          fontSize={page ? { base: '34px', md: '46px', xl: '52px' } : { base: '30px', md: '36px' }}
          lineHeight={1.3}
          color="text.primary"
        >
          {name}
        </Heading>

        <Flex mt={{ base: 4, md: 5 }} align="center" gap={4} wrap="wrap">
          <Price value={product.base_price} size="xl" />
          {measure && (
            <Box as="span" px={3.5} py={1.5} borderRadius="full" border="1px solid" borderColor="rgba(143,91,30,0.28)" color="brand.800" fontSize="13.5px" fontWeight={500}>
              {measure}
            </Box>
          )}
        </Flex>

        {description && (
          <Text mt={{ base: 5, md: 6 }} fontSize={{ base: '15.5px', md: '16.5px' }} lineHeight={1.95} color="text.muted" whiteSpace="pre-line" maxW="520px">
            {description}
          </Text>
        )}

        <Divider my={{ base: 6, md: 8 }} borderColor="border.subtle" opacity={1} />

        <Box ref={orderRef}>
          <OrderChannels whatsappUrl={whatsappUrl} note={t('product.deliveryAppsNote')} />
        </Box>

        <Flex mt={5} justify="center">
          <Button
            onClick={share}
            variant="unstyled"
            display="inline-flex"
            alignItems="center"
            gap={2}
            h="40px"
            px={4}
            fontSize="14px"
            fontWeight={500}
            color="text.muted"
            borderRadius="full"
            _hover={{ color: 'brand.700', bg: 'rgba(194,134,62,0.08)' }}
          >
            <Share2 size={16} />
            {t('product.share')}
          </Button>
        </Flex>
      </Box>
    </Grid>
  );
}

export default ProductDetails;
