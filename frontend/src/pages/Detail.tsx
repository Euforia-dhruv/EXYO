import { useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useConvexQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import { contentApi } from '../api/content.api';
import ContentRow from '../components/ContentRow';
import ShareButton from '../components/ShareButton';
import { SkeletonDetail } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useDownloadStore } from '../store/downloadStore';
import { cn } from '../utils/helpers';
import type { CatalogItem, Stream } from '../types';

interface Episode {
  id?: string;
  number: number;
  name: string;
  description?: string;
  runtime?: string;
  season?: number;
  poster?: string;
}

interface SeasonData {
  season: number;
  name?: string;
  episodes: Episode[];
}

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const addDownload = useDownloadStore((s) => s.addDownload);

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

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

  const { data: streams = [] } = useQuery<Stream[]>({
    queryKey: ['streams', id, type],
    queryFn: () => contentApi.getStreams(id!, type),
    enabled: !!id,
  });

  const addToWatchlist = useMutation(api.watchlist.addToWatchlist);
  const removeFromWatchlist = useMutation(api.watchlist.removeFromWatchlist);
  const watchlistItems = useConvexQuery(api.watchlist.getWatchlist);

  const seasonsData = useMemo<SeasonData[]>(() => {
    if (!content) return [];
    const videos = (content as Record<string, unknown>).videos ||
      (content as Record<string, unknown>).episodes;
    if (!videos || !Array.isArray(videos) || videos.length === 0) return [];

    const seasonMap = new Map<number, Episode[]>();
    for (const v of videos) {
      const ep = v as Record<string, unknown>;
      const seasonNum = (ep.season as number) || 1;
      if (!seasonMap.has(seasonNum)) seasonMap.set(seasonNum, []);
      seasonMap.get(seasonNum)!.push({
        id: ep.id as string | undefined,
        number: (ep.number as number) || seasonMap.get(seasonNum)!.length + 1,
        name: (ep.name as string) || (ep.title as string) || `Episode ${ep.number}`,
        description: ep.description as string | undefined,
        runtime: ep.runtime as string | undefined,
        season: seasonNum,
        poster: ep.poster as string | undefined,
      });
    }

    return Array.from(seasonMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([season, episodes]) => ({
        season,
        name: `Season ${season}`,
        episodes,
      }));
  }, [content]);

  const hasEpisodes = seasonsData.length > 0;

  const currentSeasonEpisodes = useMemo(() => {
    if (!hasEpisodes) return [];
    const s = seasonsData.find((s) => s.season === selectedSeason);
    return s?.episodes || seasonsData[0]?.episodes || [];
  }, [seasonsData, selectedSeason, hasEpisodes]);

  const streamPreview = useMemo(() => {
    const sorted = [...streams].sort((a, b) => {
      const qRank: Record<string, number> = {
        '2160p': 5, '4k': 5, '1080p': 4, '720p': 3, '480p': 2,
      };
      return (qRank[b.quality || ''] || 0) - (qRank[a.quality || ''] || 0);
    });
    return sorted.slice(0, 3);
  }, [streams]);

  const genresByAddon = useMemo(() => {
    const addons = new Map<string, Stream[]>();
    for (const s of streams) {
      const name = s.addonName || 'Unknown';
      if (!addons.has(name)) addons.set(name, []);
      addons.get(name)!.push(s);
    }
    return Array.from(addons.entries());
  }, [streams]);

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
      <div className="min-h-screen flex items-center justify-center bg-exyo-black">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
          </div>
          <p className="text-gray-300 text-lg mb-2 font-medium">Content not found</p>
          <p className="text-gray-500 text-sm mb-6">This title may no longer be available.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-exyo-red text-white px-7 py-3 rounded-full font-bold text-sm hover:bg-exyo-red-dark transition-colors shadow-lg shadow-exyo-red/20"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-exyo-black">
      {/* Hero section */}
      <div className="relative h-[80vh] min-h-[480px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${content.background || content.poster})` }}
        />
        <div className="absolute inset-0 bg-hero-gradient-left" />
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-exyo-black/40" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-exyo-black via-exyo-black/60 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-5 md:left-10 p-2.5 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
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
                    <span
                      key={i}
                      className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[11px] font-semibold text-white/90 border border-white/10"
                    >
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
                <span className="flex items-center gap-1 text-green-400 font-bold">
                  {content.imdbRating ? `${Math.round(Number(content.imdbRating) * 10)}% Match` : ''}
                </span>
                {content.imdbRating && (
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {content.imdbRating}
                  </span>
                )}
                {content.year && (
                  <span className="text-gray-300 font-medium">{content.year}</span>
                )}
                {content.runtime && (
                  <span className="text-gray-300 font-medium">{content.runtime}</span>
                )}
                <span className="px-2 py-0.5 text-[9px] font-bold border border-white/20 rounded-full uppercase tracking-wider text-gray-300">
                  {type === 'movie' ? 'Movie' : 'Series'}
                </span>
              </div>

              {/* Description */}
              <p className="text-[15px] md:text-[16px] text-gray-300/90 mb-6 leading-relaxed max-w-2xl line-clamp-3">
                {content.description}
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => navigate(`/watch/${id}?type=${type}`)}
                  className="flex items-center gap-2 bg-white hover:bg-white/90 text-black px-7 py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 shadow-2xl shadow-black/30"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 border border-white/20"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  Download
                </button>

                <button
                  onClick={handleWatchlistToggle}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 border border-white/20"
                >
                  {isInWatchlist ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      In My List
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
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

      {/* Genres section */}
      {content.genres && content.genres.length > 0 && (
        <div className="px-6 md:px-12 lg:px-16 py-8">
          <h2 className="text-[18px] font-bold mb-4">Genres</h2>
          <div className="flex flex-wrap gap-2">
            {content.genres.map((genre: string, i: number) => (
              <span
                key={i}
                className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-full text-[13px] font-medium text-gray-300 transition-colors cursor-default"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Episodes section (series only) */}
      {hasEpisodes && (
        <div className="px-6 md:px-12 lg:px-16 py-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-bold">Episodes</h2>
            {seasonsData.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-[13px] font-semibold text-white transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={showSeasonDropdown}
                >
                  Season {selectedSeason}
                  <svg
                    className={cn(
                      'w-4 h-4 transition-transform',
                      showSeasonDropdown && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {showSeasonDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 bg-exyo-surface border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl shadow-black/60 min-w-[140px] z-20"
                    >
                      {seasonsData.map((s) => (
                        <button
                          key={s.season}
                          onClick={() => {
                            setSelectedSeason(s.season);
                            setShowSeasonDropdown(false);
                          }}
                          className={cn(
                            'w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors',
                            selectedSeason === s.season
                              ? 'bg-exyo-red text-white'
                              : 'text-gray-300 hover:bg-white/[0.06]'
                          )}
                        >
                          {s.name || `Season ${s.season}`}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {currentSeasonEpisodes.map((ep) => (
              <motion.button
                key={ep.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(ep.number * 0.03, 0.3) }}
                onClick={() =>
                  navigate(
                    `/watch/${id}?type=series&season=${ep.season || selectedSeason}&episode=${ep.number}`
                  )
                }
                className="w-full text-left p-3 bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] rounded-xl transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-[15px] font-bold text-gray-500 group-hover:text-white transition-colors">
                      {ep.number}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[14px] font-semibold text-gray-200 group-hover:text-white truncate transition-colors">{ep.name}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {ep.runtime && (
                          <span className="text-[12px] text-gray-500">{ep.runtime}</span>
                        )}
                        <svg
                          className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    {ep.description && (
                      <p className="text-[13px] text-gray-500 mt-1.5 line-clamp-2">
                        {ep.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Available Streams preview */}
      {streamPreview.length > 0 && (
        <div className="px-6 md:px-12 lg:px-16 py-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-bold">Available Streams</h2>
            <span className="text-[13px] text-gray-500">
              {streams.length} source{streams.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {streamPreview.map((stream, i) => {
              const isPlayable = stream.url && !stream.infoHash;
              return (
                <div
                  key={i}
                  className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {stream.quality && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/[0.08] text-gray-300">
                        {stream.quality}
                      </span>
                    )}
                    {!isPlayable && stream.infoHash && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400">
                        Torrent
                      </span>
                    )}
                    {stream.addonName && (
                      <span className="text-[11px] text-gray-600">{stream.addonName}</span>
                    )}
                  </div>
                  {stream.name && (
                    <p className="text-[13px] text-white font-medium truncate">{stream.name}</p>
                  )}
                  {stream.description && (
                    <p className="text-[12px] text-gray-500 truncate mt-1">{stream.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Where to Watch */}
      {genresByAddon.length > 0 && (
        <div className="px-6 md:px-12 lg:px-16 py-10">
          <h2 className="text-[18px] font-bold mb-5">Where to Watch</h2>
          <div className="space-y-3">
            {genresByAddon.map(([addonName, addonStreams]) => (
              <div
                key={addonName}
                className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-exyo-red" />
                  <div>
                    <p className="text-[14px] font-semibold text-white">{addonName}</p>
                    <p className="text-[12px] text-gray-500">
                      {addonStreams.length} stream{addonStreams.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/watch/${id}?type=${type}`)}
                  className="px-4 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg text-[12px] font-semibold text-gray-300 transition-colors"
                >
                  Watch
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cast section */}
      {content.cast && content.cast.length > 0 && (
        <div className="px-6 md:px-12 lg:px-16 py-10">
          <h2 className="text-[18px] font-bold mb-5">Cast</h2>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {content.cast.map(
              (actor: { name: string; role: string; avatar?: string }, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex-shrink-0 w-24 text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.03] overflow-hidden mb-2.5">
                    {actor.avatar ? (
                      <img
                        src={actor.avatar}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-600">
                        {actor.name[0]}
                      </div>
                    )}
                  </div>
                  <p className="text-[13px] font-medium text-white truncate">{actor.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{actor.role}</p>
                </motion.div>
              )
            )}
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
