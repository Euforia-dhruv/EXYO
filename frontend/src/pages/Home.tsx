import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../api/content.api';
import { historyApi } from '../api/history.api';
import { watchlistApi } from '../api/watchlist.api';
import HeroBanner from '../components/HeroBanner';
import ContentRow from '../components/ContentRow';
import { SkeletonHero, SkeletonRow } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import type { CatalogItem, WatchHistory } from '../types';

const GENRES = [
  { title: 'Action', catalogId: 'action' },
  { title: 'Comedy', catalogId: 'comedy' },
  { title: 'Drama', catalogId: 'drama' },
  { title: 'Horror', catalogId: 'horror' },
  { title: 'Sci-Fi', catalogId: 'scifi' },
  { title: 'Anime', catalogId: 'anime' },
  { title: 'Documentary', catalogId: 'documentary' },
];

export default function Home() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: continueWatching = [], isLoading: loadingHistory } = useQuery<WatchHistory[]>({
    queryKey: ['continueWatching'],
    queryFn: historyApi.getContinueWatching,
  });

  const { data: watchlist = [], isLoading: loadingWatchlist } = useQuery({
    queryKey: ['watchlist'],
    queryFn: watchlistApi.getWatchlist,
  });

  const { data: trending = [], isLoading: loadingTrending } = useQuery<CatalogItem[]>({
    queryKey: ['trending', type],
    queryFn: () => contentApi.getCatalogs(type, 'trending'),
  });

  const { data: popular = [], isLoading: loadingPopular } = useQuery<CatalogItem[]>({
    queryKey: ['popular', type],
    queryFn: () => contentApi.getCatalogs(type, 'popular'),
  });

  const { data: top = [], isLoading: loadingTop } = useQuery<CatalogItem[]>({
    queryKey: ['top', type],
    queryFn: () => contentApi.getCatalogs(type, 'top'),
  });

  // Parallel genre fetching
  const { data: genreData = {} } = useQuery({
    queryKey: ['genres', type],
    queryFn: async () => {
      const results = await Promise.allSettled(
        GENRES.map(async (genre) => {
          const items = await contentApi.getCatalogs(type, genre.catalogId);
          return { key: genre.catalogId, items };
        })
      );
      const map: Record<string, CatalogItem[]> = {};
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          map[result.value.key] = result.value.items;
        }
      });
      return map;
    },
  });

  const addToWatchlist = useMutation({
    mutationFn: watchlistApi.addToWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      showToast('Added to My List', 'success');
    },
    onError: () => showToast('Failed to add to list', 'error'),
  });

  const handleAddToList = (item: CatalogItem) => {
    addToWatchlist.mutate({
      contentId: item.id,
      title: item.name,
      posterUrl: item.poster,
      backdropUrl: item.background,
      contentType: item.type as 'movie' | 'series',
    });
  };

  const isLoadingAll = loadingTrending && loadingPopular && loadingTop;

  if (isLoadingAll) {
    return (
      <div className="min-h-screen">
        <SkeletonHero />
        <div className="-mt-32 relative z-10 space-y-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {trending.length > 0 && <HeroBanner items={trending.slice(0, 5)} />}

      <div className="-mt-40 relative z-10">
        {!loadingHistory && continueWatching.length > 0 && (
          <ContentRow title="Continue Watching" items={continueWatching} showProgress />
        )}

        <ContentRow title="Trending Now" items={trending} onAddToList={handleAddToList} />

        <ContentRow title="Popular on EXYO" items={popular} onAddToList={handleAddToList} />

        {!loadingWatchlist && watchlist.length > 0 && (
          <ContentRow title="My List" items={watchlist} onAddToList={handleAddToList} />
        )}

        <ContentRow title="Top Picks" items={top} onAddToList={handleAddToList} />

        {GENRES.map(
          (genre) =>
            genreData[genre.catalogId]?.length > 0 && (
              <ContentRow
                key={genre.catalogId}
                title={genre.title}
                items={genreData[genre.catalogId]}
                onAddToList={handleAddToList}
              />
            )
        )}
      </div>
    </div>
  );
}
