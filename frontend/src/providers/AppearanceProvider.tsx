import { useEffect, createContext, useContext } from 'react';
import { useAppearanceStore } from '../store/appStore';
import type { Theme, AccentColor } from '../store/appStore';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  accentColor: AccentColor;
  setAccentColor: (c: AccentColor) => void;
  glassMode: boolean;
  setGlassMode: (v: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
  roundedPosters: boolean;
  setRoundedPosters: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  const store = useAppearanceStore();
  if (!ctx) {
    return {
      theme: store.theme,
      setTheme: store.setTheme,
      accentColor: store.accentColor,
      setAccentColor: store.setAccentColor,
      glassMode: store.glassMode,
      setGlassMode: store.setGlassMode,
      reduceMotion: store.reduceMotion,
      setReduceMotion: store.setReduceMotion,
      roundedPosters: store.roundedPosters,
      setRoundedPosters: store.setRoundedPosters,
    };
  }
  return ctx;
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const { theme, accentColor, glassMode, reduceMotion, roundedPosters } =
    useAppearanceStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.style.setProperty('--theme-accent', accentColor);
    root.classList.remove('theme-dark', 'theme-light', 'theme-system');
    root.classList.add(`theme-${theme}`);
    if (glassMode) root.classList.add('glass-mode');
    else root.classList.remove('glass-mode');
    if (reduceMotion) root.classList.add('reduce-motion');
    else root.classList.remove('reduce-motion');
    if (roundedPosters) root.classList.add('rounded-posters');
    else root.classList.remove('rounded-posters');
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => root.classList.toggle('dark', mq.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme, accentColor, glassMode, reduceMotion, roundedPosters]);

  const value: ThemeContextValue = {
    theme, setTheme: useAppearanceStore.getState().setTheme,
    accentColor, setAccentColor: useAppearanceStore.getState().setAccentColor,
    glassMode, setGlassMode: useAppearanceStore.getState().setGlassMode,
    reduceMotion, setReduceMotion: useAppearanceStore.getState().setReduceMotion,
    roundedPosters, setRoundedPosters: useAppearanceStore.getState().setRoundedPosters,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
