import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useConvexQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import { contentApi } from '../api/content.api';
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
  const { showToast } = useToast();

  const { data: content, isLoading } = useQuery({
    queryKey: ['content', id, type],
    queryFn: () => contentApi.getDetails(id!, type),
    enabled: !!id,
  });

  const watchlistData = useConvexQuery(api.watchlist.checkInWatchlist, { contentId: id || '' });
  const isInWatchlist = watchlistData?.isInWatchlist || false;

  const { data: similar = [] } = useQuery<CatalogItem[]>({
    queryKey: ['similar', id, type],
    queryFn: () => contentApi.getCatalogs(type, 'similar'),
    enabled: !!id,
  });

  const addToWatchlist = useMutation(api.watchlist.addToWatchlist);
  const removeFromWatchlist = useMutation(api.watchlist.removeFromWatchlist);
  const watchlistItems = useConvexQuery(api.watchlist.getWatchlist);

  const handleWatchlistToggle = () => {
    if (isInWatchlist && watchlistItems) {
      const item = watchlistItems.find((w) => w.contentId === id);
      if (item) {
        removeFromWatchlist({ id: item._id }).then(() => {
          showToast('Removed from My List', 'success');
        });
      }
    } else if (content) {
      addToWatchlist({
        contentId: content.id,
        title: content.name,
        posterUrl: content.poster,
        backdropUrl: content.background,
        contentType: content.type,
      }).then(() => {
        showToast('Added to My List', 'success');
      });
    }
  };

  if (isLoading) return <SkeletonDetail />;

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-exyo-dark">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-10 h-10 text-exyo-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <p className="text-exyo-gray text-lg mb-2 font-medium">Content not found</p>
          <p className="text-exyo-muted text-sm mb-6">This title may no longer be available.</p>
          <button onClick={() => navigate('/')} className="bg-exyo-red text-white px-8 py-3 rounded-netflix font-bold text-sm hover:bg-exyo-red-dark transition-colors">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-exyo-dark">
      {/* Hero section */}
      <div className="relative h-[85vh] min-h-[500px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${content.background || content.poster})` }}
        />
        <div className="absolute inset-0 bg-hero-gradient-left" />
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-exyo-dark/30" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 md:left-8 p-2 hover:bg-black/40 rounded transition-colors z-10"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Content info */}
        <div className="absolute bottom-[10%] left-0 right-0 px-6 md:px-8 lg:px-12">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Genre tags */}
              {content.genres && content.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {content.genres.slice(0, 3).map((genre: string, i: number) => (
                    <span key={i} className="text-xs font-semibold text-exyo-red uppercase tracking-wider">
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 tracking-tight leading-none">
                {content.name}
              </h1>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-3 mb-5 text-sm">
                {content.imdbRating && (
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    {content.imdbRating}
                  </span>
                )}
                {content.year && <span className="text-exyo-gray/70 font-medium">{content.year}</span>}
                {content.runtime && <span className="text-exyo-gray/70 font-medium">{content.runtime}</span>}
                <span className="px-1.5 py-0.5 text-[11px] font-bold border border-exyo-gray/30 rounded netflix uppercase tracking-wider text-exyo-gray/60">
                  {type === 'movie' ? 'Movie' : 'Series'}
                </span>
              </div>

              {/* Description */}
              <p className="text-[15px] text-exyo-gray/80 mb-8 leading-relaxed max-w-2xl line-clamp-3">
                {content.description}
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => navigate(`/watch/${id}?type=${type}`)}
                  className="flex items-center gap-2.5 bg-white hover:bg-white/90 text-black px-8 py-3 rounded-netflix font-bold text-sm transition-all duration-200 shadow-lg shadow-black/30"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Play
                </button>

                <button
                  onClick={handleWatchlistToggle}
                  className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-netflix font-bold text-sm transition-all duration-200 border border-white/10"
                >
                  {isInWatchlist ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      In My List
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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

      {/* Cast section */}
      {content.cast && content.cast.length > 0 && (
        <div className="px-4 md:px-8 lg:px-12 py-8">
          <h2 className="text-lg font-bold mb-4">Cast</h2>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {content.cast.map((actor: { name: string; role: string; avatar?: string }, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex-shrink-0 w-24 text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-exyo-secondary overflow-hidden mb-2">
                  {actor.avatar ? (
                    <img src={actor.avatar} alt={actor.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-exyo-muted">
                      {actor.name[0]}
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-white truncate">{actor.name}</p>
                <p className="text-[11px] text-exyo-muted truncate">{actor.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* More Like This */}
      {similar.length > 0 && (
        <div className="pt-4 pb-8">
          <ContentRow title="More Like This" items={similar} />
        </div>
      )}
    </div>
  );
}
