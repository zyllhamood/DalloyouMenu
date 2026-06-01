// ─── Language helpers ─────────────────────────────────────────────────────

export function isArabic(lang: string | undefined): boolean {
  return (lang ?? 'en').startsWith('ar');
}

/**
 * Pick the correct localised string from separate en/ar fields.
 * Falls back gracefully in both directions so the UI never shows undefined.
 */
export function localized(
  en: string | undefined | null,
  ar: string | undefined | null,
  lang: string | undefined,
): string {
  if (isArabic(lang)) return ar || en || '';
  return en || ar || '';
}

// ─── Price helpers ────────────────────────────────────────────────────────

/**
 * Format a price, always returning a non-empty string.
 * Passes through `—` for missing / NaN values instead of crashing.
 */
export function formatPrice(
  value: number | string | null | undefined,
  lang: string | undefined,
): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';
  const rounded = Number.isInteger(n) ? n : Number(n.toFixed(2));
  return isArabic(lang) ? `${rounded} ر.س` : `SAR ${rounded}`;
}

/**
 * Price-only legacy helper kept for existing call sites.
 */
export function formatStartingFrom(
  value: number | string | null | undefined,
  lang: string | undefined,
): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';
  return formatPrice(n, lang);
}

// ─── Misc utils ────────────────────────────────────────────────────────────

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}
