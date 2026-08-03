import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useToast } from '../components/Toast';
import SettingsLayout from '../components/SettingsLayout';

const RECOMMENDED_ADDONS = [
  { name: 'Cinemeta', description: 'Free metadata, trailers, and images for movies and series', url: 'https://v3-cinemeta.strem.io/manifest.json', category: 'Metadata', stars: 5 },
  { name: 'OpenSubtitles v3', description: 'Subtitles in 50+ languages for movies and series', url: 'https://s1.subdl.com/subdl-server/api/1/subtitles/open subtitles v3/manifest.json', category: 'Subtitles', stars: 5 },
  { name: 'Streaming Catalogs', description: 'Browse catalogs from Netflix, Prime, Disney+, and more', url: 'https://cinemeta-catalogs.strem.io/manifest.json', category: 'Catalogs', stars: 4 },
  { name: 'TMDB Addon', description: 'Enhanced metadata from The Movie Database', url: 'https://stremio-tmdb-addon.onrender.com/manifest.json', category: 'Metadata', stars: 4 },
  { name: 'Anime Kitsu', description: 'Anime metadata and tracking via Kitsu', url: 'https://anime-kitsu.strem.io/manifest.json', category: 'Anime', stars: 4 },
  { name: 'AutoPlay', description: 'Automatically play the next episode', url: 'https://autostrem.netlify.app/manifest.json', category: 'Utility', stars: 3 },
];

interface InstalledAddon {
  _id: string;
  url: string;
  name?: string;
  manifest?: any;
  isDefault: boolean;
  active: boolean;
  createdAt: number;
}

function HealthIndicator({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-400' : 'bg-red-400'}`} />
      <span className={`text-[11px] font-medium ${active ? 'text-green-400' : 'text-red-400'}`}>
        {active ? 'Healthy' : 'Offline'}
      </span>
    </div>
  );
}

function AddonCard({ addon, onToggle, onRemove }: {
  addon: InstalledAddon;
  onToggle: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.05] transition-all duration-200 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-lg bg-exyo-red/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-exyo-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25-9.75 5.25-9.75-5.25 4.179-2.25" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-[14px] font-semibold text-white truncate">{addon.name || addon.url}</h3>
              {addon.manifest?.version && (
                <span className="text-[11px] text-gray-500">v{addon.manifest.version}</span>
              )}
            </div>
          </div>
          {addon.manifest?.description && (
            <p className="text-[12px] text-gray-500 line-clamp-2 mt-2 ml-[46px]">{addon.manifest.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 ml-[46px]">
            <HealthIndicator active={addon.active} />
            {addon.isDefault && (
              <span className="text-[10px] font-semibold text-exyo-red bg-exyo-red/10 px-2 py-0.5 rounded-full">Default</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggle}
            disabled={addon.isDefault}
            className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
              addon.active ? 'bg-exyo-red' : 'bg-white/10'
            } ${addon.isDefault ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
              addon.active ? 'translate-x-[18px]' : 'translate-x-0.5'
            }`} />
          </button>
          {!addon.isDefault && onRemove && (
            <button
              onClick={onRemove}
              className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4 text-gray-500 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Streaming() {
  const { showToast } = useToast();
  const [installUrl, setInstallUrl] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  const addons = useQuery(api.addons.getAddons) as InstalledAddon[] | undefined;
  const addAddon = useMutation(api.addons.addAddon);
  const removeAddon = useMutation(api.addons.removeAddon);
  const toggleAddon = useMutation(api.addons.toggleAddon);

  const handleInstall = async () => {
    if (!installUrl.trim()) return;
    setIsInstalling(true);
    try {
      await addAddon({ url: installUrl.trim() });
      setInstallUrl('');
      showToast('Addon installed successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to install addon', 'error');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeAddon({ id: id as any });
      showToast('Addon removed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove addon', 'error');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleAddon({ id: id as any });
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle addon', 'error');
    }
  };

  const installedCount = addons?.filter((a) => a.active).length || 0;
  const totalCount = addons?.length || 0;

  return (
    <SettingsLayout title="Streaming" subtitle="Manage your content providers and discover new addons.">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className="text-[24px] font-bold text-white">{totalCount}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">Installed</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className="text-[24px] font-bold text-green-400">{installedCount}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">Active</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className="text-[24px] font-bold text-exyo-red">{totalCount - installedCount}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">Inactive</p>
          </div>
        </div>

        {/* Install from URL */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-[16px] font-bold text-white mb-3">Install Provider</h2>
          <div className="flex gap-3">
            <input
              type="url"
              value={installUrl}
              onChange={(e) => setInstallUrl(e.target.value)}
              placeholder="Paste addon manifest URL..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-exyo-red/40 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleInstall()}
            />
            <button
              onClick={handleInstall}
              disabled={!installUrl.trim() || isInstalling}
              className="bg-exyo-red text-white px-5 py-2.5 rounded-xl font-semibold text-[14px] hover:bg-exyo-red-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isInstalling ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
              Install
            </button>
          </div>
        </section>

        {/* Installed Providers */}
        {addons && addons.length > 0 && (
          <section>
            <h2 className="text-[16px] font-bold text-white mb-3">Installed Providers</h2>
            <div className="space-y-2.5">
              {addons.map((addon) => (
                <AddonCard
                  key={addon._id}
                  addon={addon}
                  onToggle={() => handleToggle(addon._id)}
                  onRemove={addon.isDefault ? undefined : () => handleRemove(addon._id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Browse Community Addons */}
        <section className="bg-gradient-to-br from-exyo-red/10 to-transparent border border-exyo-red/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-exyo-red/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-exyo-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-[16px] font-bold text-white mb-1">Browse Community Addons</h3>
              <p className="text-[13px] text-gray-400 mb-4">Discover hundreds of community-built addons for movies, anime, live TV, subtitles, and more.</p>
              <a
                href="https://stremio.github.io/stremio-addons/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-semibold text-[13px] hover:bg-white/90 transition-colors"
              >
                Open Directory
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Recommended Providers */}
        <section>
          <h2 className="text-[16px] font-bold text-white mb-3">Recommended Providers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RECOMMENDED_ADDONS.map((addon) => {
              const isInstalled = addons?.some((a) => a.url === addon.url);
              return (
                <div key={addon.name} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[13px] font-semibold text-white">{addon.name}</h4>
                        <span className="text-[10px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5 rounded">{addon.category}</span>
                      </div>
                      <p className="text-[12px] text-gray-500 mt-1 line-clamp-2">{addon.description}</p>
                      <div className="flex items-center gap-0.5 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} className={`w-3 h-3 ${i < addon.stars ? 'text-yellow-400' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    {isInstalled ? (
                      <span className="text-[11px] font-semibold text-green-400 bg-green-400/10 px-2.5 py-1 rounded-lg flex-shrink-0">Installed</span>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            await addAddon({ url: addon.url });
                            showToast(`${addon.name} installed`, 'success');
                          } catch (err: any) {
                            showToast(err.message || 'Failed to install', 'error');
                          }
                        }}
                        className="text-[12px] font-semibold text-exyo-red bg-exyo-red/10 px-3 py-1 rounded-lg hover:bg-exyo-red/20 transition-colors flex-shrink-0"
                      >
                        Install
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </SettingsLayout>
  );
}
