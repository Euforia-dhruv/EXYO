import { useEffect } from 'react';
import { useAppearanceStore } from '../store/appStore';

const ACCENT_COLORS: Record<string, string> = {
  red: '#E50914',
  blue: '#1DA1F2',
  purple: '#9333EA',
  green: '#10B981',
  orange: '#F97316',
  pink: '#EC4899',
};

const THEME_COLORS: Record<string, { bg: string; surface: string; hover: string }> = {
  oled: { bg: '#000000', surface: '#0A0A0A', hover: '#1A1A1A' },
  midnight: { bg: '#0A0A0A', surface: '#141414', hover: '#2A2A2A' },
  graphite: { bg: '#121212', surface: '#1E1E1E', hover: '#2E2E2E' },
};

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const { theme, accentColor, glassMode, reduceMotion, navbarTransparency, roundedPosters } =
    useAppearanceStore();

  useEffect(() => {
    const root = document.documentElement;
    const themeColors = THEME_COLORS[theme] || THEME_COLORS.midnight;
    const accent = ACCENT_COLORS[accentColor] || ACCENT_COLORS.red;

    root.style.setProperty('--exyo-bg', themeColors.bg);
    root.style.setProperty('--exyo-surface', themeColors.surface);
    root.style.setProperty('--exyo-hover', themeColors.hover);
    root.style.setProperty('--exyo-accent', accent);
    root.style.setProperty('--exyo-navbar-alpha', `${navbarTransparency / 100}`);

    root.classList.remove('theme-oled', 'theme-midnight', 'theme-graphite');
    root.classList.add(`theme-${theme}`);

    if (glassMode) {
      root.classList.add('glass-mode');
    } else {
      root.classList.remove('glass-mode');
    }

    if (reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    if (roundedPosters) {
      root.classList.add('rounded-posters');
    } else {
      root.classList.remove('rounded-posters');
    }
  }, [theme, accentColor, glassMode, reduceMotion, navbarTransparency, roundedPosters]);

  return <>{children}</>;
}
