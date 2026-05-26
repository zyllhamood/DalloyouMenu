import { create } from 'zustand';

import i18n, {
  LANG_DEFAULT_VERSION_KEY,
  LANG_STORAGE_KEY,
  type SupportedLanguage,
} from '../lib/i18n';

interface UiState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

function initialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'ar';
  if (!window.localStorage.getItem(LANG_DEFAULT_VERSION_KEY)) {
    window.localStorage.setItem(LANG_STORAGE_KEY, 'ar');
    window.localStorage.setItem(LANG_DEFAULT_VERSION_KEY, '1');
    void i18n.changeLanguage('ar');
    return 'ar';
  }
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === 'ar' || stored === 'en') return stored;
  return 'ar';
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
