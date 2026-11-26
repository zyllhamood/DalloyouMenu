/* Build-time module, never hot-reloaded — it exports helpers next to JSX by design. */
/* eslint-disable react-refresh/only-export-components */
/**
 * The build's server entry (see scripts/prerender.mjs). It renders the public
 * pages to static HTML with the same components the browser runs, so search
 * engines, link previews and AI crawlers read every page's content, prices
 * and structured data without running JavaScript. Visitors still get the
 * single-page app: it takes over the moment it loads.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { ChakraProvider } from '@chakra-ui/react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import createEmotionServer from '@emotion/server/create-instance';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MotionConfig } from 'framer-motion';

import { AppShell } from './App';
import { heroCandidates } from './components/home/heroCandidates';
import { backdropSource, primeLooks } from './hooks/useLooks';
import { fetchMenu, type MenuData } from './lib/api';
import { DESIGNS_QUERY_KEY, designImage, fetchDesigns, type DesignsData } from './lib/designs';
import type { BootData } from './lib/boot';
import './lib/i18n';
import { buildMenuIndex, MENU_QUERY_KEY } from './lib/menu';
import { categoryPath, productOriginalImages, productPath, SITE_URL } from './lib/seo';
import { analyseBackdrop, BACKDROP_SAMPLE } from './lib/studio';
import theme from './theme';

export { analyseBackdrop, BACKDROP_SAMPLE, SITE_URL };

/** The menu, exactly as the app loads it. */
export const loadMenu = (): Promise<MenuData> => fetchMenu();

/** The custom designs, exactly as the app loads them. */
export const loadDesigns = (): Promise<DesignsData> => fetchDesigns();

/** The hero photos whose looks the build reads ahead of time. */
export function lookTargets(menu: MenuData): { id: number; src: string | null }[] {
  return heroCandidates(buildMenuIndex(menu)).products.map((p) => ({ id: p.id, src: backdropSource(p) }));
}

export interface PageEntry {
  path: string;
  /** YYYY-MM-DD of the newest change on the page. */
  lastmod: string | null;
  images: string[];
}

const day = (iso: string | undefined | null) => (iso ? iso.slice(0, 10) : null);
const newest = (dates: (string | null)[]) => dates.filter(Boolean).sort().pop() ?? null;

/** Every public page worth a static copy and a sitemap entry. */
export function pages(menu: MenuData, designs?: DesignsData | null): PageEntry[] {
  const index = buildMenuIndex(menu);
  const productDay = new Map(index.products.map((p) => [p.id, day(p.updated_at ?? p.created_at)]));
  const all = newest([...productDay.values()]);

  const entries: PageEntry[] = [
    {
      path: '/',
      lastmod: all,
      images: [
        '/brand/og-image.jpg',
        '/brand/occasions/01-wedding-1200.webp',
        '/brand/occasions/02-birthday-1200.webp',
        '/brand/occasions/03-gifts-1200.webp',
        '/brand/occasions/04-seasons-winter-1200.webp',
        '/brand/occasions/05-corporate-1200.webp',
      ],
    },
    { path: '/menu', lastmod: all, images: [] },
    { path: '/designs', lastmod: null, images: (designs?.designs ?? []).map((d) => designImage(d, 1600)) },
  ];
  index.categories.forEach((category) => {
    const products = index.byCategory.get(category.id) ?? [];
    entries.push({ path: categoryPath(category), lastmod: newest(products.map((p) => productDay.get(p.id) ?? null)), images: [] });
  });
  index.products.forEach((product) => {
    entries.push({ path: productPath(product), lastmod: productDay.get(product.id) ?? null, images: productOriginalImages(product) });
  });
  return entries;
}

/**
 * Chakra reads media queries from `window` while rendering; at build time
 * there is no window, so it gets one that matches nothing (the phone layout —
 * the browser corrects it the moment the app takes over).
 */
const noMatch = { matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} };
const buildEnvironment = {
  getWindow: () => ({ matchMedia: () => noMatch }) as unknown as Window,
  getDocument: () => ({}) as unknown as Document,
};

let boot: BootData | null = null;

/** Hands the build's data to every render that follows. */
export function prime(data: BootData) {
  boot = data;
  primeLooks(data.looks);
}

/** One page: its body HTML (head tags first, as React 19 hoists them) and its critical CSS. */
export function render(url: string): { html: string; styles: string } {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  if (boot) queryClient.setQueryData(MENU_QUERY_KEY, boot.menu);
  if (boot?.designs) queryClient.setQueryData(DESIGNS_QUERY_KEY, boot.designs);

  const cache = createCache({ key: 'css' });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

  const html = renderToString(
    <HelmetProvider>
      <CacheProvider value={cache}>
        <ChakraProvider theme={theme} environment={buildEnvironment}>
          <QueryClientProvider client={queryClient}>
            <StaticRouter location={url}>
              <MotionConfig reducedMotion="user">
                <AppShell />
              </MotionConfig>
            </StaticRouter>
          </QueryClientProvider>
        </ChakraProvider>
      </CacheProvider>
    </HelmetProvider>,
  );

  return { html, styles: constructStyleTagsFromChunks(extractCriticalToChunks(html)) };
}
