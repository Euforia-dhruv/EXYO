import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { watchlistApi } from '../api/watchlist.api';
import { SkeletonGrid } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import type { WatchlistItem } from '../types';

export default function MyList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: watchlist = [], isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ['watchlist'],
    queryFn: watchlistApi.getWatchlist
  });

  const removeMutation = useMutation({
    mutationFn: watchlistApi.removeFromWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      showToast('Removed from My List', 'success');
    },
    onError: () => {
      showToast('Failed to remove item', 'error');
    }
  });

  return (
    <div className="min-h-screen pt-24 px-4 md:px-12 pb-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My List</h1>
        <span className="text-exyo-gray text-sm">
          {watchlist.length} {watchlist.length === 1 ? 'title' : 'titles'}
        </span>
      </div>

      {isLoading ? (
        <SkeletonGrid count={10} />
      ) : watchlist.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {watchlist.map((item) => (
            <div
              key={item.id}
              className="group relative cursor-pointer"
            >
              <div
                onClick={() => navigate(`/detail/${item.contentId}?type=${item.contentType}`)}
                className="aspect-video rounded overflow-hidden mb-2 relative"
              >
                <img
                  src={item.posterUrl || item.backdropUrl || '/placeholder.jpg'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-medium text-sm truncate">{item.title}</h3>
              <p className="text-xs text-exyo-gray">
                {item.contentType === 'movie' ? 'Movie' : 'Series'}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Remove "${item.title}" from My List?`)) {
                    removeMutation.mutate(item.id);
                  }
                }}
                className="absolute top-2 right-2 p-2 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-exyo-gray mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-exyo-gray text-lg mb-2">Your list is empty</p>
          <p className="text-exyo-gray text-sm mb-6">
            Add movies and TV shows to keep track of what you want to watch.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-exyo-red text-white px-6 py-2 rounded font-semibold hover:bg-red-700 transition-colors"
          >
            Browse Content
          </button>
        </div>
      )}
    </div>
  );
}
