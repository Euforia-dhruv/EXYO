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
    <div className="min-h-screen bg-exyo-dark pt-[80px] px-4 md:px-8 lg:px-12 pb-12">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center gap-3 mb-8">
            <Link to="/settings" className="p-2 hover:bg-white/10 rounded transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Addons</h1>
              <p className="text-exyo-muted text-sm mt-1">Manage your Stremio addons for content streaming.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="md:w-48 flex-shrink-0">
              <nav className="flex md:flex-col gap-0.5">
                <Link to="/settings" className="px-4 py-2.5 text-sm font-medium rounded-netflix text-exyo-muted hover:text-white hover:bg-white/5 transition-colors">
                  Profile
                </Link>
                <Link to="/settings/addons" className="px-4 py-2.5 text-sm font-medium rounded-netflix bg-white/10 text-white transition-colors">
                  Addons
                </Link>
              </nav>
            </aside>

            <div className="flex-1 min-w-0 space-y-6">
              {/* Default Addons */}
              {defaultAddons.length > 0 && (
                <section className="bg-exyo-secondary border border-exyo-border rounded-netflix p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-exyo-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h2 className="text-lg font-semibold">Default Addons</h2>
                    <span className="text-[11px] text-exyo-muted bg-white/5 px-2 py-0.5 rounded-full">Pre-installed</span>
                  </div>
                  <div className="space-y-2">
                    {defaultAddons.map((addon) => (
                      <div key={addon._id} className="flex items-center justify-between bg-white/5 border border-exyo-border rounded-netflix p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-exyo-red/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-exyo-red" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">{addon.name}</h3>
                            <span className="text-xs text-exyo-muted truncate max-w-xs block">{addon.url}</span>
                          </div>
                        </div>
                        <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full flex-shrink-0">Active</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Add Custom Addon */}
              <section className="bg-exyo-secondary border border-exyo-border rounded-netflix p-6">
                <h2 className="text-lg font-semibold mb-4">Add Custom Addon</h2>
                <form onSubmit={handleAdd} className="flex gap-3">
                  <input
                    type="url"
                    placeholder="https://example.com/manifest.json"
                    value={newAddonUrl}
                    onChange={(e) => setNewAddonUrl(e.target.value)}
                    className="flex-1 bg-exyo-secondary border border-exyo-border rounded-netflix px-4 py-3 text-white text-sm placeholder-exyo-muted focus:outline-none focus:border-white/30 transition-all"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-exyo-red text-white px-6 py-3 rounded-netflix font-bold text-sm hover:bg-exyo-red-dark transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    Add
                  </button>
                </form>
              </section>

              {/* Custom Addons */}
              <section className="bg-exyo-secondary border border-exyo-border rounded-netflix p-6">
                <h2 className="text-lg font-semibold mb-4">Your Custom Addons ({customAddons.length})</h2>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-16 shimmer rounded-netflix" />)}
                  </div>
                ) : customAddons.length === 0 ? (
                  <p className="text-exyo-muted text-center py-6 text-sm">No custom addons yet. Add one above or pick from popular addons below.</p>
                ) : (
                  <div className="space-y-2">
                    {customAddons.map((addon) => (
                      <motion.div
                        key={addon._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between bg-white/5 border border-exyo-border rounded-netflix p-4"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => toggleAddon({ id: addon._id })}
                            className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                              addon.active ? 'bg-green-500/10' : 'bg-white/5'
                            }`}
                          >
                            {addon.active ? (
                              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-exyo-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                              </svg>
                            )}
                          </button>
                          <div className="min-w-0">
                            <h3 className="font-medium text-sm">{addon.name || 'Custom Addon'}</h3>
                            <p className="text-xs text-exyo-muted truncate max-w-xs mt-0.5">{addon.url}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(addon.name || 'Custom Addon', addon._id)}
                          className="text-exyo-muted hover:text-red-400 p-2 rounded hover:bg-red-500/10 transition-colors ml-3 flex-shrink-0"
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
              <section className="bg-exyo-secondary border border-exyo-border rounded-netflix p-6">
                <h2 className="text-lg font-semibold mb-4">Popular Addons</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {POPULAR_ADDONS.map((addon) => {
                    const isAdded = addonList.some(a => a.url === addon.url);
                    return (
                      <button
                        key={addon.url}
                        onClick={() => handleAddPopular(addon.url)}
                        disabled={isAdded}
                        className={`text-left p-4 rounded-netflix border transition-all ${
                          isAdded
                            ? 'bg-green-500/5 border-green-500/20 cursor-default'
                            : 'bg-white/5 border-exyo-border hover:bg-white/10 hover:border-white/10 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">{addon.name}</h3>
                          {isAdded ? (
                            <span className="text-xs text-green-400 font-medium">Added</span>
                          ) : (
                            <svg className="w-4 h-4 text-exyo-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-exyo-muted mt-1">{addon.description}</p>
                        <p className="text-xs text-exyo-muted/60 mt-2 truncate">{addon.url}</p>
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
