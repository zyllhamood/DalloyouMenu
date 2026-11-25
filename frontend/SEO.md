# SEO

The storefront is a single-page app (Vite and React). `npm run build` adds a prerender step that gives every public page real HTML. Search engines, link previews (WhatsApp, X, Facebook) and AI crawlers can then read a page without running JavaScript. Visitors still get the app, which takes over as soon as it loads.

## What the build does

`npm run build` runs four steps in order:

1. `tsc -b`: type-checks the code.
2. `vite build`: builds the client app, as before.
3. `vite build --ssr src/entry-server.tsx`: builds a server version of the same pages.
4. `node scripts/prerender.mjs`: fetches the live menu from `VITE_API_BASE_URL` once, then writes:
   - `dist/index.html`, the home page;
   - `dist/menu/…`, the menu and each category (`/menu/cakes`, …);
   - `dist/product/<id>/…`, every product;
   - `dist/sitemap.xml`, with every page and its images;
   - `dist/robots.txt`, which allows everything except `/admin` and points to the sitemap.

Each page is written twice, as `<path>/index.html` and `<path>.html`, so any static host can serve it at the clean URL.

If the API can't be reached during the build, the prerender step logs a message and keeps the plain SPA build. The deploy never fails because of it.

To build without prerendering, run `npm run build:spa`.

## What each page carries

| Page | Title, description, canonical | Structured data (schema.org JSON-LD) |
| --- | --- | --- |
| Home | Keywords: كيك، حلويات، شوكولاتة، الخبر، الدمام | `Bakery` with both branches (address, map link, phone, social profiles), `WebSite` |
| Menu | The full price list | `Menu` with each section and item and its price, `BreadcrumbList` |
| Category | The category name and product count | `ItemList`, `BreadcrumbList` |
| Product | Name, category and price | `Product` with an `Offer` (price in SAR, availability), `BreadcrumbList` |
| Missing product or page | Not found | Marked `noindex` |

Every page also carries:

- Open Graph and X card tags, with a 1200px share image;
- one `<h1>`;
- image alt text;
- the menu data it was built with, so the app starts without a loading flash and then refreshes from the API.

The code for all of this lives in `src/lib/seo.ts` (URLs and JSON-LD), `src/components/Seo.tsx` (head tags) and the page components. The text is under `seo` in `src/locales/ar/common.json`.

## When to rebuild

The static pages hold the menu as it was at build time. Visitors always see live data, because the app refreshes it on load. Search engines and link previews see the built copy.

Rebuild and redeploy after changes that should reach search results: new products, price changes, renamed categories. A product added since the last build still works through the app, but it has no static page or sitemap entry until the next build.

## Hosting requirement

The server must serve `/menu` from `menu/index.html` or `menu.html`, and so on for other pages. Any address without its own file must still fall back to `index.html`, as it does today. Cloudflare Pages, Netlify, Vercel and the usual nginx `try_files $uri $uri.html $uri/ /index.html;` all do this.

After deploying, check that a page returns its own title:

```
curl -s https://dalloyou.com/product/72 | grep -o "<title[^<]*</title>"
```

It should print the product's title, not the home page's.

## Outside the code (the owner's part)

1. **Google Search Console:** verify `dalloyou.com`, submit `https://dalloyou.com/sitemap.xml`, and request indexing for the home and menu pages. Do the same in Bing Webmaster Tools, which also feeds ChatGPT and Copilot search.
2. **Google Business Profile, one per branch:** this is the biggest factor for searches like "كيك الخبر" and "حلويات الدمام" in Maps. Set the website to `https://dalloyou.com`, the category to Bakery or Dessert shop, and add opening hours, photos and the menu link. Ask customers for reviews.
3. **Details that would strengthen the structured data:** opening hours, full street addresses and map coordinates for each branch. Send them and they go into `businessJsonLd` in `src/lib/seo.ts`. Don't add reviews or ratings that aren't real; Google penalises that.
4. **Cloudflare's managed robots.txt** blocks AI-training crawlers (GPTBot, Google-Extended, …). That doesn't affect Google Search or ChatGPT search, whose `OAI-SearchBot` is allowed. Change it in the Cloudflare dashboard only if you want AI models trained on the site.
