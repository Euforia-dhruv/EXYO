import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../api/content.api';
import { watchlistApi } from '../api/watchlist.api';
import ContentRow from '../components/ContentRow';
import ShareButton from '../components/ShareButton';
import { SkeletonDetail } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import type { CatalogItem } from '../types';

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: content, isLoading } = useQuery({
    queryKey: ['content', id, type],
    queryFn: () => contentApi.getDetails(id!, type),
    enabled: !!id
  });

  const { data: watchlistData } = useQuery({
    queryKey: ['watchlistCheck', id],
    queryFn: () => watchlistApi.checkInWatchlist(id!),
    enabled: !!id
  });

  const isInWatchlist = watchlistData?.isInWatchlist || false;

  const { data: similar = [] } = useQuery<CatalogItem[]>({
    queryKey: ['similar', id, type],
    queryFn: () => contentApi.getCatalogs(type, 'similar'),
    enabled: !!id
  });

  const watchlistMutation = useMutation({
    mutationFn: async () => {
      if (isInWatchlist) {
        const watchlist = await watchlistApi.getWatchlist();
        const item = watchlist.find((w: { contentId: string }) => w.contentId === id);
        if (item) {
          await watchlistApi.removeFromWatchlist(item.id);
        }
      } else {
        await watchlistApi.addToWatchlist({
          contentId: content.id,
          title: content.name,
          posterUrl: content.poster,
          backdropUrl: content.background,
          contentType: content.type
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlistCheck', id] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      showToast(isInWatchlist ? 'Removed from My List' : 'Added to My List', 'success');
    },
    onError: () => {
      showToast('Failed to update list', 'error');
    }
  });

  if (isLoading) {
    return <SkeletonDetail />;
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-exyo-gray text-lg mb-4">Content not found</p>
          <button
            onClick={() => navigate('/')}
            className="bg-exyo-red text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="relative h-[70vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${content.background || content.poster})`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-exyo-dark via-exyo-dark/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-exyo-dark via-transparent to-exyo-dark/50" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 md:left-12 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {content.name}
            </h1>

            <div className="flex items-center gap-4 mb-4 text-sm">
              {content.imdbRating && (
                <span className="text-yellow-500 font-semibold">
                  ⭐ {content.imdbRating}
                </span>
              )}
              {content.year && (
                <span className="text-exyo-gray">{content.year}</span>
              )}
              {content.runtime && (
                <span className="text-exyo-gray">{content.runtime}</span>
              )}
              <span className="px-2 py-1 border border-white/30 text-xs rounded">
                {type === 'movie' ? 'Movie' : 'Series'}
              </span>
            </div>

            {content.genres && content.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {content.genres.map((genre: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs bg-white/10 rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <p className="text-lg text-exyo-gray mb-6 max-w-xl line-clamp-3">
              {content.description}
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => navigate(`/watch/${id}?type=${type}`)}
                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-semibold hover:bg-white/80 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play
              </button>

              <button
                onClick={() => watchlistMutation.mutate()}
                disabled={watchlistMutation.isPending}
                className="flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded font-semibold hover:bg-white/30 transition-colors"
              >
                {isInWatchlist ? (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    In My List
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    My List
                  </>
                )}
              </button>

              <ShareButton
                contentId={id!}
                title={content.name}
                type={type}
              />
            </div>
          </div>
        </div>
      </div>

      {content.cast && content.cast.length > 0 && (
        <div className="px-4 md:px-12 py-8">
          <h2 className="text-xl font-semibold mb-4">Cast</h2>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
            {content.cast.map((actor: { name: string; role: string; avatar?: string }, index: number) => (
              <div key={index} className="flex-shrink-0 w-32 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-exyo-secondary overflow-hidden mb-2">
                  {actor.avatar && (
                    <img
                      src={actor.avatar}
                      alt={actor.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <p className="text-sm font-medium truncate">{actor.name}</p>
                <p className="text-xs text-exyo-gray truncate">{actor.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {similar.length > 0 && (
        <div className="py-8">
          <ContentRow
            title="More Like This"
            items={similar}
          />
        </div>
      )}
    </div>
  );
}
