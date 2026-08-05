import { useCallback } from 'react';
import { useTheme } from '../providers/AppearanceProvider';
import { SunIcon, MoonIcon, ComputerDesktopIcon, CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '../utils/helpers';

const THEMES = [
  { id: 'dark' as const, label: 'Dark', icon: MoonIcon, description: 'Easy on the eyes' },
  { id: 'light' as const, label: 'Light', icon: SunIcon, description: 'Bright and clean' },
  { id: 'system' as const, label: 'System', icon: ComputerDesktopIcon, description: 'Match your OS' },
];

export default function Appearance() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  const ACCENT_COLORS = [
    { id: '#E50914', name: 'Netflix Red' },
    { id: '#6366F1', name: 'Indigo' },
    { id: '#8B5CF6', name: 'Violet' },
    { id: '#EC4899', name: 'Pink' },
    { id: '#F59E0B', name: 'Amber' },
    { id: '#10B981', name: 'Emerald' },
    { id: '#06B6D4', name: 'Cyan' },
    { id: '#3B82F6', name: 'Blue' },
  ];

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-white text-[20px] font-semibold tracking-tight mb-6">Appearance</h2>

      {/* Theme */}
      <div className="mb-8">
        <h3 className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">Theme</h3>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={cn(
                'relative p-4 rounded-xl border transition-all duration-200 text-left',
                theme === id
                  ? 'bg-white/[0.08] border-exyo-red/30'
                  : 'bg-exyo-card border-white/[0.04] hover:border-white/[0.08]'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-2', theme === id ? 'text-exyo-red' : 'text-white/40')} />
              <p className="text-white text-[13px] font-medium">{label}</p>
              <p className="text-white/30 text-[11px] mt-0.5">{description}</p>
              {theme === id && (
                <div className="absolute top-3 right-3">
                  <CheckIcon className="w-4 h-4 text-exyo-red" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <h3 className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">Accent Color</h3>
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLORS.map(({ id, name }) => (
            <button
              key={id}
              onClick={() => setAccentColor(id)}
              className={cn(
                'w-10 h-10 rounded-xl transition-all duration-200 relative',
                accentColor === id ? 'ring-2 ring-white ring-offset-2 ring-offset-exyo-bg scale-110' : 'hover:scale-105'
              )}
              style={{ backgroundColor: id }}
              title={name}
              aria-label={name}
            >
              {accentColor === id && (
                <CheckIcon className="w-4 h-4 text-white absolute inset-0 m-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
