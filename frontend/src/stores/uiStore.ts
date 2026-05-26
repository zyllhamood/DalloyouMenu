import { create } from 'zustand';

import i18n, { LANG_STORAGE_KEY, type SupportedLanguage } from '../lib/i18n';

interface UiState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

function initialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === 'ar' || stored === 'en') return stored;
  const detected = i18n.language?.split('-')[0];
  return detected === 'ar' ? 'ar' : 'en';
}

export const useUiStore = create<UiState>((set) => ({
  language: initialLanguage(),
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANG_STORAGE_KEY, language);
    }
    void i18n.changeLanguage(language);
    set({ language });
  },
}));
