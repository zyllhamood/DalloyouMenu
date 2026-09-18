import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

import CategoryShowcase from '../components/home/CategoryShowcase';
import Hero from '../components/home/Hero';
import Marquee from '../components/home/Marquee';
import NewArrivals from '../components/home/NewArrivals';
import StorySection from '../components/home/StorySection';
import VisitSection from '../components/home/VisitSection';
import WorldGallery from '../components/home/WorldGallery';
import { BRANCHES, SOCIALS, WHATSAPP_NUMBER } from '../config/links';
import { useMenu } from '../lib/menu';
import { navHeight, scrollToElement } from '../lib/motion';
import { BRANCHES_ID } from '../lib/useBranchesLink';

/**
 * Homepage rhythm — noir → ivory → noir → ivory → noir:
 *   1. Hero         the lit arch and the house line
 *   2. Marquee      categories and promises, in motion
 *   3. Categories   one niche per category
 *   4. New          a shelf of the latest pieces
 *   5. Story        the statement, lit as you read
 *   6. World        lifestyle photography
 *   7. Visit        the two branches
 *   (footer: the invitation to order)
 */
export default function HomePage() {
  const { t } = useTranslation();
  const { hash } = useLocation();
  const { isLoading } = useMenu();

  // Arriving at /#branches: the sections above grow once the menu loads, so
  // settle on the target again when they do.
  useEffect(() => {
    if (hash !== `#${BRANCHES_ID}` || isLoading) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(BRANCHES_ID);
      if (target) scrollToElement(target, navHeight() + 8, false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash, isLoading]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: t('brand.name'),
    alternateName: 'Dalloyou',
    url: `${origin}/`,
    logo: `${origin}/brand/icon-512.png`,
    image: `${origin}/brand/og-image.jpg`,
    telephone: `+${WHATSAPP_NUMBER}`,
    servesCuisine: ['Desserts', 'Cakes', 'Chocolate'],
    hasMenu: `${origin}/menu`,
    sameAs: SOCIALS.map((s) => s.url),
    department: BRANCHES.map((branch) => ({
      '@type': 'Bakery',
      name: `${t('brand.name')} — ${t(`branches.${branch.key}.city`)}`,
      hasMap: branch.mapsUrl,
      address: {
        '@type': 'PostalAddress',
        streetAddress: t(`branches.${branch.key}.area`),
        addressLocality: t(`branches.${branch.key}.city`),
        addressRegion: 'المنطقة الشرقية',
        addressCountry: 'SA',
      },
    })),
  };

  return (
    <>
      <Helmet>
        <title>{t('page.homeTitle')}</title>
        <meta name="description" content={t('page.homeDesc')} />
        <meta property="og:title" content={t('page.homeTitle')} />
        <meta property="og:description" content={t('page.homeDesc')} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <Hero />
      <Marquee />
      <CategoryShowcase />
      <NewArrivals />
      <StorySection />
      <WorldGallery />
      <VisitSection />
    </>
  );
}
