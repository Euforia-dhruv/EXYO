import { create } from 'zustand';

export type Theme = 'dark' | 'light' | 'system';
export type AccentColor = string;

interface AppearanceState {
  theme: Theme;
  accentColor: AccentColor;
  glassMode: boolean;
  reduceMotion: boolean;
  roundedPosters: boolean;
  setTheme: (t: Theme) => void;
  setAccentColor: (c: AccentColor) => void;
  setGlassMode: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setRoundedPosters: (v: boolean) => void;
}

export const useAppearanceStore = create<AppearanceState>((set) => ({
  theme: 'dark',
  accentColor: '#E50914',
  glassMode: true,
  reduceMotion: false,
  roundedPosters: true,
  setTheme: (theme) => set({ theme }),
  setAccentColor: (accentColor) => set({ accentColor }),
  setGlassMode: (glassMode) => set({ glassMode }),
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
  setRoundedPosters: (roundedPosters) => set({ roundedPosters }),
}));
