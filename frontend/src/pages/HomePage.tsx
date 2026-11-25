import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Seo from '../components/Seo';
import SmoothScroll from '../components/site/SmoothScroll';
import HomeCollections from '../components/home/HomeCollections';
import HomeGallery from '../components/home/HomeGallery';
import HomeHero from '../components/home/HomeHero';
import HomeOccasions from '../components/home/HomeOccasions';
import HomeStory from '../components/home/HomeStory';
import HomeVisit from '../components/home/HomeVisit';
import { useMenu } from '../lib/menu';
import { navHeight, scrollToElement } from '../lib/motion';
import { businessJsonLd, websiteJsonLd } from '../lib/seo';
import { BRANCHES_ID } from '../lib/useBranchesLink';

/**
 * The home page (sections live in src/components/home/):
 *
 *   1. Studio       colour  the featured pieces, each in its own studio carried across the screen
 *   2. Collections  ivory   the categories as vitrine niches that open on hover
 *   3. Occasions    tint    a stack of occasion cards, each a line to WhatsApp
 *   4. Story        noir    the statement lit as it's read; the scroll redraws the monogram
 *   5. Gallery      ivory   photo ribbons that answer the scroll
 *   6. Visit        tint    the monogram as a seal; the branches as arched doors
 *   (footer: the storefront's own)
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

  return (
    <SmoothScroll>
      <Seo title={t('seo.homeTitle')} description={t('seo.homeDesc')} path="/" jsonLd={[businessJsonLd(t), websiteJsonLd()]} />

      <HomeHero />
      <HomeCollections />
      <HomeOccasions />
      <HomeStory />
      <HomeGallery />
      <HomeVisit />
    </SmoothScroll>
  );
}
