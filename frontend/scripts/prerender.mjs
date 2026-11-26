/**
 * Prerender — runs after `vite build` (client) and `vite build --ssr` (server
 * entry). Fetches the live menu once, then writes a complete HTML file for
 * every public page, plus sitemap.xml and robots.txt:
 *
 *   dist/index.html                     the home page (also the SPA fallback)
 *   dist/menu/index.html  + menu.html   the menu
 *   dist/menu/<slug>/…                  each category
 *   dist/product/<id>/…                 each product
 *
 * Each file carries the page's own <title>, description, canonical URL,
 * Open Graph tags and JSON-LD, its critical CSS, and the data it was built
 * with (so the app takes over without a loading flash, then refreshes from
 * the API). Pages are written both as <path>/index.html and <path>.html so
 * any static host serves them at the clean URL.
 *
 * If the API can't be reached, the build keeps the plain SPA and exits
 * cleanly — a deploy never fails because of prerendering.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const serverEntry = join(root, 'dist-ssr', 'entry-server.js');

const log = (...args) => console.log('[prerender]', ...args);

const server = await import(pathToFileURL(serverEntry).href);
const SITE = server.SITE_URL;

// ── robots.txt — always, even if the rest is skipped ────────────────────────
await writeFile(
  join(dist, 'robots.txt'),
  ['User-agent: *', 'Allow: /', 'Disallow: /admin', '', `Sitemap: ${SITE}/sitemap.xml`, ''].join('\n'),
);

// ── Data ────────────────────────────────────────────────────────────────────
let menu;
try {
  menu = await server.loadMenu();
} catch (error) {
  log(`menu unavailable (${error?.message ?? error}) — keeping the plain SPA build.`);
  await rm(join(root, 'dist-ssr'), { recursive: true, force: true });
  process.exit(0);
}
log(`menu: ${menu.categories.length} categories, ${menu.products.length} products`);

// The custom designs are optional: without them the page still renders (and fills in live).
let designs = null;
try {
  designs = await server.loadDesigns();
  log(`designs: ${designs.designs.length}`);
} catch (error) {
  log(`designs unavailable (${error?.message ?? error}) — /designs will load them in the browser.`);
}

/** The hero's photo looks, read from the same thumbnails the browser would read. */
async function readLooks() {
  const looks = {};
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    log('sharp not installed — the hero will read its photos in the browser.');
    return looks;
  }
  const size = server.BACKDROP_SAMPLE;
  await Promise.all(
    server.lookTargets(menu).map(async ({ id, src }) => {
      if (!src) return;
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const input = Buffer.from(await response.arrayBuffer());
        const { data } = await sharp(input).resize(size, size, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        looks[id] = server.analyseBackdrop(data, size);
      } catch (error) {
        log(`look for product ${id} skipped (${error.message})`);
      }
    }),
  );
  return looks;
}

const looks = await readLooks();
const boot = { menu, menuAt: Date.now(), looks, designs };
server.prime(boot);
log(`hero looks: ${Object.values(looks).map((l) => l.kind).join(', ') || 'none'}`);

// ── Pages ───────────────────────────────────────────────────────────────────
const template = await readFile(join(dist, 'index.html'), 'utf8');

/** The shell's own defaults give way to each page's tags. */
const shell = template
  .replace(/\s*<title>[\s\S]*?<\/title>/, '')
  .replace(/\s*<meta\s+name="description"[^>]*>/g, '')
  .replace(/\s*<meta\s+property="og:[^"]*"[^>]*>/g, '')
  .replace(/\s*<meta\s+name="twitter:[^"]*"[^>]*>/g, '');

const HOISTED = /^(?:<title\b[^>]*>[\s\S]*?<\/title>|<meta\b[^>]*\/?>|<link\b[^>]*\/?>)/;

/** React 19 puts a page's <title>/<meta>/<link> first in its output: move them into <head>. */
function splitHead(html) {
  const tags = [];
  let rest = html;
  for (let match = rest.match(HOISTED); match; match = rest.match(HOISTED)) {
    tags.push(match[0].replace(/^<(\w+)/, '<$1 data-ssr=""'));
    rest = rest.slice(match[0].length);
  }
  return { head: tags.join('\n    '), body: rest };
}

/**
 * JSON that is safe inside an inline <script>: "<" (so a "</script>" in the
 * data cannot end it early) and the two JS line-terminator characters are
 * written as escape sequences.
 */
const BACKSLASH = String.fromCharCode(92);
const UNSAFE_IN_SCRIPT = [60, 0x2028, 0x2029].map((code) => String.fromCharCode(code));
const json = (value) =>
  UNSAFE_IN_SCRIPT.reduce(
    (text, char) => text.split(char).join(`${BACKSLASH}u${char.charCodeAt(0).toString(16).padStart(4, '0')}`),
    JSON.stringify(value),
  );
const bootScript = `<script>window.__DALLOYOU__=${json(boot)}</script>`;

/*
 * index.html is also what the host serves for any address without its own
 * file (admin pages, products added since this build). There, the home
 * page's markup and head tags are cleared before anything paints, and the app
 * renders the real page.
 */
const fallbackGuard =
  "<script>if(location.pathname!=='/'){document.getElementById('root').textContent='';document.querySelectorAll('head [data-ssr]').forEach(function(e){e.remove()})}</script>";

function page(path, { html, styles }) {
  const { head, body } = splitHead(html);
  const isHome = path === '/';
  return shell
    .replace('</head>', `    ${head}\n    ${styles}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>${isHome ? fallbackGuard : ''}${bootScript}`);
}

async function write(path, content) {
  if (path === '/') {
    await writeFile(join(dist, 'index.html'), content);
    return;
  }
  const clean = path.replace(/^\/+|\/+$/g, '');
  await mkdir(join(dist, clean), { recursive: true });
  await writeFile(join(dist, clean, 'index.html'), content);
  await mkdir(dirname(join(dist, `${clean}.html`)), { recursive: true });
  await writeFile(join(dist, `${clean}.html`), content);
}

const entries = server.pages(menu, designs);
let written = 0;
for (const entry of entries) {
  try {
    await write(entry.path, page(entry.path, server.render(entry.path)));
    written += 1;
  } catch (error) {
    log(`${entry.path} kept as SPA (${error.message})`);
  }
}
log(`${written}/${entries.length} pages written`);

// ── sitemap.xml ─────────────────────────────────────────────────────────────
const xml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const absolute = (path) => (/^https?:\/\//.test(path) ? path : `${SITE}${path}`);

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ...entries.map((entry) =>
    [
      '  <url>',
      `    <loc>${xml(absolute(entry.path))}</loc>`,
      entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : null,
      ...entry.images.map((src) => `    <image:image><image:loc>${xml(absolute(src))}</image:loc></image:image>`),
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n'),
  ),
  '</urlset>',
  '',
].join('\n');
await writeFile(join(dist, 'sitemap.xml'), sitemap);
log(`sitemap.xml: ${entries.length} URLs`);

await rm(join(root, 'dist-ssr'), { recursive: true, force: true });
