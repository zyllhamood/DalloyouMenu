import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Grid, Heading, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Sheet from '../site/Sheet';
import ProductCard, { ProductCardSkeleton } from './ProductCard';
import ProductDetails from './ProductDetails';
import { displayName, relatedProducts, useMenuIndex } from '../../lib/menu';

/**
 * /product/:id opened from inside the site: the product rises over the page
 * the visitor was browsing, which stays exactly where they left it. Closing
 * (button, Escape, backdrop, drag) steps back in history.
 */
export default function ProductQuickView() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);
  const { index, isLoading } = useMenuIndex();

  const product = index.byId.get(Number(id));
  const related = useMemo(() => (product ? relatedProducts(index, product, 8) : []), [index, product]);

  // Switching to a related item keeps the sheet open; start it from the top.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [id]);

  return (
    <Sheet
      isOpen={open}
      onClose={() => setOpen(false)}
      onCloseComplete={() => navigate(-1)}
      label={product ? displayName(product) : t('brand.name')}
      maxW="1000px"
      bodyRef={bodyRef}
    >
      <Box px={{ base: 5, md: 10 }} pt={{ base: 10, md: 12 }} pb={{ base: 10, md: 12 }}>
        {product ? (
          <>
            <ProductDetails product={product} layout="sheet" />
            {related.length > 0 && (
              <Box mt={{ base: 12, md: 14 }} pt={{ base: 8, md: 10 }} borderTop="1px solid" borderColor="border.subtle">
                <Heading as="h3" fontFamily="display" fontWeight={700} fontSize={{ base: '24px', md: '28px' }} mb={{ base: 5, md: 6 }}>
                  {t('product.related')}
                </Heading>
                <Grid
                  className="dy-no-scrollbar"
                  gridAutoFlow="column"
                  gridAutoColumns={{ base: '42%', sm: '30%', md: '200px' }}
                  gap={{ base: 3.5, md: 5 }}
                  overflowX="auto"
                  mx={{ base: -5, md: -10 }}
                  px={{ base: 5, md: 10 }}
                  pb={2}
                  sx={{ scrollSnapType: 'x mandatory', scrollPaddingInline: { base: '20px', md: '40px' } }}
                >
                  {related.map((item) => (
                    <Box key={item.id} sx={{ scrollSnapAlign: 'start' }}>
                      <ProductCard product={item} sizes="(min-width: 48em) 200px, 42vw" replace />
                    </Box>
                  ))}
                </Grid>
              </Box>
            )}
          </>
        ) : isLoading ? (
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={10}>
            <ProductCardSkeleton />
            <Stack spacing={4} pt={4}>
              <Box h="14px" w="30%" className="dy-shimmer" borderRadius="sm" />
              <Box h="36px" w="80%" className="dy-shimmer" borderRadius="sm" />
              <Box h="28px" w="40%" className="dy-shimmer" borderRadius="sm" />
              <Box h="58px" w="100%" mt={6} className="dy-shimmer" borderRadius="full" />
            </Stack>
          </Grid>
        ) : (
          <Stack align="center" textAlign="center" spacing={4} py={10}>
            <Heading as="h2" fontFamily="display" fontWeight={700} fontSize="28px">
              {t('product.notFound')}
            </Heading>
            <Text color="text.muted" maxW="360px" lineHeight={1.8}>
              {t('product.notFoundHint')}
            </Text>
            <Button as={RouterLink} to="/menu" variant="noir" size="lg" mt={2}>
              {t('notFound.browseMenu')}
            </Button>
          </Stack>
        )}
      </Box>
    </Sheet>
  );
}
