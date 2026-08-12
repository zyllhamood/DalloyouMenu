import { useCallback, useEffect, useMemo } from 'react';
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
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { X } from 'lucide-react';

import AppLogo, { type AppKey } from '../components/AppLogo';
import { productDetail } from '../lib/api';
import { formatPrice } from '../lib/format';
import { getMeasurementLabel } from '../lib/productMeasurement';
import {
  createWhatsAppUrl,
  HUNGERSTATION_URL,
  KEETA_URL,
  THECHEFZ_URL,
} from '../config/links';

const QUERY_OPTS = { staleTime: 60_000, gcTime: 300_000 } as const;

// ── Order button ────────────────────────────────────────────────────────────
// One shape for all four channels: the app's own logo + its name. WhatsApp is
// the primary (solid) action because it is the only one that can carry this
// specific product; the delivery apps are gold-outlined siblings.

interface OrderButtonProps {
  label: string;
  app: AppKey;
  /** External store link. Omit and pass onClick instead (WhatsApp). */
  href?: string;
  onClick?: () => void;
  isDisabled?: boolean;
  primary?: boolean;
}

function OrderButton({ label, app, href, onClick, isDisabled, primary }: OrderButtonProps) {
  const iconSize = useBreakpointValue({ base: 26, md: 30 }, { fallback: 'base' }) ?? 26;
  const linkProps = href
    ? { as: 'a' as const, href, target: '_blank', rel: 'noopener noreferrer' }
    : { onClick };

  return (
    <Button
      {...linkProps}
      w="100%"
      minH={{ base: '58px', md: '62px' }}
      h="auto"
      py={2}
      justifyContent="flex-start"
      px={{ base: 3, md: 4 }}
      whiteSpace="normal"
      textAlign="start"
      borderRadius="lg"
      borderWidth="1px"
      borderStyle="solid"
      borderColor={primary ? 'accent.gold' : 'border.gold'}
      bg={primary ? 'warm.black' : 'bg.surface'}
      color={primary ? 'accent.gold' : 'text.primary'}
      fontSize={{ base: '14px', md: '14px' }}
      fontWeight={600}
      letterSpacing="0"
      textTransform="none"
      lineHeight={1.3}
      isDisabled={isDisabled}
      leftIcon={<AppLogo app={app} size={iconSize} />}
      iconSpacing={{ base: 2, md: 3 }}
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: primary ? 'goldGlow' : 'soft',
        borderColor: 'accent.gold',
        bg: primary ? 'warm.black' : 'bg.surface',
        textDecoration: 'none',
      }}
      _disabled={{ opacity: 0.45, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' }}
    >
      {label}
    </Button>
  );
}

function ZoomGlyph() {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="16px" h="16px" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M20 20l-3.5-3.5M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Box>
  );
}

export default function ProductPage() {
  const { t } = useTranslation();
  const lang = 'ar';
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['productDetail', id],
    queryFn: () => productDetail(id!),
    enabled: Boolean(id),
    ...QUERY_OPTS,
  });

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

  // ⚠ Must be declared BEFORE the conditional returns so hook call count never
  //   varies between renders (Rules of Hooks). `product` may be undefined here.
  const activeImage = useMemo(
    () => product?.display_image ?? null,
    [product],
  );

  // ── Loading / error states ─────────────────────────────────────────────────
  if (isLoading) return <ProductPageSkeleton />;

  if (isError || !product) {
    return (
      <Container maxW="560px" py={{ base: '72px', md: '120px' }} px={{ base: 6, md: 10 }}>
        <Stack spacing={6} align="center" textAlign="center">
          <Box h="1px" w="56px" bg="accent.gold" opacity={0.6} />
          <Heading
            as="h1"
            fontFamily="heading"
            fontWeight={500}
            fontSize={{ base: '28px', md: '36px' }}
          >
            {t('common.error')}
          </Heading>
          <Text fontSize={{ base: '15px', md: '16px' }} color="text.muted" lineHeight={1.7} maxW="380px">
            {t('common.errorBody')}
          </Text>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} pt={2} w={{ base: '100%', sm: 'auto' }}>
            <Button onClick={() => navigate(0)} variant="blackGold" size="lg">
              {t('common.retry')}
            </Button>
            <Button as={RouterLink} to="/menu" variant="goldOutline" size="lg">
              {t('notFound.browseMenu')}
            </Button>
          </Stack>
        </Stack>
      </Container>
    );
  }

  const productName = product.name_ar || product.name_en;
  const description = product.description_ar || product.description_en || t('page.productDescFallback');
  const categoryName = product.category.name_ar || product.category.name_en;
  const price = product.base_price;
  const measurementLabel = getMeasurementLabel(product, t);

  const openWhatsApp = () => {
    const measurementText = measurementLabel ? ` (${measurementLabel})` : '';
    const message = `السلام عليكم،\nأرغب بطلب: ${productName}${measurementText}\nالسعر: ${price} ر.س`;
    window.open(createWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <Helmet>
        <title>{`${productName} — ${t('brand.name')}`}</title>
        <meta name="description" content={description.slice(0, 160)} />
        <meta property="og:title" content={productName} />
        <meta property="og:description" content={description.slice(0, 200)} />
        {activeImage && <meta property="og:image" content={activeImage} />}
      </Helmet>

      <Container maxW="1400px" px={{ base: 6, md: 10 }} py={{ base: 10, md: 16 }}>
        <Breadcrumb
          spacing={2}
          mb={{ base: 8, md: 12 }}
          fontSize="12px"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="text.muted"
          separator="‹"
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
              title={t('product.zoomHint')}
              sx={{
                '& img': { transition: 'transform 200ms ease-out' },
                '&:hover img': { transform: 'scale(1.02)' },
                '& .dy-zoom-badge': {
                  opacity: { base: 0.85, md: 0 },
                  transition: 'opacity 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                },
                '&:hover .dy-zoom-badge': { opacity: 1 },
              }}
            >
              {/* Padding-trick 1:1 aspect ratio — avoids Chakra AspectRatio single-child
                  conflicts with AnimatePresence rendering multiple elements during transition */}
              <Box position="relative" sx={{ paddingTop: '100%' }}>
                {activeImage ? (
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
                ) : (
                  <Box position="absolute" inset={0} bg="border.subtle" opacity={0.45} />
                )}
              </Box>

              {/* Subtle zoom affordance — fades in on hover (always visible on touch) */}
              {activeImage && (
                <Box
                  className="dy-zoom-badge"
                  position="absolute"
                  bottom={{ base: 3, md: 4 }}
                  insetInlineEnd={{ base: 3, md: 4 }}
                  zIndex={2}
                  w="36px"
                  h="36px"
                  borderRadius="full"
                  bg="rgba(250,248,243,0.9)"
                  border="1px solid"
                  borderColor="border.gold"
                  color="accent.goldDeep"
                  display="grid"
                  placeItems="center"
                  pointerEvents="none"
                  sx={{ backdropFilter: 'blur(4px)' }}
                  aria-hidden
                >
                  <ZoomGlyph />
                </Box>
              )}
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

              {/* Price — body font, matches ProductCard treatment */}
              <Box>
                <Text
                  fontSize={{ base: '16px', md: '18px' }}
                  letterSpacing="0.01em"
                  color="text.primary"
                  fontWeight={500}
                >
                  {formatPrice(price, lang)}
                </Text>
              </Box>

              {measurementLabel && (
                <Stack spacing={3}>
                  <Text
                    fontSize="11px"
                    letterSpacing="0.24em"
                    textTransform="uppercase"
                    color="text.muted"
                  >
                    {t('product.measurement')}
                  </Text>
                  <Box
                    display="inline-flex"
                    alignItems="center"
                    gap={3}
                    alignSelf="flex-start"
                    px={5}
                    py={3}
                    borderRadius="full"
                    bg="warm.black"
                    color="accent.gold"
                    border="1px solid"
                    borderColor="accent.gold"
                  >
                    <Text fontSize="13px" fontWeight={600}>
                      {measurementLabel}
                    </Text>
                  </Box>
                </Stack>
              )}

              {/* ── Ordering channels ─────────────────────────────────────── */}
              <Stack spacing={2} w="100%" maxW={{ base: '440px', sm: 'none' }} mx={{ base: 'auto', sm: 0 }}>
                <Text
                  fontSize="11px"
                  letterSpacing="0.26em"
                  textTransform="uppercase"
                  color="accent.goldDeep"
                  fontWeight={600}
                  mb={1}
                >
                  {t('product.orderNow')}
                </Text>

                {!product.is_available && (
                  <Text fontSize="14px" fontWeight={600} color="text.primary" mb={2}>
                    {t('product.unavailable')}
                  </Text>
                )}

                {/* 2×2 at every width so all four channels are visible without
                    scrolling. Labels wrap rather than overflow on narrow phones. */}
                <SimpleGrid columns={2} spacing={{ base: 2.5, sm: 3 }}>
                  <OrderButton
                    label={t('hero.order.whatsapp')}
                    app="whatsapp"
                    onClick={openWhatsApp}
                    isDisabled={!product.is_available}
                    primary
                  />
                  <OrderButton
                    label={t('hero.order.hungerstation')}
                    app="hungerstation"
                    href={HUNGERSTATION_URL}
                    isDisabled={!product.is_available}
                  />
                  <OrderButton
                    label={t('hero.order.thechefz')}
                    app="thechefz"
                    href={THECHEFZ_URL}
                    isDisabled={!product.is_available}
                  />
                  <OrderButton
                    label={t('hero.order.keeta')}
                    app="keeta"
                    href={KEETA_URL}
                    isDisabled={!product.is_available}
                  />
                </SimpleGrid>

                {/* Only WhatsApp can carry this specific product; the delivery
                    apps land on the store, so say so rather than surprise. */}
                <Text fontSize="12px" color="text.muted" lineHeight={1.6} mt={2}>
                  {t('product.deliveryAppsNote')}
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
      {isZoomOpen && activeImage && (
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

            {/* Close button — pinned to the trailing-top corner (RTL-aware) */}
            <Box
              position="fixed"
              top="20px"
              insetInlineEnd="20px"
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
              aria-label={t('product.zoomClose')}
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
