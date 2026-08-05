import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useConvexQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import HeroBanner from '../components/HeroBanner';
import ContentRow from '../components/ContentRow';
import { RowSkeleton } from '../components/Skeleton';
import { contentApi, type ContentSearchResult } from '../api/content.api';
import type { CatalogItem } from '../types';

const ANIME_CATALOG_ID = 'animestream';

export default function Home() {
  const [searchParams] = useSearchParams();
  const catalogId = searchParams.get('catalogId') || undefined;
  const { isSignedIn } = useUser();

  const watchHistory = useConvexQuery(api.watchHistory.getContinueWatching);

  const continueWatchingItems = useMemo(() => {
    if (!watchHistory || !Array.isArray(watchHistory)) return [];
    return watchHistory
      .filter((item: { progress?: number; duration?: number }) => item.progress && item.progress > 0 && item.duration && item.duration > 0)
      .sort((a: { lastWatched?: number }, b: { lastWatched?: number }) => (b.lastWatched || 0) - (a.lastWatched || 0))
      .slice(0, 20)
      .map((item: { title?: string; name?: string; posterUrl?: string; id?: string; imdbId?: string; backdropUrl?: string; year?: string; rating?: number; progress?: number; duration?: number; type?: string }) => ({
        id: item.contentId || item.id || item.imdbId || '',
        imdbId: item.imdbId,
        name: item.name || item.title,
        title: item.title,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        year: item.year,
        rating: item.rating,
        type: (item.type || item.contentType) as 'movie' | 'tv' | undefined,
        progress: item.progress,
        duration: item.duration,
      })) as CatalogItem[];
  }, [watchHistory]);

  const heroItems = useMemo(() => {
    return continueWatchingItems.filter((item) => item.backdropUrl).slice(0, 5);
  }, [continueWatchingItems]);

  const isAnime = catalogId === ANIME_CATALOG_ID;

  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['cinemeta', 'trending', isAnime ? 'anime' : 'default'],
    queryFn: () => contentApi.searchByName(isAnime ? 'anime trending' : 'trending', { limit: 20 }),
  });

  const { data: popular, isLoading: popularLoading } = useQuery({
    queryKey: ['cinemeta', 'popular', isAnime ? 'anime' : 'default'],
    queryFn: () => contentApi.searchByName(isAnime ? 'anime popular' : 'popular', { limit: 20 }),
  });

  const { data: latest, isLoading: latestLoading } = useQuery({
    queryKey: ['cinemeta', 'latest', isAnime ? 'anime' : 'default'],
    queryFn: () => contentApi.searchByName(isAnime ? 'anime latest' : 'latest', { limit: 20 }),
  });

  const { data: topRated, isLoading: topRatedLoading } = useQuery({
    queryKey: ['cinemeta', 'top-rated', isAnime ? 'anime' : 'default'],
    queryFn: () => contentApi.searchByName(isAnime ? 'anime top rated' : 'top rated', { limit: 20 }),
  });

  const extractItems = useCallback((data: ContentSearchResult | undefined): CatalogItem[] => {
    if (!data || !data.results) return [];
    return data.results.map((item) => ({
      id: item.id || item.imdbId || '',
      imdbId: item.imdbId,
      name: item.name,
      title: item.title,
      posterUrl: item.posterUrl,
      backdropUrl: item.backdropUrl,
      type: item.type as 'movie' | 'tv' | undefined,
      year: item.year,
      rating: item.rating,
    }));
  }, []);

  const trendingItems = useMemo(() => extractItems(trending), [trending, extractItems]);
  const popularItems = useMemo(() => extractItems(popular), [popular, extractItems]);
  const latestItems = useMemo(() => extractItems(latest), [latest, extractItems]);
  const topRatedItems = useMemo(() => extractItems(topRated), [topRated, extractItems]);

  return (
    <main className="min-h-screen">
      {heroItems.length > 0 && <HeroBanner items={heroItems} />}

      <div className="relative z-10 -mt-16 sm:-mt-24 lg:-mt-32">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
          {continueWatchingItems.length > 0 && (
            <ContentRow
              title="Continue Watching"
              items={continueWatchingItems}
              size="md"
            />
          )}

          {trendingLoading ? (
            <RowSkeleton />
          ) : (
            trendingItems.length > 0 && (
              <ContentRow title={isAnime ? "Trending Anime" : "Trending Now"} items={trendingItems} size="md" />
            )
          )}

          {popularLoading ? (
            <RowSkeleton />
          ) : (
            popularItems.length > 0 && (
              <ContentRow title={isAnime ? "Popular Anime" : "Popular"} items={popularItems} size="md" />
            )
          )}

          {latestLoading ? (
            <RowSkeleton />
          ) : (
            latestItems.length > 0 && (
              <ContentRow title={isAnime ? "Latest Anime" : "Latest"} items={latestItems} size="md" />
            )
          )}

          {topRatedLoading ? (
            <RowSkeleton />
          ) : (
            topRatedItems.length > 0 && (
              <ContentRow title={isAnime ? "Top Rated Anime" : "Top Rated"} items={topRatedItems} size="md" />
            )
          )}
        </div>
      </div>
    </main>
  );
}
