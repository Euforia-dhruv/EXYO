import { create } from 'zustand';

export interface SubtitleSettings {
  enabled: boolean;
  size: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  opacity: number;
  fontWeight: number;
  fontFamily: string;
  position: 'bottom' | 'top';
  alignment: 'left' | 'center' | 'right';
  edgeStyle: 'none' | 'shadow' | 'outline' | 'glow';
  edgeColor: string;
  delay: number;
}

interface SubtitleStore extends SubtitleSettings {
  setEnabled: (v: boolean) => void;
  setSize: (v: number) => void;
  setColor: (v: string) => void;
  setBackgroundColor: (v: string) => void;
  setBackgroundOpacity: (v: number) => void;
  setOpacity: (v: number) => void;
  setFontWeight: (v: number) => void;
  setFontFamily: (v: string) => void;
  setPosition: (v: 'bottom' | 'top') => void;
  setAlignment: (v: 'left' | 'center' | 'right') => void;
  setEdgeStyle: (v: 'none' | 'shadow' | 'outline' | 'glow') => void;
  setEdgeColor: (v: string) => void;
  setDelay: (v: number) => void;
}

const DEFAULTS: SubtitleSettings = {
  enabled: true,
  size: 100,
  color: '#ffffff',
  backgroundColor: '#000000',
  backgroundOpacity: 60,
  opacity: 100,
  fontWeight: 600,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  position: 'bottom',
  alignment: 'center',
  edgeStyle: 'shadow',
  edgeColor: '#000000',
  delay: 0,
};

function load(): SubtitleSettings {
  try {
    const raw = localStorage.getItem('exyo:subtitleSettings');
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function persist(s: SubtitleSettings) {
  try {
    localStorage.setItem('exyo:subtitleSettings', JSON.stringify(s));
  } catch {}
}

export const useSubtitleStore = create<SubtitleStore>((set, get) => ({
  ...load(),
  setEnabled: (enabled) => { set({ enabled }); persist({ ...get(), enabled }); },
  setSize: (size) => { set({ size }); persist({ ...get(), size }); },
  setColor: (color) => { set({ color }); persist({ ...get(), color }); },
  setBackgroundColor: (backgroundColor) => { set({ backgroundColor }); persist({ ...get(), backgroundColor }); },
  setBackgroundOpacity: (backgroundOpacity) => { set({ backgroundOpacity }); persist({ ...get(), backgroundOpacity }); },
  setOpacity: (opacity) => { set({ opacity }); persist({ ...get(), opacity }); },
  setFontWeight: (fontWeight) => { set({ fontWeight }); persist({ ...get(), fontWeight }); },
  setFontFamily: (fontFamily) => { set({ fontFamily }); persist({ ...get(), fontFamily }); },
  setPosition: (position) => { set({ position }); persist({ ...get(), position }); },
  setAlignment: (alignment) => { set({ alignment }); persist({ ...get(), alignment }); },
  setEdgeStyle: (edgeStyle) => { set({ edgeStyle }); persist({ ...get(), edgeStyle }); },
  setEdgeColor: (edgeColor) => { set({ edgeColor }); persist({ ...get(), edgeColor }); },
  setDelay: (delay) => { set({ delay }); persist({ ...get(), delay }); },
}));
