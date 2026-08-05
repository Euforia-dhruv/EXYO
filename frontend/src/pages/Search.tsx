import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlassIcon, XMarkIcon, FilmIcon, TvIcon } from '@heroicons/react/24/outline';
import { contentApi } from '../api/content.api';
import Thumbnail from '../components/Thumbnail';
import { SearchSkeleton } from '../components/Skeleton';
import { cn } from '../utils/helpers';
import type { CatalogItem } from '../types';

type SearchType = 'all' | 'movie' | 'tv';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as SearchType) || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>(initialType);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim()) {
        setSearchParams({ q: query.trim(), type: searchType });
      } else {
        setSearchParams({ type: searchType });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, searchType, setSearchParams]);

  // Search query
  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, searchType],
    queryFn: () => {
      if (!debouncedQuery.trim()) return { results: [] };
      const types: ('movie' | 'tv')[] = searchType === 'all' ? ['movie', 'tv'] : [searchType as 'movie' | 'tv'];
      return contentApi.searchByName(debouncedQuery, { type: types.length === 1 ? types[0] : undefined, limit: 40 });
    },
    enabled: true,
  });

  const results: CatalogItem[] = (data && 'results' in data && Array.isArray(data.results))
    ? data.results.map((item: { id?: string; imdbId?: string; name?: string; title?: string; posterUrl?: string; type?: string; year?: string; rating?: number }) => ({
        id: item.id || item.imdbId || '',
        imdbId: item.imdbId,
        name: item.name,
        title: item.title,
        posterUrl: item.posterUrl,
        type: item.type as 'movie' | 'tv' | undefined,
        year: item.year,
        rating: item.rating,
      }))
    : [];

  const handleClear = useCallback(() => {
    setQuery('');
    setSearchParams({});
    inputRef.current?.focus();
  }, [setSearchParams]);

  const searchTypes: { value: SearchType; label: string; icon: typeof FilmIcon }[] = [
    { value: 'all', label: 'All', icon: MagnifyingGlassIcon },
    { value: 'movie', label: 'Movies', icon: FilmIcon },
    { value: 'tv', label: 'TV Shows', icon: TvIcon },
  ];

  return (
    <main className="min-h-screen pt-6 pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Search header */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto mb-6">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, TV shows, anime..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-12 pr-12 py-4 text-white text-[15px] placeholder-white/30 focus:outline-none focus:border-exyo-red/40 focus:ring-1 focus:ring-exyo-red/20 transition-all duration-200"
              aria-label="Search"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="flex items-center justify-center gap-2">
            {searchTypes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSearchType(value)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 border',
                  searchType === value
                    ? 'bg-white/[0.08] border-white/[0.12] text-white'
                    : 'bg-transparent border-white/[0.06] text-white/45 hover:text-white/70 hover:bg-white/[0.03]'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <SearchSkeleton />
        ) : !debouncedQuery.trim() ? (
          <div className="text-center py-20">
            <MagnifyingGlassIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-[14px]">Start typing to search...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/50 text-[15px] font-medium mb-1">No results found</p>
            <p className="text-white/30 text-[13px]">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {results.map((item, i) => (
              <Thumbnail key={item.id || i} item={item} size="md" />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
