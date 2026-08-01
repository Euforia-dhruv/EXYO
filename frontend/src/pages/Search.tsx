import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../api/content.api';
import { searchApi } from '../api/search.api';
import { SkeletonGrid } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useDebounce } from '../hooks/useDebounce';
import type { CatalogItem, SearchHistory } from '../types';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch !== query) {
      setSearchParams({ q: debouncedSearch });
      saveSearchMutation.mutate(debouncedSearch);
    }
  }, [debouncedSearch, query, setSearchParams]);

  const { data: searchHistory = [] } = useQuery<SearchHistory[]>({
    queryKey: ['searchHistory'],
    queryFn: searchApi.getSearchHistory
  });

  const { data: results = [], isLoading } = useQuery<CatalogItem[]>({
    queryKey: ['search', query],
    queryFn: () => contentApi.search(query),
    enabled: !!query
  });

  const saveSearchMutation = useMutation({
    mutationFn: searchApi.saveSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    }
  });

  const clearHistoryMutation = useMutation({
    mutationFn: searchApi.clearSearchHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
      showToast('Search history cleared', 'success');
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
      saveSearchMutation.mutate(searchInput.trim());
    }
  };

  const handleHistoryClick = (searchQuery: string) => {
    setSearchInput(searchQuery);
    setSearchParams({ q: searchQuery });
  };

  return (
    <div className="min-h-screen pt-24 px-4 md:px-12">
      <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-12">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search titles, genres, people..."
            className="w-full bg-exyo-secondary border border-white/20 rounded-lg px-6 py-4 pl-14 text-lg text-white placeholder-exyo-gray focus:outline-none focus:border-white/40"
            autoFocus
          />
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-exyo-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchParams({});
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {!query && searchHistory.length > 0 && (
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Searches</h2>
            <button
              onClick={() => clearHistoryMutation.mutate()}
              disabled={clearHistoryMutation.isPending}
              className="text-sm text-exyo-gray hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => handleHistoryClick(item.query)}
                className="px-4 py-2 bg-exyo-secondary rounded-full text-sm hover:bg-exyo-hover transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-exyo-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {item.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {query && (
        <div>
          <h2 className="text-lg font-semibold mb-6">
            {isLoading ? 'Searching...' : `Results for "${query}"`}
          </h2>

          {isLoading ? (
            <SkeletonGrid count={10} />
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/detail/${item.id}?type=${item.type}`)}
                  className="cursor-pointer group"
                >
                  <div className="aspect-video rounded overflow-hidden mb-2 relative">
                    <img
                      src={item.poster || item.background || '/placeholder.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-medium text-sm truncate group-hover:text-exyo-gray transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-exyo-gray">
                    {item.year} {item.imdbRating && `• ⭐ ${item.imdbRating}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-exyo-gray mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-exyo-gray text-lg">No results found for &quot;{query}&quot;</p>
              <p className="text-exyo-gray text-sm mt-2">Try different keywords or check your spelling</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
