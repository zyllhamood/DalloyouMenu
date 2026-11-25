/** The storefront's public origin, without a trailing slash (override with VITE_SITE_URL). */
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || 'https://dalloyou.com').replace(/\/+$/, '');

/** The origin links should point at: this browser's, or the public one when rendering at build time. */
export const currentOrigin = () => (typeof window !== 'undefined' ? window.location.origin : SITE_URL);
