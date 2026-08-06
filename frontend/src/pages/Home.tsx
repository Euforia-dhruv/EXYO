import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useConvexQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { contentApi, type ContentSearchResult } from '../api/content.api';
import HeroBanner from '../components/HeroBanner';
import ContentRow from '../components/ContentRow';
import { HeroSkeleton, RowSkeleton } from '../components/Skeleton';
import { useAuthStore } from '../stores/authStore';

function extractItems(data: ContentSearchResult | undefined): any[] {
  if (!data?.results) return [];
  return data.results;
}

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const watchHistory = useConvexQuery(api.watchHistory.getContinueWatching);

  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['cinemeta', 'movie', 'trending'],
    queryFn: () => contentApi.getCatalog('movie', 'trending'),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: popular } = useQuery({
    queryKey: ['cinemeta', 'movie', 'popular'],
    queryFn: () => contentApi.getCatalog('movie', 'popular'),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: topRated } = useQuery({
    queryKey: ['cinemeta', 'movie', 'top_rated'],
    queryFn: () => contentApi.getCatalog('movie', 'top_rated'),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: tvTrending } = useQuery({
    queryKey: ['cinemeta', 'series', 'trending'],
    queryFn: () => contentApi.getCatalog('series', 'trending'),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: tvPopular } = useQuery({
    queryKey: ['cinemeta', 'series', 'popular'],
    queryFn: () => contentApi.getCatalog('series', 'popular'),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: anime } = useQuery({
    queryKey: ['catalog', 'anime', 'anime-top-rated'],
    queryFn: () => contentApi.getCatalog('anime', 'anime-top-rated'),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: animeAiring } = useQuery({
    queryKey: ['catalog', 'anime', 'anime-airing'],
    queryFn: () => contentApi.getCatalog('anime', 'anime-airing'),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const historyMap = useMemo(() => {
    if (!watchHistory || !Array.isArray(watchHistory)) return {};
    const map: Record<string, any> = {};
    for (const h of watchHistory) map[h.contentId] = h;
    return map;
  }, [watchHistory]);

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      {trendingLoading ? (
        <HeroSkeleton />
      ) : (
        <HeroBanner items={extractItems(trending)} />
      )}

      {/* Content rows */}
      <div className="relative z-10 -mt-20 space-y-10 pb-20">
        {user && Object.keys(historyMap).length > 0 && (
          <ContentRow
            title="Continue Watching"
            items={Object.values(historyMap).map((h: any) => ({
              id: h.contentId,
              name: h.title,
              backdropUrl: h.backdropUrl,
              type: h.contentType,
            }))}
            size="md"
            watchHistory={historyMap}
          />
        )}

        {trendingLoading ? <RowSkeleton /> : (
          <ContentRow title="Trending Movies" items={extractItems(trending)} size="md" viewAllLink="/movies" />
        )}
        {popular && <ContentRow title="Popular Movies" items={extractItems(popular)} size="md" viewAllLink="/movies" />}
        {topRated && <ContentRow title="Top Rated" items={extractItems(topRated)} size="lg" viewAllLink="/movies" />}
        {tvTrending && <ContentRow title="Trending Series" items={extractItems(tvTrending)} size="md" viewAllLink="/tv" />}
        {tvPopular && <ContentRow title="Popular Series" items={extractItems(tvPopular)} size="md" viewAllLink="/tv" />}
        {anime && <ContentRow title="Anime" items={extractItems(anime)} size="md" viewAllLink="/anime" />}
        {animeAiring && <ContentRow title="Currently Airing Anime" items={extractItems(animeAiring)} size="md" viewAllLink="/anime" />}
      </div>
    </div>
  );
}
