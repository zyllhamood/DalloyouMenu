export const WHATSAPP_NUMBER = '966532370777';
/** Local format, as printed on the shop's own posters. */
export const WHATSAPP_DISPLAY = '053 237 0777';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

const WHATSAPP_GREETING = 'مرحباً، أرغب في الطلب من داليو. / Hello, I would like to order from Dalloyou.';
export const WHATSAPP_ORDER_URL = `${WHATSAPP_URL}?text=${encodeURIComponent(WHATSAPP_GREETING)}`;

export const THECHEFZ_URL = 'https://thechefzco.app.link/51vU19kzw5b';
export const HUNGERSTATION_URL = 'https://hungerstation.go.link/?c=SA&s=c&v=104200&so=mls&adj_t=1sdhhuza_1spi9ypp&adj_og_title=%D8%AF%D8%A7%D9%84%D9%8A%D9%88&adj_og_image=https://images.deliveryhero.io/image/hungerstation/restaurant/logo_ar/33a1dd75f9d28b06f77bb80304a293d6.png';
export const KEETA_URL = 'https://url.mykeeta.com/rGpnyECz';

export const INSTAGRAM_URL = 'https://www.instagram.com/dalloyauksa';
export const TIKTOK_URL = 'https://www.tiktok.com/@dalloyauksa';
export const SNAPCHAT_URL = 'https://www.snapchat.com/add/dalloyou';

export const BRANCH_KHOBAR_MAPS_URL = 'https://maps.google.com?q=%D8%AF%D8%A7%D9%84%D9%8A%D9%88%20%7C%20Dalloyau%D8%8C%20%D8%B4%D8%A7%D8%B1%D8%B9%20%D8%A3%D8%A8%D9%88%20%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86%20%D8%A8%D9%86%20%D8%B9%D9%82%D9%8A%D9%84,%20%D8%A7%D9%84%D8%B4%D8%B1%D9%82%D9%8A%D8%A9%D8%8C%20%D8%AD%D9%8A%20%D8%A7%D9%84%D8%AE%D8%B2%D8%A7%D9%85%D9%8A%D8%8C%20%D8%A7%D9%84%D8%AE%D8%A8%D8%B1%2034614&ftid=0x3e49c310ae0bb1e1:0x8463c4abf041ed9d&entry=gps';
export const BRANCH_DAMMAM_MAPS_URL = 'https://maps.app.goo.gl/GbjJkWRAbfvi9tTp6';

export function createWhatsAppUrl(message?: string) {
  return message ? `${WHATSAPP_URL}?text=${encodeURIComponent(message)}` : WHATSAPP_URL;
}

// ─── Structured lists the storefront renders ─────────────────────────────

export type DeliveryAppKey = 'hungerstation' | 'thechefz' | 'keeta';

export const DELIVERY_APPS: { key: DeliveryAppKey; url: string }[] = [
  { key: 'hungerstation', url: HUNGERSTATION_URL },
  { key: 'thechefz', url: THECHEFZ_URL },
  { key: 'keeta', url: KEETA_URL },
];

export const BRANCHES = [
  { key: 'branch1', mapsUrl: BRANCH_KHOBAR_MAPS_URL },
  { key: 'branch2', mapsUrl: BRANCH_DAMMAM_MAPS_URL },
] as const;

export type SocialKey = 'instagram' | 'tiktok' | 'snapchat';

export const SOCIALS: { key: SocialKey; url: string; handle: string; label: string }[] = [
  { key: 'instagram', url: INSTAGRAM_URL, handle: '@dalloyauksa', label: 'Instagram' },
  { key: 'tiktok', url: TIKTOK_URL, handle: '@dalloyauksa', label: 'TikTok' },
  { key: 'snapchat', url: SNAPCHAT_URL, handle: 'dalloyou', label: 'Snapchat' },
];

/** WhatsApp message for a specific product, with a link staff can open. */
export function productOrderMessage({
  name,
  measurement,
  price,
  url,
}: {
  name: string;
  measurement?: string;
  price?: string | null;
  url?: string;
}): string {
  const lines = ['السلام عليكم،', `أرغب بطلب: ${name}${measurement ? ` (${measurement})` : ''}`];
  if (price) lines.push(`السعر: ${price} ر.س`);
  if (url) lines.push(url);
  return lines.join('\n');
}
