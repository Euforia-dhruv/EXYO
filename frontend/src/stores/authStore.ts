import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoaded: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setLoaded: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoaded: false,
      setAuth: (user, token) => set({ user, token, isLoaded: true }),
      logout: () => {
        localStorage.removeItem('exyo-auth');
        set({ user: null, token: null, isLoaded: true });
      },
      setLoaded: () => set({ isLoaded: true }),
    }),
    {
      name: 'exyo-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem('exyo-auth');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
}

export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
