import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
} from '@chakra-ui/react';
import { LayoutGrid, List } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

import {
  ProductsGrid,
  ViewToggleButton,
  readStoredViewMode,
  VIEW_MODE_KEY,
  type ViewMode,
} from '../components/ProductsGrid';
import { categoriesList, productsList } from '../lib/api';

const QUERY_OPTS = { staleTime: 60_000, gcTime: 300_000 } as const;
type Size = 'SMALL' | 'MEDIUM' | 'LARGE';
const SIZE_FILTERS: Size[] = ['SMALL', 'MEDIUM', 'LARGE'];
const SIZE_LABEL_KEYS: Record<Size, string> = {
  SMALL: 'sizes.small',
  MEDIUM: 'sizes.medium',
  LARGE: 'sizes.large',
};

function parseSizes(value: string | null): Set<Size> {
  const selected = new Set<Size>();
  value?.split(',').forEach((raw) => {
    const size = raw.trim().toUpperCase();
    if (SIZE_FILTERS.includes(size as Size)) selected.add(size as Size);
  });
  return selected;
}

function parseWeights(value: string | null): Set<string> {
  const selected = new Set<string>();
  value?.split(',').forEach((raw) => {
    const weight = raw.trim();
    if (weight) selected.add(weight);
  });
  return selected;
}

function SearchGlyph() {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="16px" h="16px" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Box>
  );
}

export default function MenuPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { categorySlug: pathCategory } = useParams<{ categorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryCategory = searchParams.get('category') ?? undefined;
  const activeCategory = pathCategory ?? queryCategory;
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [sizes, setSizes] = useState<Set<Size>>(() => parseSizes(searchParams.get('size')));
  const [weights, setWeights] = useState<Set<string>>(() => parseWeights(searchParams.get('weight')));
  const sizeParam = useMemo(() => Array.from(sizes).join(',') || undefined, [sizes]);
  const weightParam = useMemo(() => Array.from(weights).join(',') || undefined, [weights]);

  useEffect(() => {
    setSizes(parseSizes(searchParams.get('size')));
    setWeights(parseWeights(searchParams.get('weight')));
  }, [searchParams]);

  // View mode (controlled here so the toggle lives in the filter bar)
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);
  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem(VIEW_MODE_KEY, mode); } catch { /* ignore */ }
  };

  // Debounce search → URL
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (search) next.set('q', search);
          else next.delete('q');
          return next;
        },
        { replace: true },
      );
    }, 300);
    return () => window.clearTimeout(id);
  }, [search, setSearchParams]);

  const categories = useQuery({
    queryKey: ['categoriesList'],
    queryFn: categoriesList,
    ...QUERY_OPTS,
  });

  const products = useQuery({
    queryKey: ['productsList', { category: activeCategory, search, size: sizeParam, weight: weightParam }],
    queryFn: () => productsList({
      category: activeCategory,
      search: search || undefined,
      size: sizeParam,
      weight: weightParam,
    }),
    ...QUERY_OPTS,
  });

  const sizeOptionsProducts = useQuery({
    queryKey: ['productsList.sizeOptions', { category: activeCategory, search }],
    queryFn: () => productsList({
      category: activeCategory,
      search: search || undefined,
      allPages: true,
    }),
    ...QUERY_OPTS,
  });

  const items = useMemo(() => products.data?.results ?? [], [products.data]);
  const availableSizes = useMemo(() => {
    const found = new Set<Size>();
    (sizeOptionsProducts.data?.results ?? []).forEach((product) => {
      if (product.size_mode === 'WEIGHT') return;
      if (product.size && SIZE_FILTERS.includes(product.size)) found.add(product.size);
    });
    return SIZE_FILTERS.filter((size) => found.has(size));
  }, [sizeOptionsProducts.data]);
  const availableWeights = useMemo(() => {
    const found = new Set<string>();
    (sizeOptionsProducts.data?.results ?? []).forEach((product) => {
      if (product.size_mode !== 'WEIGHT') return;
      const weight = product.weight_label?.trim();
      if (weight) found.add(weight);
    });
    return Array.from(found);
  }, [sizeOptionsProducts.data]);
  const availableSizeKey = availableSizes.join(',');
  const availableWeightKey = availableWeights.join(',');

  useEffect(() => {
    if (sizeOptionsProducts.isLoading) return;
    const allowedSizes = new Set(availableSizes);
    const allowedWeights = new Set(availableWeights);
    const nextSizes = new Set(Array.from(sizes).filter((size) => allowedSizes.has(size)));
    const nextWeights = new Set(Array.from(weights).filter((weight) => allowedWeights.has(weight)));
    if (nextSizes.size === sizes.size && nextWeights.size === weights.size) return;
    setSizes(nextSizes);
    setWeights(nextWeights);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const sizeValue = Array.from(nextSizes).join(',');
        const weightValue = Array.from(nextWeights).join(',');
        if (sizeValue) next.set('size', sizeValue);
        else next.delete('size');
        if (weightValue) next.set('weight', weightValue);
        else next.delete('weight');
        return next;
      },
      { replace: true },
    );
  }, [
    availableSizeKey,
    availableWeightKey,
    availableSizes,
    availableWeights,
    sizeOptionsProducts.isLoading,
    setSearchParams,
    sizes,
    weights,
  ]);

  const selectCategory = (slug?: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    if (search) next.set('q', search);
    else next.delete('q');
    const suffix = next.toString() ? `?${next.toString()}` : '';
    if (slug) {
      navigate(`/menu/${slug}${suffix}`);
    } else {
      navigate(`/menu${suffix}`);
    }
  };

  const toggleSize = (size: Size) => {
    const nextSizes = new Set(sizes);
    if (nextSizes.has(size)) nextSizes.delete(size);
    else nextSizes.add(size);
    setSizes(nextSizes);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const value = Array.from(nextSizes).join(',');
        if (value) next.set('size', value);
        else next.delete('size');
        return next;
      },
      { replace: true },
    );
  };

  const toggleWeight = (weight: string) => {
    const nextWeights = new Set(weights);
    if (nextWeights.has(weight)) nextWeights.delete(weight);
    else nextWeights.add(weight);
    setWeights(nextWeights);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const value = Array.from(nextWeights).join(',');
        if (value) next.set('weight', value);
        else next.delete('weight');
        return next;
      },
      { replace: true },
    );
  };

  return (
    <>
      <Helmet>
        <title>{t('page.menuTitle')}</title>
        <meta name="description" content={t('page.menuDesc')} />
      </Helmet>

      <Container maxW="1280px" px={{ base: 6, md: 10 }} pt={{ base: 12, md: 20 }} pb={6}>
        <Box textAlign="center">
          <Heading
            as="h1"
            fontFamily="heading"
            fontWeight={500}
            fontSize={{ base: '44px', md: '64px' }}
            lineHeight={1.05}
          >
            {t('nav.menu')}
          </Heading>
          <Flex mt={4} justify="center" align="center" aria-hidden>
            <Box h="1px" w="60px" bg="border.gold" />
            <Box mx={3} color="accent.gold" fontSize="14px" letterSpacing="0.2em">✦</Box>
            <Box h="1px" w="60px" bg="border.gold" />
          </Flex>
        </Box>
      </Container>

      {/* ── Filter bar ── */}
      <Box
        position={{ base: 'static', md: 'sticky' }}
        top={{ base: '72px', md: '88px' }}
        zIndex={20}
        bg="rgba(250,248,243,0.94)"
        backdropFilter="saturate(180%) blur(12px)"
        borderBottom="1px solid"
        borderColor="border.subtle"
        overflowX="hidden"
      >
        <Container maxW="1280px" px={{ base: 6, md: 10 }} py={4}>
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            align={{ base: 'stretch', lg: 'center' }}
            gap={{ base: 3, lg: 4 }}
            minW={0}
          >
            <Box flex={{ base: 'none', lg: '1 1 0' }} minW={0}>
              <FilterRow>
                <FilterPill
                  label={t('product.allCategories')}
                  active={!activeCategory}
                  onClick={() => selectCategory(undefined)}
                />
                {(categories.data ?? []).map((c) => (
                  <FilterPill
                    key={c.id}
                    label={c.name_ar || c.name_en}
                    active={activeCategory === c.slug}
                    onClick={() => selectCategory(c.slug)}
                  />
                ))}
              </FilterRow>
            </Box>

            {(availableSizes.length > 0 || availableWeights.length > 0) && (
              <Box flex={{ base: 'none', lg: '0 0 auto' }} minW={0}>
                <FilterRow label={t('filters.measurements')}>
                  {availableSizes.map((size) => (
                    <FilterPill
                      key={size}
                      label={t(SIZE_LABEL_KEYS[size])}
                      active={sizes.has(size)}
                      onClick={() => toggleSize(size)}
                    />
                  ))}
                  {availableWeights.map((weight) => (
                    <FilterPill
                      key={weight}
                      label={weight}
                      active={weights.has(weight)}
                      onClick={() => toggleWeight(weight)}
                    />
                  ))}
                </FilterRow>
              </Box>
            )}

            <Flex
              align="center"
              justify={{ base: 'space-between', lg: 'flex-end' }}
              gap={3}
              minW={0}
              flex={{ base: 'none', lg: '0 0 auto' }}
            >
              <SearchInput search={search} setSearch={setSearch} placeholder={t('product.searchPlaceholder')} />
              <HStack spacing={1} display={{ base: 'flex', md: 'none' }} flexShrink={0}>
                <ViewToggleButton
                  icon={<LayoutGrid size={16} />}
                  active={viewMode === 'grid'}
                  label={t('view.grid')}
                  onClick={() => handleViewMode('grid')}
                />
                <ViewToggleButton
                  icon={<List size={16} />}
                  active={viewMode === 'list'}
                  label={t('view.list')}
                  onClick={() => handleViewMode('list')}
                />
              </HStack>
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* ── Product grid (toggle managed above) ── */}
      <Container maxW="1280px" px={{ base: 5, md: 10 }} py={{ base: 10, md: 16 }} overflowX="hidden">
        <ProductsGrid
          products={items}
          isLoading={products.isLoading}
          viewMode={viewMode}
          onViewModeChange={handleViewMode}
          showViewToggle={false}
        />
      </Container>
    </>
  );
}

function SearchInput({
  search,
  setSearch,
  placeholder,
}: {
  search: string;
  setSearch: (value: string) => void;
  placeholder: string;
}) {
  return (
    <InputGroup maxW={{ base: '100%', md: '280px' }} minW={0} flex={{ base: 1, md: '0 0 auto' }}>
      <InputLeftElement pointerEvents="none" color="text.muted">
        <SearchGlyph />
      </InputLeftElement>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        bg="bg.surface"
        border="1px solid"
        borderColor="border.subtle"
        borderRadius="sm"
        h="40px"
        fontSize="14px"
        _focus={{ borderColor: 'accent.gold', boxShadow: 'none' }}
      />
    </InputGroup>
  );
}

function FilterRow({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <Stack
      direction={{ base: 'column', lg: label ? 'row' : 'column' }}
      spacing={{ base: 2, lg: label ? 3 : 2 }}
      align={{ base: 'stretch', lg: label ? 'center' : 'stretch' }}
      w="100%"
      maxW="100%"
      minW={0}
    >
      {label && (
        <Text
          fontSize="10px"
          letterSpacing="0.22em"
          textTransform="uppercase"
          color="accent.goldDeep"
          fontWeight={600}
          flexShrink={0}
        >
          {label}
        </Text>
      )}
      <HStack
        spacing={2}
        overflowX="auto"
        w="100%"
        maxW="100%"
        minW={0}
        pb={1}
        sx={{ scrollbarWidth: 'thin' }}
      >
        {children}
      </HStack>
    </Stack>
  );
}

// ── FilterPill ────────────────────────────────────────────────────────────────
interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <Button
      onClick={onClick}
      size="sm"
      h="36px"
      px={5}
      borderRadius="full"
      flexShrink={0}
      fontSize="13px"
      letterSpacing="0"
      textTransform="none"
      bg={active ? 'warm.black' : 'transparent'}
      color={active ? 'accent.gold' : 'text.primary'}
      border="1px solid"
      borderColor={active ? 'warm.black' : 'border.subtle'}
      _hover={
        active
          ? { bg: 'warm.black' }
          : { borderColor: 'accent.gold', color: 'accent.goldDeep', bg: 'transparent' }
      }
      _active={{ transform: 'translateY(0)' }}
      transition="all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      aria-pressed={active}
    >
      {label}
    </Button>
  );
}
