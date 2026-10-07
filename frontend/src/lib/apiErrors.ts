import axios from 'axios';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** DRF answers with {field: ["message"]} — pull out the first real sentence. */
function firstFieldError(data: unknown): string | null {
  if (typeof data === 'string') {
    const text = data.trim();
    return text && !text.startsWith('<') ? text.slice(0, 200) : null;
  }
  if (!data || typeof data !== 'object') return null;
  for (const value of Object.values(data as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  }
  return null;
}

/**
 * Says what actually went wrong instead of a blanket "save failed".
 *
 * The timeout case matters most: the upload can give up while Django is still
 * writing the product, so the owner used to see an error for a product that
 * had in fact been saved. Now we tell them to check the list before retrying.
 */
export function saveErrorMessage(error: unknown, t: Translate): string {
  if (!axios.isAxiosError(error)) return t('saveError');
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return t('form.uploadTimeout');
  if (!error.response) return t('form.networkError');

  const { status, data } = error.response;
  if (status === 413) return t('form.imageTooLarge');
  if (status === 401 || status === 403) return t('form.sessionExpired');
  const detail = firstFieldError(data);
  if (detail) return detail;
  return status >= 500 ? t('form.serverError') : t('saveError');
}
