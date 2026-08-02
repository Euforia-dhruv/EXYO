import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { addonApi, type UserAddon } from '../api/addon.api';
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
  const { user } = useUser();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [newAddonUrl, setNewAddonUrl] = useState('');

  const { data: addons = [], isLoading } = useQuery<UserAddon[]>({
    queryKey: ['addons'],
    queryFn: addonApi.getAddons,
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: (url: string) => addonApi.addAddon(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addons'] });
      showToast('Addon added successfully', 'success');
      setNewAddonUrl('');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Failed to add addon', 'error');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => addonApi.removeAddon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addons'] });
      showToast('Addon removed', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Failed to remove addon', 'error');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => addonApi.toggleAddon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addons'] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Failed to toggle addon', 'error');
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddonUrl.trim()) return;
    try { new URL(newAddonUrl); } catch { showToast('Invalid URL', 'error'); return; }
    addMutation.mutate(newAddonUrl.trim());
  };

  const handleAddPopular = (url: string) => {
    if (addons.some(a => a.url === url)) {
      showToast('Addon already added', 'info');
      return;
    }
    addMutation.mutate(url);
  };

  const defaultAddons = addons.filter(a => a.isDefault);
  const customAddons = addons.filter(a => !a.isDefault);

  return (
    <div className="min-h-screen pt-24 px-6 md:px-12 pb-12">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold mb-2">Addons</h1>
          <p className="text-gray-500 mb-8">Manage your Stremio addons for content streaming and metadata.</p>

          {/* Default Addons */}
          {defaultAddons.length > 0 && (
            <section className="mb-8 bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h2 className="text-lg font-semibold">Default Addons</h2>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">Pre-installed</span>
              </div>
              <div className="space-y-2">
                {defaultAddons.map((addon) => (
                  <div key={addon.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E50914]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[#E50914]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{addon.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 truncate max-w-xs">{addon.url}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full flex-shrink-0">Active</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Add Custom Addon */}
          <section className="mb-8 bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Add Custom Addon</h2>
            <form onSubmit={handleAdd} className="flex gap-3">
              <input
                type="url"
                placeholder="https://example.com/manifest.json"
                value={newAddonUrl}
                onChange={(e) => setNewAddonUrl(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                required
              />
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="bg-[#E50914] text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {addMutation.isPending ? 'Adding...' : 'Add'}
              </button>
            </form>
          </section>

          {/* Custom Addons */}
          <section className="mb-8 bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Your Custom Addons ({customAddons.length})</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            ) : customAddons.length === 0 ? (
              <p className="text-gray-500 text-center py-6 text-sm">No custom addons yet. Add one above or pick from popular addons below.</p>
            ) : (
              <div className="space-y-3">
                {customAddons.map((addon) => (
                  <motion.div
                    key={addon.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggleMutation.mutate(addon.id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          addon.active ? 'bg-green-500/10' : 'bg-white/5'
                        }`}
                      >
                        {addon.active ? (
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                          </svg>
                        )}
                      </button>
                      <div>
                        <h3 className="font-medium text-sm">{addon.name || 'Custom Addon'}</h3>
                        <p className="text-xs text-gray-500 truncate max-w-xs mt-0.5">{addon.url}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove "${addon.name || addon.url}"?`)) removeMutation.mutate(addon.id);
                      }}
                      className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors ml-3 flex-shrink-0"
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
          <section className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Popular Addons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {POPULAR_ADDONS.map((addon) => {
                const isAdded = addons.some(a => a.url === addon.url);
                return (
                  <button
                    key={addon.url}
                    onClick={() => handleAddPopular(addon.url)}
                    disabled={isAdded || addMutation.isPending}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isAdded
                        ? 'bg-green-500/5 border-green-500/20 cursor-default'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">{addon.name}</h3>
                      {isAdded ? (
                        <span className="text-xs text-green-400">Added</span>
                      ) : (
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{addon.description}</p>
                    <p className="text-xs text-gray-600 mt-2 truncate">{addon.url}</p>
                  </button>
                );
              })}
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
