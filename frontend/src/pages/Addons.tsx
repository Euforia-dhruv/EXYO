import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../convex/_generated/api';
import { useToast } from '../components/Toast';
import SettingsLayout from '../components/SettingsLayout';

const POPULAR_ADDONS = [
  { name: 'Cinemeta', url: 'https://v3-cinemeta.strem.io/manifest.json', description: 'Movies & TV shows with metadata', category: 'Metadata' },
  { name: 'Torrentio', url: 'https://torrentio.strem.fun/manifest.json', description: 'Torrent-based streaming', category: 'Streaming' },
  { name: 'NoTorrent', url: 'https://addon.notorrent2.workers.dev/manifest.json', description: 'Streaming catalogs', category: 'Streaming' },
  { name: 'WatchHub', url: 'https://watchhub.strem.io/manifest.json', description: 'Streaming availability', category: 'Catalog' },
  { name: 'OpenSubtitles v3', url: 'https://opensubtitles-v3.strem.io/manifest.json', description: 'Subtitles for content', category: 'Subtitles' },
  { name: 'YouTube', url: 'https://youtube.strem.fun/manifest.json', description: 'YouTube content', category: 'Catalog' },
];

export default function Addons() {
  const { showToast } = useToast();
  const [newAddonUrl, setNewAddonUrl] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const addons = useQuery(api.addons.getAddons);
  const addAddon = useMutation(api.addons.addAddon);
  const removeAddon = useMutation(api.addons.removeAddon);
  const toggleAddon = useMutation(api.addons.toggleAddon);

  const isLoading = addons === undefined;
  const addonList = addons ?? [];
  const activeCount = addonList.filter(a => a.active).length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddonUrl.trim()) return;
    try { new URL(newAddonUrl); } catch { showToast('Invalid URL', 'error'); return; }
    try {
      await addAddon({ url: newAddonUrl.trim() });
      showToast('Addon installed successfully', 'success');
      setNewAddonUrl('');
      setShowAddInput(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to add addon', 'error');
    }
  };

  const handleAddPopular = async (url: string) => {
    if (addonList.some(a => a.url === url)) {
      showToast('Addon already installed', 'info');
      return;
    }
    try {
      await addAddon({ url });
      showToast('Addon installed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add addon', 'error');
    }
  };

  const handleRemove = async (name: string, id: string) => {
    if (window.confirm(`Remove "${name || id}"?`)) {
      try {
        await removeAddon({ id: id as any });
        showToast('Addon removed', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to remove addon', 'error');
      }
    }
  };

  const defaultAddons = addonList.filter(a => a.isDefault);
  const customAddons = addonList.filter(a => !a.isDefault);

  return (
    <SettingsLayout
      title="Addons"
      subtitle="Install and manage Stremio addons for content streaming, metadata, and subtitles."
    >
      <div className="space-y-8">
        {/* ===== OVERVIEW CARD ===== */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-16 h-16 rounded-[20px] bg-exyo-red/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-exyo-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25-9.75 5.25-9.75-5.25 4.179-2.25" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-[20px] font-bold text-white">Addon Dashboard</h2>
              <p className="text-gray-500 text-[14px] mt-1">Manage your content sources and streaming providers</p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-[28px] font-black text-white leading-none">{addonList.length}</p>
                <p className="text-[12px] text-gray-500 mt-1.5 font-medium">Installed</p>
              </div>
              <div className="w-px bg-white/[0.06]" />
              <div className="text-center">
                <p className="text-[28px] font-black text-green-400 leading-none">{activeCount}</p>
                <p className="text-[12px] text-gray-500 mt-1.5 font-medium">Active</p>
              </div>
              <div className="w-px bg-white/[0.06]" />
              <div className="text-center">
                <p className="text-[28px] font-black text-white leading-none">Healthy</p>
                <p className="text-[12px] text-gray-500 mt-1.5 font-medium">Status</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== ADD CUSTOM ADDON ===== */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[22px] font-bold text-white">Install Custom Addon</h2>
              <p className="text-gray-500 text-[14px] mt-1">Add any Stremio-compatible addon via manifest URL</p>
            </div>
            <button
              onClick={() => setShowAddInput(!showAddInput)}
              className="bg-exyo-red text-white px-6 py-3 rounded-2xl font-bold text-[14px] hover:bg-exyo-red-dark transition-all duration-200 shadow-lg shadow-exyo-red/20 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Install
            </button>
          </div>
          <AnimatePresence>
            {showAddInput && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleAdd}
                className="overflow-hidden"
              >
                <div className="flex gap-3">
                  <input
                    type="url"
                    placeholder="https://example.com/manifest.json"
                    value={newAddonUrl}
                    onChange={(e) => setNewAddonUrl(e.target.value)}
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-white text-[15px] placeholder-gray-500 focus:outline-none focus:border-exyo-red/40 focus:bg-white/[0.06] transition-all"
                    required
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-exyo-red text-white px-8 py-4 rounded-2xl font-bold text-[15px] hover:bg-exyo-red-dark transition-all duration-200 shadow-lg shadow-exyo-red/20 flex-shrink-0"
                  >
                    Install
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </section>

        {/* ===== DEFAULT ADDONS ===== */}
        {defaultAddons.length > 0 && (
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-[22px] font-bold text-white">Pre-installed Addons</h2>
              <span className="text-[12px] text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg font-semibold">{defaultAddons.length}</span>
            </div>
            <div className="space-y-3">
              {defaultAddons.map((addon) => (
                <motion.div
                  key={addon._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[15px] text-white">{addon.name}</h3>
                      <p className="text-[13px] text-gray-500 truncate max-w-md mt-0.5">{addon.url}</p>
                    </div>
                  </div>
                  <span className="text-[13px] text-green-400 bg-green-500/10 px-3 py-1.5 rounded-xl flex-shrink-0 font-semibold">Active</span>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ===== CUSTOM ADDONS ===== */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[22px] font-bold text-white">Your Custom Addons</h2>
            <span className="text-[12px] text-gray-400 bg-white/[0.04] px-2.5 py-1 rounded-lg font-semibold">{customAddons.length}</span>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 shimmer rounded-2xl" />
              ))}
            </div>
          ) : customAddons.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="text-gray-400 text-[16px] font-medium mb-1">No custom addons installed</p>
              <p className="text-gray-600 text-[14px]">Click Install above or browse popular addons below</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {customAddons.map((addon) => (
                  <motion.div
                    key={addon._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <button
                        onClick={() => toggleAddon({ id: addon._id })}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          addon.active ? 'bg-green-500/10' : 'bg-white/[0.04]'
                        }`}
                      >
                        {addon.active ? (
                          <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <circle cx="12" cy="12" r="9" />
                          </svg>
                        )}
                      </button>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[15px] text-white">{addon.name || 'Custom Addon'}</h3>
                        <p className="text-[13px] text-gray-500 truncate max-w-md mt-0.5">{addon.url}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(addon.name || 'Custom Addon', addon._id)}
                      className="text-gray-600 hover:text-red-400 p-3 rounded-xl hover:bg-red-500/10 transition-colors ml-3 flex-shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* ===== POPULAR ADDONS ===== */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <h2 className="text-[22px] font-bold text-white mb-2">Popular Addons</h2>
          <p className="text-gray-500 text-[14px] mb-8">Browse and install recommended Stremio addons</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {POPULAR_ADDONS.map((addon) => {
              const isInstalled = addonList.some(a => a.url === addon.url);
              return (
                <motion.button
                  key={addon.url}
                  onClick={() => handleAddPopular(addon.url)}
                  disabled={isInstalled}
                  whileHover={!isInstalled ? { y: -2 } : undefined}
                  whileTap={!isInstalled ? { scale: 0.98 } : undefined}
                  className={`text-left p-6 rounded-2xl border transition-all duration-200 ${
                    isInstalled
                      ? 'bg-green-500/5 border-green-500/20 cursor-default'
                      : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-[16px] text-white">{addon.name}</h3>
                      <span className="text-[12px] text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-lg mt-1 inline-block">{addon.category}</span>
                    </div>
                    {isInstalled ? (
                      <span className="text-[13px] text-green-400 font-semibold bg-green-500/10 px-3 py-1 rounded-xl">Installed</span>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-[14px] text-gray-400 leading-relaxed">{addon.description}</p>
                </motion.button>
              );
            })}
          </div>
        </section>
      </div>
    </SettingsLayout>
  );
}
