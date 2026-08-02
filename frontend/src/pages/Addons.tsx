import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import { api } from '../../convex/_generated/api';
import { useToast } from '../components/Toast';

const POPULAR_ADDONS = [
  { name: 'Cinemeta', url: 'https://v3-cinemeta.strem.io/manifest.json', description: 'Movies & TV shows with metadata' },
  { name: 'Torrentio', url: 'https://torrentio.strem.fun/manifest.json', description: 'Torrent-based streaming' },
  { name: 'NoTorrent', url: 'https://addon.notorrent2.workers.dev/manifest.json', description: 'Streaming catalogs' },
  { name: 'WatchHub', url: 'https://watchhub.strem.io/manifest.json', description: 'Streaming availability' },
  { name: 'OpenSubtitles v3', url: 'https://opensubtitles-v3.strem.io/manifest.json', description: 'Subtitles for content' },
  { name: 'YouTube', url: 'https://youtube.strem.fun/manifest.json', description: 'YouTube content' },
];

export default function Addons() {
  const { showToast } = useToast();
  const [newAddonUrl, setNewAddonUrl] = useState('');

  const addons = useQuery(api.addons.getAddons);
  const addAddon = useMutation(api.addons.addAddon);
  const removeAddon = useMutation(api.addons.removeAddon);
  const toggleAddon = useMutation(api.addons.toggleAddon);

  const isLoading = addons === undefined;
  const addonList = addons ?? [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddonUrl.trim()) return;
    try { new URL(newAddonUrl); } catch { showToast('Invalid URL', 'error'); return; }
    try {
      await addAddon({ url: newAddonUrl.trim() });
      showToast('Addon added successfully', 'success');
      setNewAddonUrl('');
    } catch (err: any) {
      showToast(err.message || 'Failed to add addon', 'error');
    }
  };

  const handleAddPopular = async (url: string) => {
    if (addonList.some(a => a.url === url)) {
      showToast('Addon already added', 'info');
      return;
    }
    try {
      await addAddon({ url });
      showToast('Addon added', 'success');
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
    <div className="min-h-screen bg-exyo-dark pt-[100px] px-5 md:px-10 lg:px-14 pb-16">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <Link to="/settings" className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">Addons</h1>
              <p className="text-gray-400 text-sm mt-1.5">Manage your Stremio addons for content streaming</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="md:w-56 flex-shrink-0">
              <nav className="flex md:flex-row gap-1 lg:gap-2">
                <Link to="/settings" className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[14px] font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                  <span className="text-lg">👤</span>
                  Profile
                </Link>
                <Link to="/settings/addons" className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[14px] font-semibold bg-white/10 text-white transition-all">
                  <span className="text-lg">🔌</span>
                  Addons
                </Link>
              </nav>
            </aside>

            <div className="flex-1 min-w-0 space-y-6">
              {/* Default Addons */}
              {defaultAddons.length > 0 && (
                <section className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold">Default Addons</h2>
                    <span className="text-[11px] text-gray-500 bg-white/5 px-2.5 py-1 rounded-xl">Pre-installed</span>
                  </div>
                  <div className="space-y-2">
                    {defaultAddons.map((addon) => (
                      <div key={addon._id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{addon.name}</h3>
                            <span className="text-[12px] text-gray-500 truncate max-w-xs block">{addon.url}</span>
                          </div>
                        </div>
                        <span className="text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-xl flex-shrink-0 font-medium">Active</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Add Custom Addon */}
              <section className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8">
                <h2 className="text-lg font-bold mb-5">Add Custom Addon</h2>
                <form onSubmit={handleAdd} className="flex gap-3">
                  <input
                    type="url"
                    placeholder="https://example.com/manifest.json"
                    value={newAddonUrl}
                    onChange={(e) => setNewAddonUrl(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-exyo-red/50 transition-all"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-exyo-red text-white px-7 py-3.5 rounded-2xl font-bold text-sm hover:bg-exyo-red-dark transition-colors disabled:opacity-50 flex-shrink-0 shadow-lg shadow-exyo-red/20"
                  >
                    Add
                  </button>
                </form>
              </section>

              {/* Custom Addons */}
              <section className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8">
                <h2 className="text-lg font-bold mb-5">Your Custom Addons ({customAddons.length})</h2>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-18 shimmer rounded-2xl" />)}
                  </div>
                ) : customAddons.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 text-sm">No custom addons yet. Add one above or pick from popular addons below.</p>
                ) : (
                  <div className="space-y-2">
                    {customAddons.map((addon) => (
                      <motion.div
                        key={addon._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => toggleAddon({ id: addon._id })}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                              addon.active ? 'bg-green-500/10' : 'bg-white/5'
                            }`}
                          >
                            {addon.active ? (
                              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                              </svg>
                            )}
                          </button>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm">{addon.name || 'Custom Addon'}</h3>
                            <p className="text-[12px] text-gray-500 truncate max-w-xs mt-0.5">{addon.url}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(addon.name || 'Custom Addon', addon._id)}
                          className="text-gray-500 hover:text-red-400 p-2.5 rounded-xl hover:bg-red-500/10 transition-colors ml-3 flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              {/* Popular Addons */}
              <section className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8">
                <h2 className="text-lg font-bold mb-5">Popular Addons</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {POPULAR_ADDONS.map((addon) => {
                    const isAdded = addonList.some(a => a.url === addon.url);
                    return (
                      <button
                        key={addon.url}
                        onClick={() => handleAddPopular(addon.url)}
                        disabled={isAdded}
                        className={`text-left p-5 rounded-2xl border transition-all ${
                          isAdded
                            ? 'bg-green-500/5 border-green-500/20 cursor-default'
                            : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/10 hover:border-white/10 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">{addon.name}</h3>
                          {isAdded ? (
                            <span className="text-xs text-green-400 font-medium">Added</span>
                          ) : (
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </div>
                        <p className="text-[12px] text-gray-500 mt-1.5">{addon.description}</p>
                        <p className="text-[11px] text-gray-600 mt-2 truncate">{addon.url}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
