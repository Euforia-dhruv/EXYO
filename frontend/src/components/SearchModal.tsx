import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { contentApi, type ContentSearchResult } from '../api/content.api';

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data } = useQuery({
    queryKey: ['search-modal', query],
    queryFn: () => contentApi.search(query),
    enabled: query.length >= 2,
  });

  const results: ContentSearchResult['results'] = data?.results || [];

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onClose]);

  const handleSelect = useCallback(
    (item: ContentSearchResult['results'][0]) => {
      const id = item.id || item.imdbId || '';
      const isTv = item.type === 'tv' || item.type === 'series';
      navigate(isTv ? `/series/${id}` : `/movie/${id}`);
      onClose();
      setQuery('');
    },
    [navigate, onClose]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-start justify-center pt-[10vh]"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={onClose} />

          <motion.div
            initial={{ y: -30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl mx-4"
          >
            {/* Search input */}
            <div className="glass glass-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <Search className="w-5 h-5 text-white/30 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search movies, series, anime..."
                  className="flex-1 bg-transparent text-white text-base placeholder-white/30 focus:outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-white/30 hover:text-white/60">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="border-t border-white/[0.06] max-h-[50vh] overflow-y-auto">
                  {results.slice(0, 10).map((item, i) => (
                    <button
                      key={item.id || item.imdbId || i}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-4 px-5 py-3 hover:bg-white/[0.04] transition-colors text-left"
                    >
                      {item.posterUrl ? (
                        <img src={item.posterUrl} alt="" className="w-10 h-14 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-14 rounded-lg bg-elevated shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {item.name || item.title}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {[item.type, item.year].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query.length >= 2 && results.length === 0 && (
                <div className="border-t border-white/[0.06] px-5 py-8 text-center">
                  <p className="text-white/30 text-sm">No results found</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
