import { useEffect, useRef, useState } from 'react';
import { Box, Button, Container, Grid, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

import { WhatsAppGlyph } from '../components/WhatsAppIcon';
import Price from '../components/product/Price';
import { ProductCardSkeleton } from '../components/product/ProductCard';
import ProductDetails from '../components/product/ProductDetails';
import ProductRail from '../components/product/ProductRail';
import SectionHeader from '../components/ui/SectionHeader';
import { productDetail, type Product } from '../lib/api';
import { categoryName, displayName, measurementText, productDescription, relatedProducts, useMenuIndex } from '../lib/menu';
import { productWhatsAppUrl } from '../lib/order';
import { effectivePrice, originalPrice } from '../lib/price';

function StickyOrderBar({ product, visible }: { product: Product; visible: boolean }) {
  const { t } = useTranslation();
  const url = productWhatsAppUrl(product, measurementText(product, t));
  return (
    <Box
      position="fixed"
      insetInline="12px"
      bottom="calc(12px + env(safe-area-inset-bottom))"
      zIndex={1150}
      display={{ base: 'flex', md: 'none' }}
      alignItems="center"
      gap={3}
      p="7px"
      ps={5}
      borderRadius="full"
      bg="rgba(14, 11, 8, 0.9)"
      backdropFilter="blur(20px) saturate(160%)"
      border="1px solid rgba(227, 183, 117, 0.16)"
      boxShadow="0 22px 44px -18px rgba(14, 11, 8, 0.75)"
      transform={visible ? 'translateY(0)' : 'translateY(160%)'}
      transition="transform 600ms var(--dy-ease)"
      aria-hidden={!visible}
    >
      <Box flex={1} minW={0}>
        <Text
          color="text.onDark"
          fontFamily="display"
          fontWeight={700}
          fontSize="16px"
          lineHeight={1.3}
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
          pb="0.3em"
          mb="-0.3em"
        >
          {displayName(product)}
        </Text>
        <Price value={effectivePrice(product)} original={originalPrice(product)} size="sm" tone="onDark" />
      </Box>
      <Button
        as="a"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        variant="gold"
        h="48px"
        px={5}
        leftIcon={<WhatsAppGlyph size={18} />}
        tabIndex={visible ? 0 : -1}
      >
        {t('nav.orderShort')}
      </Button>
    </Box>
  );
}

function Breadcrumbs({ product }: { product: Product }) {
  const { t, i18n } = useTranslation();
  const Separator = i18n.dir() === 'rtl' ? ChevronLeft : ChevronRight;
  const crumb = { fontSize: '13.5px', color: 'text.muted', _hover: { color: 'brand.700' } } as const;
  return (
    <HStack as="nav" aria-label="breadcrumb" spacing={2} mb={{ base: 6, md: 10 }} color="text.muted" flexWrap="wrap">
      <Text as={RouterLink} to="/" {...crumb}>
        {t('nav.home')}
      </Text>
      <Separator size={14} />
      <Text as={RouterLink} to="/menu" {...crumb}>
        {t('nav.menu')}
      </Text>
      <Separator size={14} />
      <Text as={RouterLink} to={`/menu/${product.category.slug ?? ''}`} {...crumb}>
        {categoryName(product.category)}
      </Text>
    </HStack>
  );
}

/** A product opened directly (a shared link, a search result, a refresh). */
export default function ProductPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { index, isLoading } = useMenuIndex();
  const fromMenu = index.byId.get(Number(id));

  // Items outside the public menu (e.g. an inactive category) still resolve.
  const detail = useQuery({
    queryKey: ['productDetail', id],
    queryFn: () => productDetail(id!),
    enabled: Boolean(id) && !isLoading && !fromMenu,
    retry: false,
    staleTime: 60_000,
  });
  const product = fromMenu ?? detail.data;

  const orderRef = useRef<HTMLDivElement>(null);
  const [orderInView, setOrderInView] = useState(true);

  useEffect(() => {
    const el = orderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOrderInView(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [product?.id]);

  if (isLoading || (!fromMenu && detail.isLoading)) {
    return (
      <Container maxW="1320px" pt="calc(var(--dy-nav-h) + 48px)" pb={24}>
        <Grid templateColumns={{ base: '1fr', md: '1.05fr 0.95fr' }} gap={{ base: 8, md: 16 }}>
          <ProductCardSkeleton />
          <Stack spacing={5} pt={{ md: 10 }}>
            <Box h="14px" w="25%" className="dy-shimmer" borderRadius="sm" />
            <Box h="48px" w="80%" className="dy-shimmer" borderRadius="sm" />
            <Box h="34px" w="35%" className="dy-shimmer" borderRadius="sm" />
            <Box h="60px" w="100%" mt={8} className="dy-shimmer" borderRadius="full" />
          </Stack>
        </Grid>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxW="560px" pt="calc(var(--dy-nav-h) + 96px)" pb={32}>
        <Helmet>
          <title>{`${t('product.notFound')} — ${t('brand.name')}`}</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <Stack align="center" textAlign="center" spacing={4}>
          <Heading as="h1" fontFamily="display" fontWeight={700} fontSize={{ base: '32px', md: '40px' }}>
            {t('product.notFound')}
          </Heading>
          <Text color="text.muted" lineHeight={1.8}>
            {t('product.notFoundHint')}
          </Text>
          <Button as={RouterLink} to="/menu" variant="noir" size="lg" mt={3}>
            {t('notFound.browseMenu')}
          </Button>
        </Stack>
      </Container>
    );
  }

  const name = displayName(product);
  const description = productDescription(product) || t('page.productDescFallback');
  const related = fromMenu ? relatedProducts(index, product, 10) : [];

  return (
    <>
      <Helmet>
        <title>{`${name} — ${t('brand.name')}`}</title>
        <meta name="description" content={description.slice(0, 160)} />
        <meta property="og:title" content={`${name} — ${t('brand.name')}`} />
        <meta property="og:description" content={description.slice(0, 200)} />
        {product.display_image && <meta property="og:image" content={product.display_image || product.styled_image || undefined} />}
      </Helmet>

      <Box data-nav-theme="light" pt={{ base: 'calc(var(--dy-nav-h) + 20px)', md: 'calc(var(--dy-nav-h) + 40px)' }} pb={{ base: 16, md: 24 }}>
        <Container maxW="1320px">
          <Breadcrumbs product={product} />
          <ProductDetails product={product} layout="page" orderRef={orderRef} />
        </Container>
      </Box>

      {related.length > 0 && (
        <Box as="section" data-nav-theme="light" bg="ivory.200" py={{ base: 16, md: 24 }} pb={{ base: 28, md: 24 }}>
          <Container maxW="1320px">
            <SectionHeader eyebrow={categoryName(product.category)} title={t('product.related')} mb={{ base: 8, md: 12 }} pe={{ md: related.length > 3 ? '120px' : 0 }} />
            <ProductRail products={related} label={t('product.related')} />
          </Container>
        </Box>
      )}

      <StickyOrderBar product={product} visible={!orderInView} />
    </>
  );
}
