import { useQuery } from '@tanstack/react-query';
import { contentApi, type ContentSearchResult } from '../api/content.api';
import ContentRow from '../components/ContentRow';
import { RowSkeleton } from '../components/Skeleton';
import { TvIcon } from '@heroicons/react/24/outline';
import type { CatalogItem } from '../types';

const extractItems = (data: ContentSearchResult | undefined): CatalogItem[] => {
  if (!data || !data.results) return [];
  return data.results.map((item) => ({
    id: item.id || item.imdbId || '',
    imdbId: item.imdbId,
    name: item.name,
    title: item.title,
    posterUrl: item.posterUrl,
    backdropUrl: item.backdropUrl,
    type: (item.type || 'tv') as 'movie' | 'tv' | undefined,
    year: item.year,
    rating: item.rating,
  }));
};

export default function TVShows() {
  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['cinemeta-catalog', 'series', 'trending'],
    queryFn: () => contentApi.getCatalog('series', 'trending'),
  });

  const { data: popular, isLoading: popularLoading } = useQuery({
    queryKey: ['cinemeta-catalog', 'series', 'popular'],
    queryFn: () => contentApi.getCatalog('series', 'popular'),
  });

  const { data: topRated, isLoading: topRatedLoading } = useQuery({
    queryKey: ['cinemeta-catalog', 'series', 'top_rated'],
    queryFn: () => contentApi.getCatalog('series', 'top_rated'),
  });

  const { data: latest, isLoading: latestLoading } = useQuery({
    queryKey: ['cinemeta-catalog', 'series', 'newest'],
    queryFn: () => contentApi.getCatalog('series', 'newest'),
  });

  const { data: genre, isLoading: genreLoading } = useQuery({
    queryKey: ['cinemeta-catalog', 'series', 'genre'],
    queryFn: () => contentApi.getCatalog('series', 'genre'),
  });

  return (
    <main className="min-h-screen pt-8 pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3 mb-8">
          <TvIcon className="w-7 h-7 text-exyo-red" />
          <h1 className="text-white text-[28px] sm:text-[32px] font-bold tracking-tight">TV Shows</h1>
        </div>

        <div className="space-y-10">
          {trendingLoading ? <RowSkeleton /> : (
            extractItems(trending).length > 0 && <ContentRow title="Trending Shows" items={extractItems(trending)} size="md" />
          )}
          {popularLoading ? <RowSkeleton /> : (
            extractItems(popular).length > 0 && <ContentRow title="Popular Shows" items={extractItems(popular)} size="md" />
          )}
          {latestLoading ? <RowSkeleton /> : (
            extractItems(latest).length > 0 && <ContentRow title="Latest Shows" items={extractItems(latest)} size="md" />
          )}
          {topRatedLoading ? <RowSkeleton /> : (
            extractItems(topRated).length > 0 && <ContentRow title="Top Rated Shows" items={extractItems(topRated)} size="md" />
          )}
          {genreLoading ? <RowSkeleton /> : (
            extractItems(genre).length > 0 && <ContentRow title="Browse by Genre" items={extractItems(genre)} size="md" />
          )}
        </div>
      </div>
    </main>
  );
}
