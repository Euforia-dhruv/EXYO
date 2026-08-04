import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../convex/_generated/api';
import { useToast } from '../components/Toast';
import SettingsLayout from '../components/SettingsLayout';
import type { Id } from '../../convex/_generated/dataModel';

const CATEGORIES = ['All', 'Streaming', 'Metadata', 'Subtitles', 'Catalog'] as const;
type Category = typeof CATEGORIES[number];

const POPULAR_ADDONS = [
  { name: 'MediaFusion', url: 'https://mediafusion.elfhosted.com/manifest.json', description: 'Multi-source streaming with regional content. Free public instance available.', category: 'Streaming' as Category, tags: ['Free', 'Multi-source'] },
  { name: 'Comet', url: 'https://comet.elfhosted.com/manifest.json', description: 'Lightweight torrent addon. Free public instance, no account needed.', category: 'Streaming' as Category, tags: ['Free', 'Fast'] },
  { name: 'PenguPlay', url: 'https://pengu.uk', description: 'Free HTTP streams — no debrid needed. 4K, anime, regional content.', category: 'Streaming' as Category, tags: ['Free', 'HTTP'], configureUrl: 'https://pengu.uk' },
  { name: 'Flix-Streams', url: 'https://flixnest.app/flix-streams', description: 'HTTP-based streaming with anime, live TV, sports. Free tier available.', category: 'Streaming' as Category, tags: ['Free', 'HTTP'], configureUrl: 'https://flixnest.app/flix-streams' },
  { name: 'Cinemeta', url: 'https://v3-cinemeta.strem.io/manifest.json', description: 'Movies & TV shows with full metadata. Required for content discovery.', category: 'Metadata' as Category, tags: ['Required'] },
  { name: 'OpenSubtitles v3', url: 'https://opensubtitles-v3.strem.io/manifest.json', description: 'Subtitles in 50+ languages with auto-sync.', category: 'Subtitles' as Category, tags: ['Free'] },
  { name: 'YouTube', url: 'https://youtube.strem.fun/manifest.json', description: 'YouTube content integration', category: 'Catalog' as Category, tags: ['Free'] },
  { name: 'WatchHub', url: 'https://watchhub.strem.io/manifest.json', description: 'Streaming availability checker across services', category: 'Catalog' as Category, tags: ['Free'] },
];

function SkeletonRow() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/[0.06]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/[0.06] rounded-lg w-1/3" />
          <div className="h-3 bg-white/[0.04] rounded-lg w-1/2" />
        </div>
        <div className="w-16 h-8 bg-white/[0.06] rounded-xl" />
      </div>
    </div>
  );
}

export default function Streaming() {
  const { showToast } = useToast();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installUrl, setInstallUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const addons = useQuery(api.addons.getAddons);
  const addAddon = useMutation(api.addons.addAddon);
  const removeAddon = useMutation(api.addons.removeAddon);
  const toggleAddon = useMutation(api.addons.toggleAddon);

  const isLoading = addons === undefined;
  const addonList = addons ?? [];
  const activeCount = addonList.filter((a) => a.active).length;

  const filteredAddons = useMemo(() => {
    if (!searchQuery) return addonList;
    const q = searchQuery.toLowerCase();
    return addonList.filter(
      (a) =>
        (a.name ?? '').toLowerCase().includes(q) ||
        a.url.toLowerCase().includes(q)
    );
  }, [addonList, searchQuery]);

  const defaultAddons = filteredAddons.filter((a) => a.isDefault);
  const customAddons = filteredAddons.filter((a) => !a.isDefault);

  const filteredPopular = useMemo(() => {
    if (!searchQuery && activeCategory === 'All') return POPULAR_ADDONS;
    return POPULAR_ADDONS.filter((a) => {
      const matchesCategory = activeCategory === 'All' || a.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = installUrl.trim();
    if (!url) return;

    try {
      const result = await addAddon({ url });
      if (result.ok) {
        showToast(`${result.name ?? 'Addon'} installed successfully`, 'success');
        setInstallUrl('');
        setShowInstallModal(false);
      } else {
        showToast(result.error, 'error');
      }
    } catch (err) {
      showToast('Something went wrong. Please try again.', 'error');
    }
  };

  const handleInstallPopular = async (url: string, name: string) => {
    if (addonList.some((a) => a.url === url)) {
      showToast('Addon already installed', 'info');
      return;
    }
    try {
      const result = await addAddon({ url });
      if (result.ok) {
        showToast(`${name} installed`, 'success');
      } else {
        showToast(result.error, 'error');
      }
    } catch (err) {
      showToast('Something went wrong. Please try again.', 'error');
    }
  };

  const handleRemove = async (id: string, name: string) => {
    setRemovingId(id);
    try {
      const result = await removeAddon({ id: id as Id<'userAddons'> });
      if (result.ok) {
        showToast(`${name} removed`, 'success');
      } else {
        showToast(result.error, 'error');
      }
    } catch (err) {
      showToast('Failed to remove addon', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const result = await toggleAddon({ id: id as Id<'userAddons'> });
      if (result.ok) {
        showToast(result.active ? 'Addon enabled' : 'Addon disabled', 'info');
      } else {
        showToast(result.error, 'error');
      }
    } catch (err) {
      showToast('Failed to toggle addon', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <SettingsLayout
      title="Extensions"
      subtitle="Install and manage Stremio addons for content streaming, metadata, and subtitles."
    >
      <div className="space-y-8">
        {/* ─── OVERVIEW CARD ─── */}
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
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-exyo-red/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-exyo-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </div>
            <h2 className="text-[18px] font-bold text-white">How Streaming Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px] text-gray-400">
            <div className="bg-white/[0.03] rounded-xl p-4">
              <p className="text-white font-semibold mb-1">1. Install Addons</p>
              <p>Add free streaming addons like PenguPlay or Flix-Streams. These provide direct HTTP stream URLs that play instantly.</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4">
              <p className="text-white font-semibold mb-1">2. Browse & Play</p>
              <p>Find content on the home page or search. When you click play, EXYO fetches streams from all your active addons.</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4">
              <p className="text-white font-semibold mb-1">3. Choose Source</p>
              <p>Pick the best stream from multiple addons. HTTP streams play directly in the browser.</p>
            </div>
          </div>
        </section>

        {/* ─── DISCOVER 4K ADDONS ─── */}
        <section className="bg-gradient-to-br from-exyo-red/5 to-transparent border border-exyo-red/10 rounded-[24px] p-8 md:p-9">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-exyo-red/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">4K</span>
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-white">Discover 4K Addons</h2>
              <p className="text-[13px] text-gray-500">Free self-hosted addons for 4K streaming</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Torrent to Weblink */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-[15px] text-white">Torrent to Weblink</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-md font-medium">Free</span>
                    <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-md font-medium">4K HDR</span>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md font-medium">Self-host</span>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-gray-400 mb-3">40+ torrent sources, 4K HDR content. Self-host on Hugging Face Spaces (16GB RAM free).</p>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/Aswinajay/stremio-addon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded-lg transition-colors"
                >
                  GitHub &rarr;
                </a>
                <span className="text-[10px] text-gray-600">|</span>
                <span className="text-[10px] text-gray-500">Deploy to HF Spaces, then add URL</span>
              </div>
            </div>

            {/* Torrentio */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-[15px] text-white">Torrentio</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-md font-medium">Free</span>
                    <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-md font-medium">4K</span>
                    <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md font-medium">Popular</span>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-gray-400 mb-3">Most popular Stremio addon. Torrent-based, works in P2P mode or with debrid for instant streams.</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 bg-white/[0.04] px-2 py-1 rounded-lg font-mono">torrentio.strem.fun</span>
              </div>
            </div>

            {/* PenguPlay */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-[15px] text-white">PenguPlay</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-md font-medium">Free</span>
                    <span className="text-[10px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-md font-medium">HTTP</span>
                    <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-md font-medium">4K</span>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-gray-400 mb-3">Free HTTP streams, no debrid needed. 4K, anime, regional content. Requires account setup.</p>
              <div className="flex items-center gap-2">
                <a
                  href="https://pengu.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded-lg transition-colors"
                >
                  Configure &rarr;
                </a>
              </div>
            </div>

            {/* Flix-Streams */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-[15px] text-white">Flix-Streams</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-md font-medium">Free</span>
                    <span className="text-[10px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-md font-medium">HTTP</span>
                    <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded-md font-medium">Live TV</span>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-gray-400 mb-3">HTTP-based streaming with anime, live TV, sports. Free tier available. Requires account.</p>
              <div className="flex items-center gap-2">
                <a
                  href="https://flixnest.app/flix-streams"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded-lg transition-colors"
                >
                  Configure &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* Self-host guide */}
          <div className="mt-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[13px] text-gray-400">
              <span className="text-white font-semibold">Self-host Torrent to Weblink:</span>{' '}
              Deploy to{' '}
              <a href="https://huggingface.co/new-space" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Hugging Face Spaces</a>{' '}
              (16GB RAM free) or{' '}
              <a href="https://render.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Render.com</a>{' '}
              (512MB free). Use Docker with <code className="text-[11px] bg-white/[0.06] px-1.5 py-0.5 rounded">node:20-alpine</code>, clone the repo, run <code className="text-[11px] bg-white/[0.06] px-1.5 py-0.5 rounded">npm install && npm start</code>. Add the generated URL in EXYO.
            </p>
          </div>
        </section>

        {/* ─── SEARCH & FILTER ─── */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search addons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-12 pr-5 py-3.5 text-white text-[14px] placeholder-gray-500 focus:outline-none focus:border-exyo-red/40 focus:bg-white/[0.06] transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-exyo-red text-white'
                    : 'bg-white/[0.04] text-gray-500 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ─── INSTALL BUTTON ─── */}
        <button
          onClick={() => setShowInstallModal(true)}
          className="w-full bg-white/[0.03] border border-dashed border-white/[0.12] rounded-2xl p-5 flex items-center justify-center gap-3 text-gray-400 hover:text-white hover:bg-white/[0.06] hover:border-exyo-red/30 transition-all duration-200 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-[14px] font-medium">Install custom addon via URL</span>
        </button>

        {/* ─── INSTALLED: DEFAULTS ─── */}
        {defaultAddons.length > 0 && (
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-[22px] font-bold text-white">Pre-installed</h2>
              <span className="text-[12px] text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg font-semibold">
                {defaultAddons.length}
              </span>
            </div>
            <div className="space-y-3">
              {defaultAddons.map((addon, i) => (
                <motion.div
                  key={addon._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
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
                  <span className="text-[13px] text-green-400 bg-green-500/10 px-3 py-1.5 rounded-xl flex-shrink-0 font-semibold ml-4">
                    Active
                  </span>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ─── PRE-INSTALLED ─── */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[22px] font-bold text-white">Pre-installed</h2>
            <span className="text-[12px] text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg font-semibold">
              Always on
            </span>
          </div>
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[15px] text-white">Torrentio</h3>
                  <p className="text-[13px] text-gray-500 truncate max-w-md mt-0.5">Torrent-based streaming — works for all users automatically</p>
                </div>
              </div>
              <span className="text-[13px] text-green-400 bg-green-500/10 px-3 py-1.5 rounded-xl flex-shrink-0 font-semibold ml-4">
                Active
              </span>
            </motion.div>
          </div>
        </section>

        {/* ─── INSTALLED: CUSTOM ─── */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[22px] font-bold text-white">Your Addons</h2>
            <span className="text-[12px] text-gray-400 bg-white/[0.04] px-2.5 py-1 rounded-lg font-semibold">
              {customAddons.length}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : customAddons.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="text-gray-400 text-[16px] font-medium mb-1">No custom addons</p>
              <p className="text-gray-600 text-[14px]">Install one above or browse popular addons below</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {customAddons.map((addon, i) => (
                  <motion.div
                    key={addon._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggle(addon._id)}
                        disabled={togglingId === addon._id}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          addon.active
                            ? 'bg-green-500/10 hover:bg-green-500/20'
                            : 'bg-white/[0.04] hover:bg-white/[0.08]'
                        } ${togglingId === addon._id ? 'opacity-50' : ''}`}
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
                        <h3 className="font-semibold text-[15px] text-white">
                          {addon.name || 'Custom Addon'}
                        </h3>
                        <p className="text-[13px] text-gray-500 truncate max-w-md mt-0.5">{addon.url}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(addon._id, addon.name || 'Custom Addon')}
                      disabled={removingId === addon._id}
                      className={`text-gray-600 hover:text-red-400 p-3 rounded-xl hover:bg-red-500/10 transition-colors ml-3 flex-shrink-0 ${
                        removingId === addon._id ? 'opacity-50' : ''
                      }`}
                    >
                      {removingId === addon._id ? (
                        <div className="w-5 h-5 border-2 border-gray-600 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* ─── POPULAR / BROWSE ─── */}
        <section className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 md:p-9">
          <h2 className="text-[22px] font-bold text-white mb-2">Browse Addons</h2>
          <p className="text-gray-500 text-[14px] mb-8">Discover recommended Stremio addons</p>

          {filteredPopular.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-[15px]">No addons match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPopular.map((addon) => {
                const isInstalled = addonList.some((a) => a.url === addon.url);
                return (
                  <motion.button
                    key={addon.url}
                    onClick={() => handleInstallPopular(addon.url, addon.name)}
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
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[11px] text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-lg">
                            {addon.category}
                          </span>
                          {addon.tags?.map((tag) => (
                            <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                              tag === 'Required' ? 'text-blue-400 bg-blue-500/10' :
                              'text-green-400 bg-green-500/10'
                            }`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      {isInstalled ? (
                        <span className="text-[13px] text-green-400 font-semibold bg-green-500/10 px-3 py-1 rounded-xl">
                          Installed
                        </span>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-[14px] text-gray-400 leading-relaxed">{addon.description}</p>

                    <div className="flex items-center gap-2 mt-3">
                      {'configureUrl' in addon && addon.configureUrl && (
                        <a
                          href={addon.configureUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Configure &rarr;
                        </a>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </section>

        {/* ─── COMMUNITY LINK ─── */}
        <a
          href="https://stremio-addons.io"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-6 hover:bg-white/[0.04] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-white group-hover:text-exyo-red transition-colors">
                Browse Community Addons
              </h3>
              <p className="text-[13px] text-gray-500 mt-0.5">Explore 200+ community-built addons</p>
            </div>
            <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </a>
      </div>

      {/* ─── INSTALL MODAL ─── */}
      <AnimatePresence>
        {showInstallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowInstallModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-[#1A1A1A] border border-white/[0.08] rounded-3xl p-8 w-full max-w-lg shadow-2xl"
            >
              <button
                onClick={() => setShowInstallModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white p-2 rounded-xl hover:bg-white/[0.06] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-[22px] font-bold text-white mb-2">Install Addon</h2>
              <p className="text-gray-500 text-[14px] mb-6">Paste a Stremio addon manifest URL</p>

              <form onSubmit={handleInstall}>
                <div className="space-y-4">
                  <div>
                    <label className="text-[13px] text-gray-400 font-medium mb-2 block">Manifest URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/manifest.json"
                      value={installUrl}
                      onChange={(e) => setInstallUrl(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-[14px] placeholder-gray-600 focus:outline-none focus:border-exyo-red/40 focus:bg-white/[0.06] transition-all"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowInstallModal(false)}
                      className="px-5 py-2.5 rounded-xl text-[14px] font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!installUrl.trim()}
                      className="bg-exyo-red text-white px-6 py-2.5 rounded-xl text-[14px] font-bold hover:bg-exyo-red-dark transition-all duration-200 shadow-lg shadow-exyo-red/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Install
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SettingsLayout>
  );
}
