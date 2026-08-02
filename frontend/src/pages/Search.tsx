import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useConvexQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import { contentApi } from '../api/content.api';
import { SkeletonGrid } from '../components/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import type { CatalogItem } from '../types';

const QUICK_SEARCHES = ['Stranger Things', 'Breaking Bad', 'The Witcher', 'Narcos', 'Dark'];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useDebounce(searchInput, 500);

  const searchHistory = useConvexQuery(api.searchHistory.getSearchHistory);
  const saveSearchMutation = useMutation(api.searchHistory.saveSearch);
  const clearHistoryMutation = useMutation(api.searchHistory.clearSearchHistory);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch !== query) {
      setSearchParams({ q: debouncedSearch });
      saveSearchMutation({ query: debouncedSearch });
    }
  }, [debouncedSearch, query]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: results = [], isLoading } = useQuery<CatalogItem[]>({
    queryKey: ['search', query],
    queryFn: () => contentApi.search(query),
    enabled: !!query,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
      saveSearchMutation({ query: searchInput.trim() });
    }
  };

  const handleQuickSearch = (term: string) => {
    setSearchInput(term);
    setSearchParams({ q: term });
    saveSearchMutation({ query: term });
  };

  return (
    <div className="min-h-screen bg-exyo-dark pt-[80px] px-4 md:px-8 lg:px-12">
      <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-10">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-exyo-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Titles, genres, people"
            className="w-full bg-white/5 border border-exyo-border rounded-netflix px-12 py-3.5 text-white text-sm placeholder-exyo-muted focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
            autoFocus
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearchParams({}); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-exyo-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {!query && (
        <div className="max-w-3xl mx-auto">
          {searchHistory && searchHistory.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-exyo-muted uppercase tracking-wider">Recent</h2>
                <button
                  onClick={() => clearHistoryMutation({})}
                  className="text-xs text-exyo-muted hover:text-white transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 8).map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleQuickSearch(item.query)}
                    className="px-4 py-2 bg-white/5 rounded-netflix text-sm text-exyo-gray/70 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2 border border-exyo-border"
                  >
                    <svg className="w-3.5 h-3.5 text-exyo-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item.query}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xs font-bold text-exyo-muted uppercase tracking-wider mb-4">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {QUICK_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => handleQuickSearch(term)}
                  className="px-4 py-2 bg-white/5 rounded-netflix text-sm text-exyo-gray/70 hover:bg-white/10 hover:text-white transition-colors border border-exyo-border"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {query && (
          <motion.div
            key={query}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-bold mb-5">
              {isLoading ? 'Searching...' : `Results for "${query}"`}
            </h2>

            {isLoading ? (
              <SkeletonGrid count={10} />
            ) : results.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {results.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => navigate(`/detail/${item.id}?type=${item.type}`)}
                    className="cursor-pointer group"
                  >
                    <div className="aspect-[16/9] rounded-netflix overflow-hidden mb-1.5 relative bg-exyo-secondary">
                      <img
                        src={item.poster || item.background || '/placeholder.svg'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                        <div className="flex items-center gap-1.5">
                          {item.imdbRating && (
                            <span className="flex items-center gap-0.5 text-[11px] font-bold text-yellow-400">
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                              {item.imdbRating}
                            </span>
                          )}
                          {item.year && <span className="text-[11px] text-exyo-gray/60">{item.year}</span>}
                        </div>
                      </div>
                    </div>
                    <h3 className="font-medium text-[13px] truncate group-hover:text-white text-exyo-gray/80 transition-colors">{item.name}</h3>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <svg className="w-16 h-16 mx-auto text-exyo-muted/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-exyo-gray text-lg mb-2 font-medium">No results found for &quot;{query}&quot;</p>
                <p className="text-exyo-muted text-sm">Try different keywords or check your spelling</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
