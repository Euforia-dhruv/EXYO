import { useQuery } from '@tanstack/react-query';
import { contentApi } from '../api/content.api';
import ContentRow from '../components/ContentRow';
import { RowSkeleton } from '../components/Skeleton';
import { FilmIcon } from '@heroicons/react/24/outline';
import type { CatalogItem } from '../types';

const extractItems = (data: unknown): CatalogItem[] => {
  if (!data) return [];
  if (typeof data === 'object' && data !== null && 'results' in data && Array.isArray((data as { results: unknown }).results)) {
    return ((data as { results: Array<{ id?: string; imdbId?: string; name?: string; title?: string; posterUrl?: string; type?: string; year?: string; rating?: number }> }).results).map((item) => ({
      id: item.id || item.imdbId || '',
      imdbId: item.imdbId,
      name: item.name,
      title: item.title,
      posterUrl: item.posterUrl,
      type: item.type as 'movie' | 'tv' | undefined,
      year: item.year,
      rating: item.rating,
    }));
  }
  return [];
};

export default function Movies() {
  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['cinemeta', 'movies', 'trending'],
    queryFn: () => contentApi.searchByName('trending movies', { type: 'movie', limit: 20 }),
  });

  const { data: popular, isLoading: popularLoading } = useQuery({
    queryKey: ['cinemeta', 'movies', 'popular'],
    queryFn: () => contentApi.searchByName('popular movies', { type: 'movie', limit: 20 }),
  });

  const { data: topRated, isLoading: topRatedLoading } = useQuery({
    queryKey: ['cinemeta', 'movies', 'top-rated'],
    queryFn: () => contentApi.searchByName('top rated movies', { type: 'movie', limit: 20 }),
  });

  const { data: latest, isLoading: latestLoading } = useQuery({
    queryKey: ['cinemeta', 'movies', 'latest'],
    queryFn: () => contentApi.searchByName('latest movies', { type: 'movie', limit: 20 }),
  });

  return (
    <main className="min-h-screen pt-8 pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3 mb-8">
          <FilmIcon className="w-7 h-7 text-exyo-red" />
          <h1 className="text-white text-[28px] sm:text-[32px] font-bold tracking-tight">Movies</h1>
        </div>

        <div className="space-y-10">
          {trendingLoading ? <RowSkeleton /> : (
            extractItems(trending).length > 0 && <ContentRow title="Trending Movies" items={extractItems(trending)} size="md" />
          )}
          {popularLoading ? <RowSkeleton /> : (
            extractItems(popular).length > 0 && <ContentRow title="Popular Movies" items={extractItems(popular)} size="md" />
          )}
          {latestLoading ? <RowSkeleton /> : (
            extractItems(latest).length > 0 && <ContentRow title="Latest Movies" items={extractItems(latest)} size="md" />
          )}
          {topRatedLoading ? <RowSkeleton /> : (
            extractItems(topRated).length > 0 && <ContentRow title="Top Rated Movies" items={extractItems(topRated)} size="md" />
          )}
        </div>
      </div>
    </main>
  );
}
