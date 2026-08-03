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
import { useDownloadStore } from '../store/downloadStore';
import type { CatalogItem } from '../types';

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const addDownload = useDownloadStore((s) => s.addDownload);

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

  const handleDownload = () => {
    if (!content) return;
    addDownload({
      contentId: content.id,
      title: content.name,
      posterUrl: content.poster,
      type: (content.type as 'movie' | 'series') || 'movie',
      size: 'Unknown',
      downloaded: '0 MB',
    });
    showToast('Download queued', 'success');
  };

  if (isLoading) return <SkeletonDetail />;

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <p className="text-gray-300 text-lg mb-2 font-medium">Content not found</p>
          <p className="text-gray-500 text-sm mb-6">This title may no longer be available.</p>
          <button onClick={() => navigate('/')} className="bg-exyo-red text-white px-7 py-3 rounded-full font-bold text-sm hover:bg-exyo-red-dark transition-colors shadow-lg shadow-exyo-red/20">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero section */}
      <div className="relative h-[80vh] min-h-[480px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${content.background || content.poster})` }}
        />
        <div className="absolute inset-0 bg-hero-gradient-left" />
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-[#0A0A0A]/40" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-5 md:left-10 p-2.5 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Content info */}
        <div className="absolute bottom-[12%] left-0 right-0 px-6 md:px-12 lg:px-16">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Genre pills */}
              {content.genres && content.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {content.genres.slice(0, 3).map((genre: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[11px] font-semibold text-white/90 border border-white/10">
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] font-black mb-4 tracking-tight leading-[0.9]">
                {content.name}
              </h1>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-2.5 mb-5 text-[13px]">
                {content.imdbRating && (
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    {content.imdbRating}
                  </span>
                )}
                {content.year && <span className="text-gray-300 font-medium">{content.year}</span>}
                {content.runtime && <span className="text-gray-300 font-medium">{content.runtime}</span>}
                <span className="px-2 py-0.5 text-[9px] font-bold border border-white/20 rounded-full uppercase tracking-wider text-gray-300">
                  {type === 'movie' ? 'Movie' : 'Series'}
                </span>
              </div>

              {/* Description */}
              <p className="text-[15px] md:text-[16px] text-gray-300/90 mb-6 leading-relaxed max-w-2xl line-clamp-3">
                {content.description}
              </p>

              {/* Action buttons - pill shaped */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => navigate(`/watch/${id}?type=${type}`)}
                  className="flex items-center gap-2 bg-white hover:bg-white/90 text-black px-7 py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 shadow-2xl shadow-black/30"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Play
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 border border-white/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download
                </button>

                <button
                  onClick={handleWatchlistToggle}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 border border-white/20"
                >
                  {isInWatchlist ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      In My List
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
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
        <div className="px-6 md:px-12 lg:px-16 py-10">
          <h2 className="text-[18px] font-bold mb-5">Cast</h2>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {content.cast.map((actor: { name: string; role: string; avatar?: string }, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex-shrink-0 w-24 text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.03] overflow-hidden mb-2.5">
                  {actor.avatar ? (
                    <img src={actor.avatar} alt={actor.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-600">
                      {actor.name[0]}
                    </div>
                  )}
                </div>
                <p className="text-[13px] font-medium text-white truncate">{actor.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{actor.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* More Like This */}
      {similar.length > 0 && (
        <div className="pt-6 pb-12">
          <ContentRow title="More Like This" items={similar} />
        </div>
      )}
    </div>
  );
}
