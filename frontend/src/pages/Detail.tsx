import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
    enabled: !!id,
  });

  const { data: watchlistData } = useQuery({
    queryKey: ['watchlistCheck', id],
    queryFn: () => watchlistApi.checkInWatchlist(id!),
    enabled: !!id,
  });

  const isInWatchlist = watchlistData?.isInWatchlist || false;

  const { data: similar = [] } = useQuery<CatalogItem[]>({
    queryKey: ['similar', id, type],
    queryFn: () => contentApi.getCatalogs(type, 'similar'),
    enabled: !!id,
  });

  const watchlistMutation = useMutation({
    mutationFn: async () => {
      if (isInWatchlist) {
        const list = await watchlistApi.getWatchlist();
        const item = list.find((w: { contentId: string }) => w.contentId === id);
        if (item) await watchlistApi.removeFromWatchlist(item.id);
      } else {
        await watchlistApi.addToWatchlist({
          contentId: content.id,
          title: content.name,
          posterUrl: content.poster,
          backdropUrl: content.background,
          contentType: content.type,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlistCheck', id] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      showToast(isInWatchlist ? 'Removed from My List' : 'Added to My List', 'success');
    },
    onError: () => showToast('Failed to update list', 'error'),
  });

  if (isLoading) return <SkeletonDetail />;

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Content not found</p>
          <button onClick={() => navigate('/')} className="bg-exyo-red text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero backdrop */}
      <div className="relative h-[80vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${content.background || content.poster})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-exyo-dark via-exyo-dark/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-exyo-dark via-exyo-dark/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 md:left-12 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Content info */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Genre tags */}
              {content.genres && content.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {content.genres.map((genre: string, i: number) => (
                    <span key={i} className="px-3 py-1 text-xs font-medium bg-white/10 backdrop-blur-sm rounded-full text-gray-300 border border-white/5">
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight leading-[0.9]">
                {content.name}
              </h1>

              {/* Metadata */}
              <div className="flex items-center gap-4 mb-5 text-sm">
                {content.imdbRating && (
                  <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    {content.imdbRating}
                  </span>
                )}
                {content.year && <span className="text-gray-400">{content.year}</span>}
                {content.runtime && <span className="text-gray-400">{content.runtime}</span>}
                <span className="px-2 py-0.5 text-xs border border-white/20 rounded text-gray-400">
                  {type === 'movie' ? 'Movie' : 'Series'}
                </span>
              </div>

              {/* Description */}
              <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-2xl line-clamp-4">
                {content.description}
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/watch/${id}?type=${type}`)}
                  className="flex items-center gap-3 bg-white text-black px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-white/90 transition-all shadow-lg shadow-white/10"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Play
                </button>

                <button
                  onClick={() => watchlistMutation.mutate()}
                  disabled={watchlistMutation.isPending}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-white/20 transition-all border border-white/10"
                >
                  {isInWatchlist ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      In My List
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      My List
                    </>
                  )}
                </button>

                <ShareButton contentId={id!} title={content.name} type={type} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Cast */}
      {content.cast && content.cast.length > 0 && (
        <div className="px-6 md:px-12 py-10">
          <h2 className="text-xl font-bold mb-6">Cast</h2>
          <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-4">
            {content.cast.map((actor: { name: string; role: string; avatar?: string }, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 w-28 text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gray-800 overflow-hidden mb-3 border-2 border-white/5">
                  {actor.avatar ? (
                    <img src={actor.avatar} alt={actor.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-600">
                      {actor.name[0]}
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-white truncate">{actor.name}</p>
                <p className="text-xs text-gray-500 truncate">{actor.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Similar content */}
      {similar.length > 0 && (
        <div className="py-6">
          <ContentRow title="More Like This" items={similar} />
        </div>
      )}
    </div>
  );
}
