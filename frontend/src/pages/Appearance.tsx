import { motion } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '../providers/AppearanceProvider';
import { cn } from '../utils/helpers';

const ACCENTS = ['#E50914', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E'];
const THEMES = [
  { value: 'dark' as const, label: 'Dark' },
  { value: 'light' as const, label: 'Light' },
  { value: 'system' as const, label: 'System' },
];

export default function Appearance() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
          <Palette className="w-5 h-5 text-white/40" />
        </div>
        <h1 className="text-white text-2xl font-extrabold tracking-tight">Appearance</h1>
      </div>

      {/* Theme */}
      <div className="mb-8">
        <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Theme</h3>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                'p-4 rounded-2xl border transition-all text-sm font-medium',
                theme === t.value
                  ? 'bg-white/[0.08] border-red/30 text-white'
                  : 'bg-card border-white/[0.04] text-white/40 hover:border-white/[0.08]'
              )}
            >
              {theme === t.value && <Check className="w-4 h-4 text-red mb-2 mx-auto" />}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div>
        <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Accent Color</h3>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((c) => (
            <button
              key={c}
              onClick={() => setAccentColor(c)}
              className={cn(
                'w-10 h-10 rounded-full transition-all',
                accentColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg scale-110' : 'hover:scale-110'
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
