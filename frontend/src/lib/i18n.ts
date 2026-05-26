import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '../locales/en/common.json';
import arCommon from '../locales/ar/common.json';
import enAdmin from '../locales/en/admin.json';
import arAdmin from '../locales/ar/admin.json';

export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANG_STORAGE_KEY = 'dalloyou.lang';
export const LANG_DEFAULT_VERSION_KEY = 'dalloyou.lang.default.v2';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, admin: enAdmin },
      ar: { common: arCommon, admin: arAdmin },
    },
    fallbackLng: 'ar',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    ns: ['common', 'admin'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export default i18n;
