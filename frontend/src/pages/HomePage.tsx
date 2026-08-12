import { Box, Container, SimpleGrid, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

import BranchesSection from '../components/BranchesSection';
import BrandStatement from '../components/BrandStatement';
import FeaturedCarousel from '../components/FeaturedCarousel';
import OrderAppsSection from '../components/OrderAppsSection';
import ProductsGrid, { type ViewMode } from '../components/ProductsGrid';
import SectionHeading from '../components/SectionHeading';
import { categoriesList, featuredProducts, productsList } from '../lib/api';

const QUERY_OPTS = { staleTime: 60_000, gcTime: 300_000 } as const;

/** Shared vertical rhythm so every section below the fold reads as one system. */
const SECTION_PY = { base: '52px', md: '72px', lg: '88px' } as const;
/** Gap between a section heading and its content. */
const HEADING_GAP = { base: 9, md: 12 } as const;

/**
 * Homepage information architecture — product photography first, the
 * conversion step last:
 *   1. Featured carousel  — the opening statement
 *   2. Brand statement    — two lines, no more
 *   3. Categories
 *   4. New Arrivals
 *   5. Branches
 *   6. Order via delivery apps
 *   (footer follows)
 */
export default function HomePage() {
  const { t } = useTranslation();
  const { hash } = useLocation();
  const [newArrivalsViewMode, setNewArrivalsViewMode] = useState<ViewMode>('grid');

  const featured = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: featuredProducts,
    ...QUERY_OPTS,
  });

  const categories = useQuery({
    queryKey: ['categoriesList'],
    queryFn: categoriesList,
    ...QUERY_OPTS,
  });

  const newArrivals = useQuery({
    queryKey: ['productsList', { isNew: true, limit: 8 }],
    queryFn: () => productsList({ isNew: true, limit: 8 }),
    ...QUERY_OPTS,
  });

  // Deep-link to #branches (navbar link, or an external link into the page)
  useEffect(() => {
    if (hash !== '#branches') return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById('branches')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hash, categories.isLoading, newArrivals.isLoading]);

  // Keep the category strip balanced: with two or three categories a fixed
  // 4-column grid leaves the row half-empty and stretches each card very wide.
  const categoryCount = categories.data?.length ?? 4;
  const categoryColumns = Math.min(4, Math.max(categoryCount, 2));
  const categoryMaxW =
    categoryCount <= 2 ? '680px' : categoryCount === 3 ? '980px' : undefined;

  return (
    <>
      <Helmet>
        <title>{t('page.homeTitle')}</title>
        <meta name="description" content={t('page.homeDesc')} />
        <meta property="og:title" content={t('page.homeTitle')} />
        <meta property="og:description" content={t('page.homeDesc')} />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* ── 1 · Featured carousel — flush beneath the navbar ── */}
      <FeaturedCarousel products={featured.data ?? []} isLoading={featured.isLoading} />

      {/* ── 2 · Brand statement ── */}
      <BrandStatement />

      {/* ── 3 · Categories ── */}
      <Box as="section" py={SECTION_PY}>
        <Container maxW="1280px" px={{ base: 6, md: 10 }}>
          <SectionHeading title={t('sections.categories')} />
          <SimpleGrid
            columns={{ base: 2, md: categoryColumns }}
            spacing={{ base: 4, md: 6 }}
            mt={HEADING_GAP}
            maxW={categoryMaxW}
            mx="auto"
          >
            {(categories.data ?? []).map((c) => (
              <Box
                key={c.id}
                as={RouterLink}
                to={`/menu/${c.slug}`}
                bg="warm.cream"
                border="1px solid"
                borderColor="border.gold"
                borderRadius="md"
                py={{ base: 10, md: 14 }}
                px={6}
                textAlign="center"
                transition="all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                _hover={{
                  transform: 'translateY(-4px)',
                  borderColor: 'accent.goldDeep',
                  borderWidth: '1.5px',
                  boxShadow: 'soft',
                }}
                role="group"
              >
                <Text
                  fontFamily="heading"
                  fontSize={{ base: '20px', md: '24px' }}
                  fontWeight={500}
                  color="text.primary"
                  _groupHover={{ color: 'accent.goldDeep' }}
                  transition="color 400ms"
                >
                  {c.name_ar || c.name_en}
                </Text>
              </Box>
            ))}
            {categories.isLoading &&
              [0, 1, 2, 3].map((i) => (
                <Box
                  key={`cat-skel-${i}`}
                  bg="warm.cream"
                  borderRadius="md"
                  h={{ base: '120px', md: '160px' }}
                  className="dy-shimmer"
                />
              ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ── 4 · New Arrivals ── */}
      <Box as="section" py={SECTION_PY}>
        <Container maxW="1280px" px={{ base: 6, md: 10 }}>
          <SectionHeading title={t('sections.new')} />
          <Box mt={HEADING_GAP}>
            <ProductsGrid
              products={newArrivals.data?.results ?? []}
              isLoading={newArrivals.isLoading}
              viewMode={newArrivalsViewMode}
              onViewModeChange={setNewArrivalsViewMode}
              showViewToggle
            />
          </Box>
        </Container>
      </Box>

      {/* ── 5 · Branches ── */}
      <BranchesSection />

      {/* ── 6 · Order via delivery apps ── */}
      <OrderAppsSection />
    </>
  );
}
