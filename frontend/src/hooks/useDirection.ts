import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { ARABIC_BODY, ARABIC_HEADING } from '../theme';

const LATIN_BODY = `'Inter', system-ui, sans-serif`;
const LATIN_HEADING = `'Cormorant Garamond', Georgia, serif`;

export function useDirection() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] ?? 'en';
  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('dir', dir);
    html.setAttribute('lang', lang);

    if (lang === 'ar') {
      html.style.setProperty('--font-body', ARABIC_BODY);
      html.style.setProperty('--font-heading', ARABIC_HEADING);
    } else {
      html.style.setProperty('--font-body', LATIN_BODY);
      html.style.setProperty('--font-heading', LATIN_HEADING);
    }
  }, [dir, lang]);

  return { dir, lang };
}
