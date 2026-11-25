import { BRANCHES, SOCIALS, WHATSAPP_NUMBER, WHATSAPP_ORDER_URL } from '../config/links';
import type { MenuCategory, Product } from './api';
import { productImageSource } from './images';
import { categoryName, displayName, productDescription, type MenuIndex } from './menu';
import { effectivePrice } from './price';
import { SITE_URL } from './site';

/*
 * Everything search engines and link previews read about the storefront:
 * canonical URLs and schema.org structured data (JSON-LD). Pages render it
 * through <Seo>; the build renders the same pages to static HTML, so crawlers
 * that don't run JavaScript (Bing, WhatsApp, X, AI search) get it too.
 */

export { SITE_URL };

export const absoluteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`);

export const DEFAULT_SHARE_IMAGE = { url: '/brand/og-image.jpg', width: 1200, height: 630 };

/** The names people search the house by: its Arabic name, the Latin spelling, and the original French house's. */
export const BRAND_NAMES = { primary: 'داليو', alternate: ['Dalloyou', 'Dalloyau'] };

const BUSINESS_ID = `${SITE_URL}/#bakery`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const MENU_ID = `${SITE_URL}/menu#menu`;

export const productPath = (product: Pick<Product, 'id'>) => `/product/${product.id}`;
export const categoryPath = (category: { slug?: string }) => (category.slug ? `/menu/${category.slug}` : '/menu');

/** A share-sized rendition (1200px WebP, ~100 KB) — originals are 1–3 MB, too heavy for link previews. */
export function productShareImage(product: Product): string | null {
  const source = productImageSource(product, 'display', { widths: [1200], width: 1200 });
  return source ? source.src : null;
}

/** The full-size originals, for search engines' image indexes. */
export function productOriginalImages(product: Product): string[] {
  return [product.display_image, product.styled_image].filter((src, i, all): src is string => Boolean(src) && all.indexOf(src) === i);
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

// ─── JSON-LD ──────────────────────────────────────────────────────────────

/** The house and its two branches — the core of local search. */
export function businessJsonLd(t: Translate) {
  return {
    '@type': 'Bakery',
    '@id': BUSINESS_ID,
    name: BRAND_NAMES.primary,
    alternateName: BRAND_NAMES.alternate,
    description: t('seo.homeDesc'),
    url: `${SITE_URL}/`,
    logo: { '@type': 'ImageObject', url: absoluteUrl('/brand/icon-512.png'), width: 512, height: 512 },
    image: [absoluteUrl(DEFAULT_SHARE_IMAGE.url), absoluteUrl('/brand/occasions/01-wedding-1200.webp')],
    telephone: `+${WHATSAPP_NUMBER}`,
    servesCuisine: ['حلويات', 'كيك', 'شوكولاتة', 'موالح', 'Desserts', 'Cakes', 'Chocolate'],
    hasMenu: MENU_ID,
    sameAs: SOCIALS.map((s) => s.url),
    areaServed: BRANCHES.map((b) => ({ '@type': 'City', name: t(`branches.${b.key}.city`) })),
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'المنطقة الشرقية',
      addressCountry: 'SA',
    },
    potentialAction: {
      '@type': 'OrderAction',
      target: WHATSAPP_ORDER_URL,
    },
    department: BRANCHES.map((branch) => ({
      '@type': 'Bakery',
      name: `${BRAND_NAMES.primary} — ${t(`branches.${branch.key}.city`)}`,
      telephone: `+${WHATSAPP_NUMBER}`,
      hasMap: branch.mapsUrl,
      address: {
        '@type': 'PostalAddress',
        streetAddress: t(`branches.${branch.key}.area`),
        addressLocality: t(`branches.${branch.key}.city`),
        addressRegion: 'المنطقة الشرقية',
        addressCountry: 'SA',
      },
      parentOrganization: { '@id': BUSINESS_ID },
    })),
  };
}

export function websiteJsonLd() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: BRAND_NAMES.primary,
    alternateName: BRAND_NAMES.alternate,
    inLanguage: 'ar',
    publisher: { '@id': BUSINESS_ID },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function offer(product: Product) {
  return {
    '@type': 'Offer',
    url: absoluteUrl(productPath(product)),
    price: effectivePrice(product).toFixed(2),
    priceCurrency: 'SAR',
    availability: product.is_available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': BUSINESS_ID },
  };
}

/** The whole menu, section by section, with every item's price. */
export function menuJsonLd(index: MenuIndex, t: Translate) {
  return {
    '@type': 'Menu',
    '@id': MENU_ID,
    name: t('seo.menuName'),
    url: absoluteUrl('/menu'),
    inLanguage: 'ar',
    hasMenuSection: index.categories.map((category) => ({
      '@type': 'MenuSection',
      name: categoryName(category),
      url: absoluteUrl(categoryPath(category)),
      hasMenuItem: (index.byCategory.get(category.id) ?? []).map((product) => ({
        '@type': 'MenuItem',
        name: displayName(product),
        url: absoluteUrl(productPath(product)),
        ...(productShareImage(product) ? { image: productShareImage(product) } : {}),
        offers: offer(product),
      })),
    })),
  };
}

/** One category's pieces as an ordered list. */
export function categoryJsonLd(category: MenuCategory, products: Product[]) {
  return {
    '@type': 'ItemList',
    name: categoryName(category),
    url: absoluteUrl(categoryPath(category)),
    numberOfItems: products.length,
    itemListElement: products.map((product, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(productPath(product)),
      name: displayName(product),
    })),
  };
}

export function productJsonLd(product: Product, description: string) {
  return {
    '@type': 'Product',
    '@id': `${absoluteUrl(productPath(product))}#product`,
    name: displayName(product),
    description,
    image: productOriginalImages(product),
    sku: String(product.id),
    category: categoryName(product.category),
    brand: { '@type': 'Brand', name: BRAND_NAMES.primary },
    offers: offer(product),
  };
}

/** A product's description for search results: its own text, or one written from its facts. */
export function productSeoDescription(product: Product, t: Translate, measure: string, price: string): string {
  const facts = t('seo.productFacts', {
    name: displayName(product),
    category: categoryName(product.category),
    measure: measure ? `، ${measure}` : '',
    price,
  });
  const own = productDescription(product);
  // The facts (name, size, price) lead; the piece's own words, or the way to order, follow.
  return clampDescription(`${facts} ${own || t('seo.productCta')}`);
}

/** Search results show ~160 characters: cut longer text at a word, never mid-word. */
export function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[،,.:;—-]+$/, '')}…`;
}
