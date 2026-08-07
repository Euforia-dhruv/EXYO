import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';
import { ELogo } from '../components/Logo';
import { contentApi } from '../api/content.api';
import Card from '../components/Card';
import { RowSkeleton } from '../components/Skeleton';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => contentApi.search(query),
    enabled: query.length >= 2,
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const results = useMemo(() => {
    const items = data?.results || [];
    const typePriority: Record<string, number> = { movie: 0, tv: 1, series: 1, anime: 2 };
    return [...items].sort((a, b) => {
      const pa = typePriority[a.type || 'movie'] ?? 1;
      const pb = typePriority[b.type || 'movie'] ?? 1;
      return pa - pb;
    });
  }, [data]);

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-white text-3xl font-extrabold tracking-tight">
            {query ? `Results for "${query}"` : 'Search'}
          </h1>
          {results.length > 0 && (
            <p className="text-white/40 text-sm mt-2">{results.length} results found</p>
          )}
        </motion.div>

        {isLoading ? (
          <RowSkeleton />
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="opacity-20 mb-6">
              <ELogo size={80} animate />
            </div>
            <p className="text-white/40 text-lg font-medium mb-2">
              {query ? 'No results found' : 'Start typing to search'}
            </p>
            <p className="text-white/20 text-sm">
              {query ? 'Try a different search term' : 'Movies, series, anime and more'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {results.map((item, i) => (
              <Card key={item.id || item.imdbId || i} item={item} index={i} size="md" />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
