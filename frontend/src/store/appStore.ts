import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'system';
export type AccentColor = string;
export type PosterSize = 'small' | 'medium' | 'large';

interface AppearanceState {
  theme: Theme;
  accentColor: AccentColor;
  glassMode: boolean;
  reduceMotion: boolean;
  posterSize: PosterSize;
  navbarTransparency: number;
  autoplayTrailers: boolean;
  hoverAnimations: boolean;
  roundedPosters: boolean;
  setTheme: (t: Theme) => void;
  setAccentColor: (c: AccentColor) => void;
  setGlassMode: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setPosterSize: (s: PosterSize) => void;
  setNavbarTransparency: (v: number) => void;
  setAutoplayTrailers: (v: boolean) => void;
  setHoverAnimations: (v: boolean) => void;
  setRoundedPosters: (v: boolean) => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accentColor: '#E50914',
      glassMode: true,
      reduceMotion: false,
      posterSize: 'medium',
      navbarTransparency: 95,
      autoplayTrailers: true,
      hoverAnimations: true,
      roundedPosters: true,
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setGlassMode: (glassMode) => set({ glassMode }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setPosterSize: (posterSize) => set({ posterSize }),
      setNavbarTransparency: (navbarTransparency) => set({ navbarTransparency }),
      setAutoplayTrailers: (autoplayTrailers) => set({ autoplayTrailers }),
      setHoverAnimations: (hoverAnimations) => set({ hoverAnimations }),
      setRoundedPosters: (roundedPosters) => set({ roundedPosters }),
    }),
    {
      name: 'exyo-appearance',
    }
  )
);

interface PerformanceState {
  gpuDecode: boolean;
  hardwareAcceleration: boolean;
  streamingBuffer: number;
  cacheEnabled: boolean;
  cacheSize: number;
  setGpuDecode: (v: boolean) => void;
  setHardwareAcceleration: (v: boolean) => void;
  setStreamingBuffer: (v: number) => void;
  setCacheEnabled: (v: boolean) => void;
  setCacheSize: (v: number) => void;
  clearCache: () => void;
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set) => ({
      gpuDecode: true,
      hardwareAcceleration: true,
      streamingBuffer: 30,
      cacheEnabled: true,
      cacheSize: 0,
      setGpuDecode: (gpuDecode) => set({ gpuDecode }),
      setHardwareAcceleration: (hardwareAcceleration) => set({ hardwareAcceleration }),
      setStreamingBuffer: (streamingBuffer) => set({ streamingBuffer }),
      setCacheEnabled: (cacheEnabled) => set({ cacheEnabled }),
      setCacheSize: (cacheSize) => set({ cacheSize }),
      clearCache: () => set({ cacheSize: 0 }),
    }),
    {
      name: 'exyo-performance',
    }
  )
);
