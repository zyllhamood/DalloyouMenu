import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '../locales/en/common.json';
import arCommon from '../locales/ar/common.json';
import enAdmin from '../locales/en/admin.json';
import arAdmin from '../locales/ar/admin.json';

export const SUPPORTED_LANGUAGES = ['ar'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANG_STORAGE_KEY = 'dalloyou.lang';
export const LANG_DEFAULT_VERSION_KEY = 'dalloyou.lang.default.v2';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, admin: enAdmin },
      ar: { common: arCommon, admin: arAdmin },
    },
    fallbackLng: 'ar',
    lng: 'ar',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    ns: ['common', 'admin'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });

export default i18n;
