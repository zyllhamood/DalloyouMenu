import { create } from 'zustand';

import i18n, { LANG_DEFAULT_VERSION_KEY, LANG_STORAGE_KEY, type SupportedLanguage } from '../lib/i18n';

interface UiState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;

  /** The fixed navbar slides away while reading downwards. */
  navHidden: boolean;
  setNavHidden: (hidden: boolean) => void;

  /** The global "order" sheet (WhatsApp + delivery apps). */
  orderOpen: boolean;
  openOrder: () => void;
  closeOrder: () => void;

  /** True while the first-visit intro curtain is on screen. */
  introActive: boolean;
  setIntroActive: (active: boolean) => void;
}

export const INTRO_STORAGE_KEY = 'dalloyou.intro.v1';

/**
 * The intro curtain plays once per browser session, only when the visit
 * starts on the homepage, and never for visitors who prefer reduced motion.
 * Decided before the first render so the hero can wait for it.
 */
function initialIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.pathname !== '/') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return !window.sessionStorage.getItem(INTRO_STORAGE_KEY);
  } catch {
    return false;
  }
}

function initialLanguage(): SupportedLanguage {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, 'ar');
      window.localStorage.setItem(LANG_DEFAULT_VERSION_KEY, '1');
    } catch {
      // storage can be unavailable (private mode) — Arabic is the default anyway
    }
  }
  void i18n.changeLanguage('ar');
  return 'ar';
}

export const useUiStore = create<UiState>((set) => ({
  language: initialLanguage(),
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANG_STORAGE_KEY, language);
      } catch {
        // ignore
      }
    }
    void i18n.changeLanguage(language);
    set({ language });
  },

  navHidden: false,
  setNavHidden: (navHidden) => set((s) => (s.navHidden === navHidden ? s : { navHidden })),

  orderOpen: false,
  openOrder: () => set({ orderOpen: true }),
  closeOrder: () => set({ orderOpen: false }),

  introActive: initialIntro(),
  setIntroActive: (introActive) => set({ introActive }),
}));
