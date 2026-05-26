import { useEffect, useMemo, useState } from 'react';
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
import { localized } from '../lib/format';

const QUERY_OPTS = { staleTime: 60_000, gcTime: 300_000 } as const;

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

  const queryCategory = searchParams.get('category') ?? undefined;
  const activeCategory = pathCategory ?? queryCategory;
  const [search, setSearch] = useState(searchParams.get('q') ?? '');

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
    queryKey: ['productsList', { category: activeCategory, search }],
    queryFn: () => productsList({ category: activeCategory, search: search || undefined }),
    ...QUERY_OPTS,
  });

  const items = useMemo(() => products.data?.results ?? [], [products.data]);

  const selectCategory = (slug?: string) => {
    if (slug) {
      navigate(`/menu/${slug}${search ? `?q=${encodeURIComponent(search)}` : ''}`);
    } else {
      navigate(`/menu${search ? `?q=${encodeURIComponent(search)}` : ''}`);
    }
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

      {/* ── Sticky filter bar ── */}
      <Box
        position="sticky"
        top={{ base: '72px', md: '88px' }}
        zIndex={20}
        bg="rgba(250,248,243,0.94)"
        backdropFilter="saturate(180%) blur(12px)"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Container maxW="1280px" px={{ base: 6, md: 10 }} py={4}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'stretch', md: 'center' }}
            gap={4}
            justify="space-between"
          >
            {/* Category pills + mobile view toggle */}
            <Flex align="center" gap={3} flex={1} minW={0}>
              <HStack
                spacing={2}
                overflowX="auto"
                flex={1}
                minW={0}
                pb={{ base: 1, md: 0 }}
                sx={{ scrollbarWidth: 'thin' }}
              >
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
              </HStack>

              {/* View toggle — mobile only, sits in the filter bar */}
              <HStack
                spacing={1}
                flexShrink={0}
                display={{ base: 'flex', md: 'none' }}
              >
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
            </Flex>

            {/* Search */}
            <InputGroup maxW={{ base: '100%', md: '280px' }} flexShrink={0}>
              <InputLeftElement pointerEvents="none" color="text.muted">
                <SearchGlyph />
              </InputLeftElement>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('product.searchPlaceholder')}
                bg="bg.surface"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="sm"
                h="40px"
                fontSize="14px"
                _focus={{ borderColor: 'accent.gold', boxShadow: 'none' }}
              />
            </InputGroup>
          </Flex>
        </Container>
      </Box>

      {/* ── Product grid (toggle managed above) ── */}
      <Container maxW="1280px" px={{ base: 6, md: 10 }} py={{ base: 10, md: 16 }}>
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
