import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Container, Flex, Heading, HStack, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

import Monogram from '../components/brand/Monogram';
import { SearchField, SizeChips, ViewToggle, type MenuView } from '../components/menu/MenuControls';
import { ArchOutline } from '../components/brand/Arch';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';
import ProductRow from '../components/product/ProductRow';
import Eyebrow from '../components/ui/Eyebrow';
import Reveal from '../components/ui/Reveal';
import SplitWords from '../components/ui/SplitWords';
import { useScrollSpy } from '../hooks/useScrollSpy';
import type { MenuCategory, Product, VariantSize } from '../lib/api';
import { categoryName, matchesSearch, searchHaystack, useMenuIndex } from '../lib/menu';
import { navHeight, scrollToElement } from '../lib/motion';
import { SIZE_OPTIONS } from '../lib/productMeasurement';
import { useUiStore } from '../stores/uiStore';

const VIEW_KEY = 'menuViewMode';

function readView(): MenuView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

function parseSize(value: string | null): VariantSize | null {
  const size = value?.split(',')[0]?.trim().toUpperCase();
  return SIZE_OPTIONS.includes(size as VariantSize) ? (size as VariantSize) : null;
}

const sectionId = (category: Pick<MenuCategory, 'slug'>) => `cat-${category.slug}`;

interface Section {
  category: MenuCategory;
  items: Product[];
}

function MenuSection({ section, view, first }: { section: Section; view: MenuView; first: boolean }) {
  const { t } = useTranslation();
  const id = sectionId(section.category);

  return (
    <Box as="section" id={id} aria-labelledby={`${id}-title`} pt={{ base: 12, md: 16 }}>
      <Flex
        align="baseline"
        justify="space-between"
        gap={4}
        pb={4}
        mb={{ base: 7, md: 10 }}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Heading as="h2" id={`${id}-title`} fontFamily="display" fontWeight={700} fontSize={{ base: '32px', md: '44px' }} lineHeight={1.3}>
          {categoryName(section.category)}
        </Heading>
        <Text color="text.muted" fontSize="14px" flexShrink={0}>
          {t('menu.items', { count: section.items.length })}
        </Text>
      </Flex>

      {view === 'grid' ? (
        <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacingX={{ base: 3.5, md: 6, xl: 8 }} spacingY={{ base: 10, md: 14 }}>
          {section.items.map((product, i) => (
            <Reveal key={product.id} delay={(i % 4) * 0.06} y={22} duration={0.8}>
              <ProductCard product={product} eager={first && i < 4} />
            </Reveal>
          ))}
        </SimpleGrid>
      ) : (
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacingX={14}>
          {section.items.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

function MenuMessage({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return (
    <Stack align="center" textAlign="center" spacing={4} py={{ base: 16, md: 24 }}>
      <Box position="relative" w="112px" h="140px" mb={2}>
        <ArchOutline color="rgba(194, 134, 62, 0.55)" duration={1.6} />
        <Box position="absolute" inset="34% 30% 22%" display="grid" placeItems="center">
          <Monogram w="100%" h="100%" />
        </Box>
      </Box>
      <Heading as="h2" fontFamily="display" fontWeight={700} fontSize={{ base: '28px', md: '34px' }}>
        {title}
      </Heading>
      <Text color="text.muted" maxW="380px" lineHeight={1.8}>
        {body}
      </Text>
      <Button variant="noir" size="lg" mt={3} onClick={onAction}>
        {action}
      </Button>
    </Stack>
  );
}

/**
 * The menu as one continuous, sectioned page — the way people browse food
 * menus on their phones. Sticky category tabs follow the scroll and jump on
 * tap; search forgives Arabic spelling variants; sizes filter in place; and
 * the grid can switch to a classic printed-menu list.
 */
export default function MenuPage() {
  const { t } = useTranslation();
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [params, setParams] = useSearchParams();
  const { index, isLoading, isError, refetch } = useMenuIndex();
  const navHidden = useUiStore((s) => s.navHidden);

  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const [size, setSize] = useState<VariantSize | null>(() => parseSize(params.get('size')));
  const [view, setView] = useState<MenuView>(readView);
  const deferredQuery = useDeferredValue(query);

  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsScroller = useRef<HTMLDivElement>(null);
  const [tabsHeight, setTabsHeight] = useState(66);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const haystacks = useMemo(
    () => new Map(index.products.map((p) => [p.id, searchHaystack(p)] as const)),
    [index.products],
  );
  const sizes = useMemo(
    () => SIZE_OPTIONS.filter((s) => index.products.some((p) => p.size_mode === 'SIZE' && p.size === s)),
    [index.products],
  );
  const sections: Section[] = useMemo(
    () =>
      index.categories
        .map((category) => ({
          category,
          items: (index.byCategory.get(category.id) ?? []).filter(
            (p) =>
              (!size || (p.size_mode === 'SIZE' && p.size === size)) &&
              matchesSearch(haystacks.get(p.id) ?? '', deferredQuery),
          ),
        }))
        .filter((section) => section.items.length > 0),
    [index, size, deferredQuery, haystacks],
  );
  const total = sections.reduce((sum, s) => sum + s.items.length, 0);
  const filtering = deferredQuery.trim().length > 0 || size !== null;

  const clearFilters = () => {
    setQuery('');
    setSize(null);
  };

  // Keep ?q= / ?size= in the URL so a filtered menu can be shared.
  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      const q = query.trim();
      if (q) next.set('q', q);
      else next.delete('q');
      if (size) next.set('size', size);
      else next.delete('size');
      next.delete('weight');
      next.delete('category');
      if (next.toString() !== params.toString()) setParams(next, { replace: true });
    }, 350);
    return () => window.clearTimeout(id);
  }, [query, size, params, setParams]);

  const changeView = (next: MenuView) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // storage unavailable — the choice just won't persist
    }
  };

  // ── Sticky tabs & scroll spy ──────────────────────────────────────────────
  useLayoutEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const update = () => setTabsHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const ids = sections.map((s) => sectionId(s.category));
  const spyOffset = (navHidden ? 0 : navHeight()) + tabsHeight + 16;
  const [lock, setLock] = useState<string | null>(null);
  const spied = useScrollSpy(ids, spyOffset, lock !== null);
  const activeId = lock ?? spied;
  const unlockTimer = useRef<number | undefined>(undefined);

  const goTo = (category: MenuCategory, smooth = true) => {
    const el = document.getElementById(sectionId(category));
    if (!el) return;
    const goingDown = el.getBoundingClientRect().top > 0;
    // Scrolling down hides the navbar, so the tabs will sit at the very top.
    const offset = (goingDown ? 0 : navHeight()) + tabsHeight + 8;
    setLock(sectionId(category));
    scrollToElement(el, offset, smooth);
    window.clearTimeout(unlockTimer.current);
    unlockTimer.current = window.setTimeout(() => setLock(null), smooth ? 950 : 50);
  };

  useEffect(() => () => window.clearTimeout(unlockTimer.current), []);

  // Deep links: /menu/:slug lands on that section (and follows later changes).
  const landed = useRef(false);
  useEffect(() => {
    if (isLoading || !categorySlug) return;
    const category = index.categories.find((c) => c.slug === categorySlug);
    if (!category) return;
    const smooth = landed.current;
    landed.current = true;
    const frame = window.requestAnimationFrame(() => goTo(category, smooth));
    return () => window.cancelAnimationFrame(frame);
    // goTo is recreated each render; the slug and data are the real triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, isLoading, index.categories]);

  // Keep the active tab in view inside the horizontally scrolling tab bar.
  useEffect(() => {
    const bar = tabsScroller.current;
    const tab = bar?.querySelector<HTMLElement>(`[data-tab="${activeId}"]`);
    if (!bar || !tab) return;
    const barRect = bar.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const delta = tabRect.left + tabRect.width / 2 - (barRect.left + barRect.width / 2);
    if (Math.abs(delta) > 4) bar.scrollBy({ left: delta, behavior: 'smooth' });
  }, [activeId]);

  return (
    <>
      <Helmet>
        <title>{t('page.menuTitle')}</title>
        <meta name="description" content={t('page.menuDesc')} />
        <meta property="og:title" content={t('page.menuTitle')} />
        <meta property="og:description" content={t('page.menuDesc')} />
      </Helmet>

      {/* ── Header ── */}
      <Box
        as="header"
        data-nav-theme="light"
        position="relative"
        overflow="hidden"
        pt={{ base: 'calc(var(--dy-nav-h) + 36px)', md: 'calc(var(--dy-nav-h) + 64px)' }}
        pb={{ base: 7, md: 9 }}
      >
        <Monogram
          large
          position="absolute"
          w={{ base: '320px', md: '520px' }}
          h={{ base: '320px', md: '520px' }}
          top={{ base: '-30px', md: '-60px' }}
          insetInlineEnd={{ base: '-130px', md: '-60px' }}
          opacity={0.08}
        />
        <Container maxW="1320px" position="relative">
          <Eyebrow>{t('menu.eyebrow')}</Eyebrow>
          <Flex mt={4} direction={{ base: 'column', lg: 'row' }} align={{ lg: 'flex-end' }} justify="space-between" gap={{ base: 6, lg: 10 }}>
            <Box>
              <Heading as="h1" fontFamily="display" fontWeight={700} fontSize={{ base: '54px', md: '80px' }} lineHeight={1.15}>
                <SplitWords text={t('menu.title')} />
              </Heading>
              <Text mt={3} color="text.muted" fontSize={{ base: '16px', md: '18px' }} lineHeight={1.8}>
                {t('menu.subtitle')}
              </Text>
            </Box>
            <SearchField value={query} onChange={setQuery} />
          </Flex>
          <Flex mt={{ base: 5, md: 7 }} align="center" justify="space-between" gap={4}>
            <Box minW={0} flex={1}>
              <SizeChips sizes={sizes} value={size} onChange={setSize} />
            </Box>
            <ViewToggle value={view} onChange={changeView} />
          </Flex>
        </Container>
      </Box>

      {/* ── Sticky category tabs ── */}
      <Box
        ref={tabsRef}
        position="sticky"
        top={navHidden ? '0px' : 'var(--dy-nav-h)'}
        zIndex={100}
        transition="top 550ms var(--dy-ease)"
        bg="rgba(247, 243, 233, 0.88)"
        backdropFilter="saturate(160%) blur(16px)"
        borderBottom="1px solid"
        borderColor="border.subtle"
        data-nav-theme="light"
      >
        <Container maxW="1320px">
          <HStack
            ref={tabsScroller}
            as="nav"
            aria-label={t('menu.sections')}
            spacing={1.5}
            py={3}
            overflowX="auto"
            className="dy-no-scrollbar"
            mx={{ base: -5, md: 0 }}
            px={{ base: 5, md: 0 }}
          >
            {isLoading
              ? [0, 1, 2].map((i) => <Box key={i} h="42px" w="104px" flexShrink={0} borderRadius="full" className="dy-shimmer" />)
              : sections.map(({ category, items }) => {
                  const id = sectionId(category);
                  const active = activeId === id;
                  return (
                    <Box
                      key={category.id}
                      as="button"
                      type="button"
                      data-tab={id}
                      onClick={() => goTo(category)}
                      aria-current={active ? 'true' : undefined}
                      position="relative"
                      flexShrink={0}
                      h="42px"
                      px={5}
                      borderRadius="full"
                      fontSize="15px"
                      fontWeight={active ? 600 : 500}
                      color={active ? 'brand.100' : 'text.primary'}
                      transition="color 300ms"
                      _hover={active ? undefined : { color: 'brand.700' }}
                    >
                      {active && (
                        <motion.span
                          layoutId="menu-tab"
                          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                          style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'var(--dy-noir)' }}
                        />
                      )}
                      <Box as="span" position="relative" display="inline-flex" alignItems="baseline" gap={2}>
                        {categoryName(category)}
                        <Box as="span" fontSize="12px" fontWeight={500} opacity={0.6}>
                          {items.length}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
          </HStack>
        </Container>
      </Box>

      {/* ── Sections ── */}
      <Container maxW="1320px" pb={{ base: 24, md: 32 }} minH="60vh">
        {isLoading ? (
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacingX={{ base: 3.5, md: 6, xl: 8 }} spacingY={{ base: 10, md: 14 }} pt={{ base: 12, md: 16 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </SimpleGrid>
        ) : isError ? (
          <MenuMessage title={t('menu.loadError')} body={t('menu.loadErrorHint')} action={t('menu.retry')} onAction={() => void refetch()} />
        ) : total === 0 ? (
          <MenuMessage title={t('menu.noResults')} body={t('menu.noResultsHint')} action={t('menu.clear')} onAction={clearFilters} />
        ) : (
          <>
            {filtering && (
              <Text pt={8} color="text.muted" fontSize="14px" aria-live="polite">
                {t('menu.results', { count: total })}
              </Text>
            )}
            {sections.map((section, i) => (
              <MenuSection key={section.category.id} section={section} view={view} first={i === 0} />
            ))}
          </>
        )}
      </Container>
    </>
  );
}
