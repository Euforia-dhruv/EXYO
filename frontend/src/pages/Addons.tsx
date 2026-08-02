import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { addonApi, type UserAddon } from '../api/addon.api';
import { useToast } from '../components/Toast';

const POPULAR_ADDONS = [
  { name: 'Cinemeta', url: 'https://v3-cinemeta.strem.io/manifest.json', description: 'Movies & TV shows with metadata' },
  { name: 'Torrentio', url: 'https://torrentio.strem.fun/manifest.json', description: 'Torrent-based streaming' },
  { name: 'YouTube', url: 'https://youtube.strem.fun/manifest.json', description: 'YouTube content' },
  { name: 'OpenSubtitles', url: 'https://opensubtitles.strem.fun/manifest.json', description: 'Subtitle provider' },
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
    onError: () => showToast('Failed to remove addon', 'error'),
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

  return (
    <div className="min-h-screen pt-24 px-6 md:px-12 pb-12">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold mb-2">Addons</h1>
          <p className="text-gray-500 mb-8">Add Stremio addons to enable content streaming and metadata.</p>

          {/* Add Addon Form */}
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

          {/* Your Addons */}
          <section className="mb-8 bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Your Addons ({addons.length})</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            ) : addons.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No addons added yet. Add one above or pick from popular addons below.</p>
            ) : (
              <div className="space-y-3">
                {addons.map((addon) => (
                  <motion.div
                    key={addon.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{addon.name || 'Custom Addon'}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${addon.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-500'}`}>
                          {addon.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-1">{addon.url}</p>
                      <p className="text-xs text-gray-600 mt-0.5">Added {new Date(addon.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove "${addon.name || addon.url}"?`)) removeMutation.mutate(addon.id);
                      }}
                      className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors ml-3 flex-shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
