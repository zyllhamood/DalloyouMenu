import { create } from 'zustand';

export interface AuthUser {
  id: number | string;
  email: string;
  name?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  hydrate: () => void;
  login: (payload: { token: string; refreshToken: string; user: AuthUser }) => void;
  setTokens: (payload: { token: string; refreshToken: string }) => void;
  logout: () => void;
}

const STORAGE_KEY = 'dalloyou.auth';

interface PersistedShape {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}

function readStorage(): PersistedShape {
  if (typeof window === 'undefined') return { token: null, refreshToken: null, user: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, refreshToken: null, user: null };
    return JSON.parse(raw) as PersistedShape;
  } catch {
    return { token: null, refreshToken: null, user: null };
  }
}

function writeStorage(payload: PersistedShape) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

function clearStorage() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const persisted = readStorage();
    set({ ...persisted, hydrated: true });
  },

  login: ({ token, refreshToken, user }) => {
    writeStorage({ token, refreshToken, user });
    set({ token, refreshToken, user });
  },

  setTokens: ({ token, refreshToken }) => {
    const { user } = get();
    writeStorage({ token, refreshToken, user });
    set({ token, refreshToken });
  },

  logout: () => {
    clearStorage();
    set({ token: null, refreshToken: null, user: null });
  },
}));

export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

export function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}
