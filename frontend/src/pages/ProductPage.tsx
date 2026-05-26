import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AspectRatio,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
  Grid,
  GridItem,
  Heading,
  Portal,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { X } from 'lucide-react';

import { productDetail } from '../lib/api';
import type { ProductSize, SizeKey } from '../lib/api';
import { formatPrice, isArabic, localized } from '../lib/format';

const QUERY_OPTS = { staleTime: 60_000, gcTime: 300_000 } as const;
// Numeric rank used for sorting — higher = bigger size
const SIZE_RANK: Record<SizeKey, number> = { small: 1, medium: 2, large: 3 };
const FALLBACK_DISPLAY = 'https://placehold.co/800x800/FFFFFF/C9A961?text=Dalloyou&font=cormorant';

function WhatsAppGlyph() {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="18px" h="18px" aria-hidden>
      <path
        fill="currentColor"
        d="M19.11 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91a9.86 9.86 0 0 0 1.32 4.94L2 22l5.29-1.39a9.91 9.91 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91a9.85 9.85 0 0 0-2.85-6.99zm-3.55 9.24c-.25-.13-1.46-.72-1.69-.8-.23-.08-.39-.13-.56.13-.17.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.13.17 1.73 2.65 4.2 3.71.59.25 1.05.4 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.23-.18-.48-.31z"
      />
    </Box>
  );
}

export default function ProductPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const ar = isArabic(lang);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['productDetail', id],
    queryFn: () => productDetail(id!),
    enabled: Boolean(id),
    ...QUERY_OPTS,
  });

  // Pills are displayed small → large (ascending rank)
  const availableSizes = useMemo<ProductSize[]>(() => {
    if (!product?.sizes) return [];
    return product.sizes
      .filter((s) => s.is_available !== false)
      .sort((a, b) => SIZE_RANK[a.size] - SIZE_RANK[b.size]);
  }, [product]);

  // Pre-select the LARGEST available size; fall back to largest overall if all unavailable
  const defaultSize = useMemo<ProductSize | null>(() => {
    if (availableSizes.length) return availableSizes[availableSizes.length - 1];
    if (!product?.sizes?.length) return null;
    return [...product.sizes].sort((a, b) => SIZE_RANK[b.size] - SIZE_RANK[a.size])[0] ?? null;
  }, [availableSizes, product]);

  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);

  // Sync selection whenever the product changes (e.g. navigating between products)
  useEffect(() => {
    setSelectedSizeId(defaultSize?.id ?? null);
  }, [defaultSize]);

  const selectedSize = useMemo(
    () => availableSizes.find((s) => s.id === selectedSizeId) ?? defaultSize,
    [availableSizes, selectedSizeId, defaultSize],
  );

  // ── Zoom modal ─────────────────────────────────────────────────────────────
  const { isOpen: isZoomOpen, onOpen: openZoom, onClose: closeZoom } = useDisclosure();

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isZoomOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isZoomOpen]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') closeZoom(); },
    [closeZoom],
  );
  useEffect(() => {
    if (!isZoomOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isZoomOpen, handleKeyDown]);

  // Use the variant-specific image when the selected size has one; fall back to
  // the product's display_image, then to the placeholder.
  // ⚠ Must be declared BEFORE the conditional returns so hook call count never
  //   varies between renders (Rules of Hooks). `product` may be undefined here.
  const activeImage = useMemo(() => {
    if (selectedSize?.image) return selectedSize.image;
    return product?.display_image ?? FALLBACK_DISPLAY;
  }, [selectedSize, product]);

  // ── Loading / error states ─────────────────────────────────────────────────
  if (isLoading) return <ProductPageSkeleton />;

  if (isError || !product) {
    return (
      <Container maxW="1400px" py={{ base: 16, md: 24 }} textAlign="center">
        <Heading fontSize="32px" mb={4}>{t('common.error')}</Heading>
        <Button onClick={() => navigate(0)} variant="goldOutline">
          {t('common.retry')}
        </Button>
      </Container>
    );
  }

  const productName = localized(product.name_en, product.name_ar, lang);
  const description =
    localized(product.description_en, product.description_ar, lang) || t('page.productDescFallback');
  const categoryName = localized(product.category.name_en, product.category.name_ar, lang);
  const price = selectedSize?.price ?? product.base_price;

  const openWhatsApp = () => {
    const number = import.meta.env.VITE_WHATSAPP_NUMBER ?? '966532370777';
    const sizeName = selectedSize ? t(`sizes.${selectedSize.size}`) : null;
    const message = ar
      ? `السلام عليكم،\nأرغب بطلب: ${productName}${sizeName ? ` (${sizeName})` : ''}\nالسعر: ${price} ر.س`
      : `Hello,\nI'd like to order: ${productName}${sizeName ? ` (${sizeName})` : ''}\nPrice: SAR ${price}`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <>
      <Helmet>
        <title>{`${productName} — ${t('brand.name')}`}</title>
        <meta name="description" content={description.slice(0, 160)} />
        <meta property="og:title" content={productName} />
        <meta property="og:description" content={description.slice(0, 200)} />
        {product.display_image && <meta property="og:image" content={activeImage} />}
      </Helmet>

      <Container maxW="1400px" px={{ base: 6, md: 10 }} py={{ base: 10, md: 16 }}>
        <Breadcrumb
          spacing={2}
          mb={{ base: 8, md: 12 }}
          fontSize="12px"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="text.muted"
          separator={ar ? '‹' : '›'}
        >
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/" _hover={{ color: 'accent.goldDeep' }}>
              {t('breadcrumb.home')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/menu" _hover={{ color: 'accent.goldDeep' }}>
              {t('breadcrumb.menu')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink
              as={RouterLink}
              to={`/menu/${product.category.slug}`}
              _hover={{ color: 'accent.goldDeep' }}
            >
              {categoryName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <Text as="span" color="text.primary">{productName}</Text>
          </BreadcrumbItem>
        </Breadcrumb>

        <Grid templateColumns={{ base: '1fr', md: '9fr 11fr' }} gap={{ base: 10, md: 16 }}>
          {/* ── Image column ── */}
          <GridItem>
            {/*
             * Cream background (bg.canvas = #FAF8F3) lets transparent PNGs
             * float seamlessly on the page surface — no visible rectangle.
             * The gold border is omitted; the cream-on-cream blend does the
             * visual separation work. Zoom modal uses its own dark overlay.
             */}
            <Box
              position="relative"
              bg="bg.canvas"
              overflow="hidden"
              onClick={openZoom}
              cursor="zoom-in"
              role="button"
              aria-label={productName}
              sx={{
                '& img': { transition: 'transform 200ms ease-out' },
                '&:hover img': { transform: 'scale(1.02)' },
              }}
            >
              {/* Padding-trick 1:1 aspect ratio — avoids Chakra AspectRatio single-child
                  conflicts with AnimatePresence rendering multiple elements during transition */}
              <Box position="relative" sx={{ paddingTop: '100%' }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={activeImage}
                    src={activeImage}
                    alt={productName}
                    loading="eager"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      display: 'block',
                    }}
                  />
                </AnimatePresence>
              </Box>
            </Box>
          </GridItem>

          {/* ── Content column ── */}
          <GridItem ps={{ md: 8 }}>
            <Stack spacing={6}>
              <Text
                fontSize="11px"
                letterSpacing="0.32em"
                textTransform="uppercase"
                color="accent.goldDeep"
              >
                {categoryName}
              </Text>
              <Heading
                as="h1"
                fontFamily="heading"
                fontSize={{ base: '36px', md: '48px' }}
                fontWeight={500}
                lineHeight={1.1}
              >
                {productName}
              </Heading>
              <Box h="1px" w="48px" bg="accent.gold" opacity={0.6} />
              <Text
                fontSize={{ base: '15px', md: '16px' }}
                lineHeight={1.85}
                color="text.muted"
              >
                {description}
              </Text>

              {/* Price — body font, matches ProductCard "From SAR XX" style */}
              <Box>
                <Text fontSize={{ base: '16px', md: '18px' }} letterSpacing="0.01em">
                  <Text as="span" color="text.muted" fontWeight={400}>
                    {t('product.from')}&nbsp;
                  </Text>
                  <Text as="span" color="text.primary" fontWeight={500}>
                    {formatPrice(price, lang)}
                  </Text>
                </Text>
              </Box>

              {availableSizes.length > 0 && (
                <Stack spacing={3}>
                  <Text
                    fontSize="11px"
                    letterSpacing="0.24em"
                    textTransform="uppercase"
                    color="text.muted"
                  >
                    {t('product.selectSize')}
                  </Text>
                  <Box display="flex" gap={3} flexWrap="wrap">
                    {availableSizes.map((s) => {
                      const active = selectedSize?.id === s.id;
                      return (
                        <Button
                          key={s.id}
                          onClick={() => setSelectedSizeId(s.id)}
                          h="44px"
                          px={6}
                          borderRadius="full"
                          fontSize="12px"
                          letterSpacing="0.16em"
                          textTransform="uppercase"
                          bg={active ? 'warm.black' : 'transparent'}
                          color={active ? 'accent.gold' : 'text.primary'}
                          border="1px solid"
                          borderColor={active ? 'warm.black' : 'border.subtle'}
                          _hover={
                            active
                              ? { bg: 'warm.black' }
                              : { borderColor: 'accent.gold', color: 'accent.goldDeep' }
                          }
                          transition="all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                          aria-pressed={active}
                        >
                          {t(`sizes.${s.size}`)}
                        </Button>
                      );
                    })}
                  </Box>
                </Stack>
              )}

              <Stack spacing={2}>
                <Button
                  onClick={openWhatsApp}
                  w="100%"
                  h="56px"
                  bg="warm.black"
                  color="accent.gold"
                  border="1px solid"
                  borderColor="accent.gold"
                  fontSize="13px"
                  letterSpacing="0.18em"
                  textTransform="uppercase"
                  _hover={{
                    bg: 'accent.gold',
                    color: 'warm.black',
                    transform: 'translateY(-2px)',
                    boxShadow: 'goldGlow',
                  }}
                  isDisabled={!product.is_available}
                  leftIcon={<WhatsAppGlyph />}
                >
                  {product.is_available ? t('product.orderViaWhatsapp') : t('product.unavailable')}
                </Button>
                <Text fontSize="11px" color="text.muted" letterSpacing="0.04em">
                  {t('product.whatsappNotice')}
                </Text>
                <Text
                  fontSize="13px"
                  color="text.muted"
                  letterSpacing="0.06em"
                  textAlign="center"
                  mt={3}
                  fontStyle="italic"
                >
                  {t('product.comingSoon')}
                </Text>
              </Stack>
            </Stack>
          </GridItem>
        </Grid>
      </Container>

      {/* ── Zoom modal ─────────────────────────────────────────────────────── */}
      {isZoomOpen && (
        <Portal>
          {/* Backdrop — click anywhere outside the image to close */}
          <Box
            position="fixed"
            inset={0}
            zIndex={2000}
            bg="rgba(26,26,26,0.85)"
            sx={{ backdropFilter: 'blur(8px)' }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            onClick={closeZoom}
          >
            {/* Image wrapper — stopPropagation so clicks here don't close */}
            <Box
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
            >
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={4}
              >
                <TransformComponent
                  wrapperStyle={{
                    maxWidth: '90vw',
                    maxHeight: '88vh',
                  }}
                  contentStyle={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={activeImage}
                    alt={productName}
                    style={{
                      maxWidth: '90vw',
                      maxHeight: '88vh',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </TransformComponent>
              </TransformWrapper>
            </Box>

            {/* Close button — always top-right */}
            <Box
              position="fixed"
              top="20px"
              right="20px"
              as="button"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); closeZoom(); }}
              zIndex={2001}
              w="40px"
              h="40px"
              bg="rgba(26,26,26,0.6)"
              border="1px solid rgba(255,255,255,0.18)"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              transition="all 200ms ease-out"
              _hover={{ bg: 'rgba(26,26,26,0.9)' }}
              aria-label="Close"
              sx={{ backdropFilter: 'blur(4px)' }}
            >
              <X size={18} />
            </Box>
          </Box>
        </Portal>
      )}
    </>
  );
}

function ProductPageSkeleton() {
  return (
    <Container maxW="1400px" px={{ base: 6, md: 10 }} py={{ base: 10, md: 16 }}>
      <Skeleton h="14px" w="280px" mb={10} startColor="warm.cream" endColor="border.subtle" />
      <Grid templateColumns={{ base: '1fr', md: '9fr 11fr' }} gap={{ base: 10, md: 16 }}>
        <AspectRatio ratio={1}>
          <Box bg="warm.cream" className="dy-shimmer" borderRadius="lg" />
        </AspectRatio>
        <Stack spacing={5}>
          <Skeleton h="12px" w="40%" startColor="warm.cream" endColor="border.subtle" />
          <Skeleton h="48px" w="80%" startColor="warm.cream" endColor="border.subtle" />
          <Skeleton h="14px" w="100%" startColor="warm.cream" endColor="border.subtle" />
          <Skeleton h="14px" w="92%" startColor="warm.cream" endColor="border.subtle" />
          <Skeleton h="14px" w="86%" startColor="warm.cream" endColor="border.subtle" />
          <Skeleton h="56px" w="100%" mt={6} startColor="warm.cream" endColor="border.subtle" />
        </Stack>
      </Grid>
    </Container>
  );
}
