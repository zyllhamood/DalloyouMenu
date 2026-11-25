import { absoluteUrl, DEFAULT_SHARE_IMAGE } from '../lib/seo';

interface SeoProps {
  title: string;
  description: string;
  /** The page's own path — becomes its canonical URL. */
  path: string;
  image?: { url: string; width?: number; height?: number; alt?: string } | null;
  type?: 'website' | 'product';
  noindex?: boolean;
  /** schema.org objects, published together as one @graph. */
  jsonLd?: object[];
  /** For product pages: the price shown in link previews. */
  price?: { amount: string; currency: string };
}

/**
 * A page's head: title, description, canonical URL, the Open Graph / X cards
 * link previews read, and its structured data. React 19 hoists the <title>,
 * <meta> and <link> tags into the document head — in the browser and in the
 * prerendered HTML alike — and the JSON-LD stays in the page body, where
 * search engines read it just the same.
 */
export function Seo({ title, description, path, image, type = 'website', noindex = false, jsonLd, price }: SeoProps) {
  const url = absoluteUrl(path);
  const share = image === null ? null : (image ?? { ...DEFAULT_SHARE_IMAGE, alt: title });
  const json = jsonLd?.length
    ? JSON.stringify({ '@context': 'https://schema.org', '@graph': jsonLd }).replace(/</g, '\\u003c')
    : null;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'} />

      <meta property="og:site_name" content="داليو · Dalloyou" />
      <meta property="og:locale" content="ar_SA" />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {share && <meta property="og:image" content={absoluteUrl(share.url)} />}
      {share?.width && <meta property="og:image:width" content={String(share.width)} />}
      {share?.height && <meta property="og:image:height" content={String(share.height)} />}
      {share?.alt && <meta property="og:image:alt" content={share.alt} />}
      {price && <meta property="product:price:amount" content={price.amount} />}
      {price && <meta property="product:price:currency" content={price.currency} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {share && <meta name="twitter:image" content={absoluteUrl(share.url)} />}

      {json && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />}
    </>
  );
}

export default Seo;
