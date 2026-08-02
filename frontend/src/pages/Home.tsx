import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../api/content.api';
import { historyApi } from '../api/history.api';
import { watchlistApi } from '../api/watchlist.api';
import HeroBanner from '../components/HeroBanner';
import ContentRow from '../components/ContentRow';
import Footer from '../components/Footer';
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

function ConnectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-exyo-red/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-exyo-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 2.122a1.5 1.5 0 112.121 2.121 1.5 1.5 0 01-2.121-2.121z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-3">Unable to connect</h2>
        <p className="text-gray-400 mb-8 leading-relaxed">
          We&apos;re having trouble reaching our servers. Please check your connection and try again.
        </p>
        <button
          onClick={onRetry}
          className="bg-exyo-red hover:bg-exyo-red-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: continueWatching = [], isLoading: loadingHistory } = useQuery<WatchHistory[]>({
    queryKey: ['continueWatching'],
    queryFn: historyApi.getContinueWatching,
    retry: 2,
  });

  const { data: watchlist = [], isLoading: loadingWatchlist } = useQuery({
    queryKey: ['watchlist'],
    queryFn: watchlistApi.getWatchlist,
    retry: 2,
  });

  const { data: trending = [], isLoading: loadingTrending, isError: trendingError, refetch } = useQuery<CatalogItem[]>({
    queryKey: ['trending', type],
    queryFn: () => contentApi.getCatalogs(type, 'trending'),
    retry: 2,
  });

  const { data: popular = [], isLoading: loadingPopular } = useQuery<CatalogItem[]>({
    queryKey: ['popular', type],
    queryFn: () => contentApi.getCatalogs(type, 'popular'),
    retry: 2,
  });

  const { data: top = [], isLoading: loadingTop } = useQuery<CatalogItem[]>({
    queryKey: ['top', type],
    queryFn: () => contentApi.getCatalogs(type, 'top'),
    retry: 2,
  });

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

  if (trendingError && !trending.length && !popular.length && !top.length) {
    return <ConnectionError onRetry={() => refetch()} />;
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

        <Footer />
      </div>
    </div>
  );
}
