import { useAppearanceStore, type Theme, type AccentColor, type PosterSize } from '../store/appStore';
import SettingsLayout from '../components/SettingsLayout';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
        enabled ? 'bg-exyo-red' : 'bg-white/10'
      }`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
        enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
      }`} />
    </button>
  );
}

const THEMES: { id: Theme; label: string; bg: string }[] = [
  { id: 'oled', label: 'OLED Dark', bg: '#000000' },
  { id: 'midnight', label: 'Midnight', bg: '#0A0A0A' },
  { id: 'graphite', label: 'Graphite', bg: '#1C1C1E' },
];

const ACCENT_COLORS: { id: AccentColor; color: string }[] = [
  { id: 'red', color: '#E50914' },
  { id: 'blue', color: '#0A84FF' },
  { id: 'purple', color: '#BF5AF2' },
  { id: 'green', color: '#30D158' },
  { id: 'orange', color: '#FF9F0A' },
  { id: 'pink', color: '#FF375F' },
];

const POSTER_SIZES: { id: PosterSize; label: string; width: string }[] = [
  { id: 'small', label: 'Small', width: 'w-[180px]' },
  { id: 'medium', label: 'Medium', width: 'w-[240px]' },
  { id: 'large', label: 'Large', width: 'w-[300px]' },
];

export default function Appearance() {
  const store = useAppearanceStore();

  return (
    <SettingsLayout title="Appearance" subtitle="Customize how EXYO looks and feels.">
      <div className="space-y-6">
        {/* Theme */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-white mb-4">Theme</h2>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => store.setTheme(theme.id)}
                className={`relative rounded-xl p-4 border-2 transition-all ${
                  store.theme === theme.id
                    ? 'border-exyo-red'
                    : 'border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div className="w-full h-12 rounded-lg mb-3" style={{ backgroundColor: theme.bg }} />
                <p className="text-[12px] font-semibold text-white">{theme.label}</p>
                {store.theme === theme.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-exyo-red rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Accent Color */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-white mb-4">Accent Color</h2>
          <div className="flex gap-3">
            {ACCENT_COLORS.map((accent) => (
              <button
                key={accent.id}
                onClick={() => store.setAccentColor(accent.id)}
                className={`w-10 h-10 rounded-full transition-all ${
                  store.accentColor === accent.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0A0A0A] scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: accent.color }}
              />
            ))}
          </div>
        </section>

        {/* Poster Size */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-white mb-4">Poster Size</h2>
          <div className="grid grid-cols-3 gap-3">
            {POSTER_SIZES.map((size) => (
              <button
                key={size.id}
                onClick={() => store.setPosterSize(size.id)}
                className={`rounded-xl p-4 border-2 transition-all ${
                  store.posterSize === size.id
                    ? 'border-exyo-red bg-white/[0.04]'
                    : 'border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div className={`h-20 rounded-lg bg-white/[0.06] mx-auto ${size.width}`} />
                <p className="text-[12px] font-semibold text-white mt-3">{size.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Toggles */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-white mb-4">Options</h2>
          <div className="space-y-4">
            {[
              { label: 'Glass Mode', desc: 'Frosted glass effect on UI elements', value: store.glassMode, onChange: () => store.setGlassMode(!store.glassMode) },
              { label: 'Reduce Motion', desc: 'Minimize animations throughout the app', value: store.reduceMotion, onChange: () => store.setReduceMotion(!store.reduceMotion) },
              { label: 'Autoplay Trailers', desc: 'Automatically play trailers on hover', value: store.autoplayTrailers, onChange: () => store.setAutoplayTrailers(!store.autoplayTrailers) },
              { label: 'Hover Animations', desc: 'Animate cards on hover', value: store.hoverAnimations, onChange: () => store.setHoverAnimations(!store.hoverAnimations) },
              { label: 'Rounded Posters', desc: 'Use rounded corners on poster images', value: store.roundedPosters, onChange: () => store.setRoundedPosters(!store.roundedPosters) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="text-[13px] text-white font-medium">{item.label}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <Toggle enabled={item.value} onChange={item.onChange} />
              </div>
            ))}
          </div>
        </section>

        {/* Navbar Transparency */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[15px] font-bold text-white mb-4">Navbar Transparency</h2>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              value={store.navbarTransparency}
              onChange={(e) => store.setNavbarTransparency(Number(e.target.value))}
              className="flex-1 accent-exyo-red"
            />
            <span className="text-[13px] text-gray-400 font-mono w-10 text-right">{store.navbarTransparency}%</span>
          </div>
        </section>
      </div>
    </SettingsLayout>
  );
}
