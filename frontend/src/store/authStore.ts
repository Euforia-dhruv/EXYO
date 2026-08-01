import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types';
import { api } from '../api/axios';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = response.data;

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', { username, email, password });
          const { user, accessToken, refreshToken } = response.data;

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        const { refreshToken } = get();
        if (refreshToken) {
          api.post('/auth/logout', { refreshToken }).catch(() => {});
        }

        delete api.defaults.headers.common['Authorization'];

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        set({ accessToken, refreshToken });
      }
    }),
    {
      name: 'exyo-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
