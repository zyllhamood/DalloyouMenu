import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  Button,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
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
import { localized } from '../lib/format';

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

function SearchGlyph() {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="16px" h="16px" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Box>
  );
}

export default function MenuPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const { categorySlug: pathCategory } = useParams<{ categorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterDrawer = useDisclosure();

  const queryCategory = searchParams.get('category') ?? undefined;
  const activeCategory = pathCategory ?? queryCategory;
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [sizes, setSizes] = useState<Set<Size>>(() => parseSizes(searchParams.get('size')));
  const sizeParam = useMemo(() => Array.from(sizes).join(',') || undefined, [sizes]);

  useEffect(() => {
    setSizes(parseSizes(searchParams.get('size')));
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
    queryKey: ['productsList', { category: activeCategory, search, size: sizeParam }],
    queryFn: () => productsList({
      category: activeCategory,
      search: search || undefined,
      size: sizeParam,
    }),
    ...QUERY_OPTS,
  });

  const items = useMemo(() => products.data?.results ?? [], [products.data]);

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
    filterDrawer.onClose();
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

  const clearFilters = () => {
    setSearch('');
    setSizes(new Set());
    filterDrawer.onClose();
    navigate('/menu');
  };

  const hasFilters = Boolean(activeCategory || search || sizes.size);

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

      {/* ── Sticky filter bar ── */}
      <Box
        position="sticky"
        top={{ base: '72px', md: '88px' }}
        zIndex={20}
        bg="rgba(250,248,243,0.94)"
        backdropFilter="saturate(180%) blur(12px)"
        borderBottom="1px solid"
        borderColor="border.subtle"
        overflowX="hidden"
      >
        <Container maxW="1280px" px={{ base: 6, md: 10 }} py={4}>
          <Stack spacing={3}>
            <Flex display={{ base: 'flex', md: 'none' }} gap={3} align="center" minW={0}>
              <Button
                leftIcon={<SlidersHorizontal size={16} />}
                onClick={filterDrawer.onOpen}
                variant="goldOutline"
                h="40px"
                flexShrink={0}
                px={3}
              >
                {t('filters.open')}
              </Button>
              <SearchInput search={search} setSearch={setSearch} placeholder={t('product.searchPlaceholder')} />
            </Flex>

            <Stack spacing={3} display={{ base: 'none', md: 'flex' }}>
              <FilterRow>
                <FilterPill
                  label={t('product.allCategories')}
                  active={!activeCategory}
                  onClick={() => selectCategory(undefined)}
                />
                {(categories.data ?? []).map((c) => (
                  <FilterPill
                    key={c.id}
                    label={localized(c.name_en, c.name_ar, lang)}
                    active={activeCategory === c.slug}
                    onClick={() => selectCategory(c.slug)}
                  />
                ))}
              </FilterRow>

              <FilterRow label={t('filters.sizes')}>
                {SIZE_FILTERS.map((size) => (
                  <FilterPill
                    key={size}
                    label={t(SIZE_LABEL_KEYS[size])}
                    active={sizes.has(size)}
                    onClick={() => toggleSize(size)}
                  />
                ))}
              </FilterRow>

              <Flex align="center" justify="space-between" gap={4}>
                <SearchInput search={search} setSearch={setSearch} placeholder={t('product.searchPlaceholder')} />
                {hasFilters && (
                  <Button size="sm" variant="ghostGold" onClick={clearFilters}>
                    {t('filters.clear')}
                  </Button>
                )}
              </Flex>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Drawer isOpen={filterDrawer.isOpen} placement="bottom" onClose={filterDrawer.onClose}>
        <DrawerOverlay />
        <DrawerContent bg="bg.surface" borderTopRadius="lg" maxW="100vw" overflowX="hidden">
          <DrawerCloseButton />
          <DrawerHeader fontFamily="heading" fontWeight={500}>{t('filters.open')}</DrawerHeader>
          <DrawerBody pb={8} overflowX="hidden">
            <Stack spacing={6}>
              <FilterRow>
                <FilterPill
                  label={t('product.allCategories')}
                  active={!activeCategory}
                  onClick={() => selectCategory(undefined)}
                />
                {(categories.data ?? []).map((c) => (
                  <FilterPill
                    key={c.id}
                    label={localized(c.name_en, c.name_ar, lang)}
                    active={activeCategory === c.slug}
                    onClick={() => selectCategory(c.slug)}
                  />
                ))}
              </FilterRow>

              <FilterRow label={t('filters.sizes')}>
                {SIZE_FILTERS.map((size) => (
                  <FilterPill
                    key={size}
                    label={t(SIZE_LABEL_KEYS[size])}
                    active={sizes.has(size)}
                    onClick={() => toggleSize(size)}
                  />
                ))}
              </FilterRow>

              <HStack spacing={1}>
                <ViewToggleButton
                  icon={<LayoutGrid size={16} />}
                  active={viewMode === 'grid'}
                  label="Grid view"
                  onClick={() => handleViewMode('grid')}
                />
                <ViewToggleButton
                  icon={<List size={16} />}
                  active={viewMode === 'list'}
                  label="List view"
                  onClick={() => handleViewMode('list')}
                />
              </HStack>

              {hasFilters && (
                <Button variant="ghostGold" onClick={clearFilters}>
                  {t('filters.clear')}
                </Button>
              )}
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

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
    <Stack spacing={2} w="100%" maxW="100%" minW={0}>
      {label && (
        <Text
          fontSize="10px"
          letterSpacing="0.22em"
          textTransform="uppercase"
          color="accent.goldDeep"
          fontWeight={600}
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
