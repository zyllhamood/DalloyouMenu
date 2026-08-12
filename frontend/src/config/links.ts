export const WHATSAPP_NUMBER = '966532370777';
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
