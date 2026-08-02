import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useConvexQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import { contentApi } from '../api/content.api';
import { SkeletonGrid } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useDebounce } from '../hooks/useDebounce';
import type { CatalogItem } from '../types';

const QUICK_SEARCHES = ['Stranger Things', 'Breaking Bad', 'The Witcher', 'Narcos', 'Dark'];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
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
    <div className="min-h-screen pt-24 px-6 md:px-12">
      <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-12">
        <div className="relative">
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search titles, genres, people..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
            autoFocus
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearchParams({}); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent</h2>
                <button
                  onClick={() => clearHistoryMutation({})}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 8).map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleQuickSearch(item.query)}
                    className="px-4 py-2 bg-white/5 rounded-full text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/5"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item.query}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {QUICK_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => handleQuickSearch(term)}
                  className="px-4 py-2 bg-white/5 rounded-full text-sm text-gray-300 hover:bg-white/10 transition-colors border border-white/5"
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
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-lg font-bold mb-6">
              {isLoading ? 'Searching...' : `Results for "${query}"`}
            </h2>

            {isLoading ? (
              <SkeletonGrid count={10} />
            ) : results.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/detail/${item.id}?type=${item.type}`)}
                    className="cursor-pointer group"
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2 relative bg-gray-800">
                      <img
                        src={item.poster || item.background || '/placeholder.svg'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="flex items-center gap-2">
                          {item.imdbRating && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                              {item.imdbRating}
                            </span>
                          )}
                          {item.year && <span className="text-xs text-gray-400">{item.year}</span>}
                        </div>
                      </div>
                    </div>
                    <h3 className="font-medium text-sm truncate group-hover:text-white transition-colors">{item.name}</h3>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-400 text-lg mb-2">No results found for &quot;{query}&quot;</p>
                <p className="text-gray-600 text-sm">Try different keywords or check your spelling</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
