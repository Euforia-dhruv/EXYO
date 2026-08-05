import { useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useConvexQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import { contentApi } from '../api/content.api';
import ShareButton from '../components/ShareButton';
import { SkeletonDetail } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useDownloadStore } from '../store/downloadStore';
import { cn } from '../utils/helpers';
import type { Stream } from '../types';

interface Episode {
  id?: string;
  number: number;
  name: string;
  description?: string;
  runtime?: string;
  season?: number;
  poster?: string;
  thumbnail?: string;
  firstAired?: string;
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
  const [episodeSearch, setEpisodeSearch] = useState('');

  const { data: content, isLoading } = useQuery({
    queryKey: ['content', id, type],
    queryFn: () => contentApi.getDetails(id!, type),
    enabled: !!id,
  });

  const watchlistData = useConvexQuery(api.watchlist.checkInWatchlist, { contentId: id || '' });
  const isInWatchlist = watchlistData?.isInWatchlist || false;

  const { data: streams = [], isLoading: streamsLoading } = useQuery<Stream[]>({
    queryKey: ['streams', id, type],
    queryFn: () => contentApi.getStreams(id!, type),
    enabled: !!id,
  });

  const addToWatchlist = useMutation(api.watchlist.addToWatchlist);
  const removeFromWatchlist = useMutation(api.watchlist.removeFromWatchlist);
  const watchlistItems = useConvexQuery(api.watchlist.getWatchlist);

  const seasonsData = useMemo<SeasonData[]>(() => {
    if (!content) return [];
    const c = content as Record<string, unknown>;
    const videos = (c.videos || c.episodes) as Record<string, unknown>[] | undefined;
    if (!videos || !Array.isArray(videos) || videos.length === 0) return [];

    const seasonMap = new Map<number, Episode[]>();
    for (const v of videos) {
      const seasonNum = (v.season as number) || 1;
      if (!seasonMap.has(seasonNum)) seasonMap.set(seasonNum, []);
      seasonMap.get(seasonNum)!.push({
        id: v.id as string | undefined,
        number: (v.number as number) || (v.episode as number) || seasonMap.get(seasonNum)!.length + 1,
        name: (v.name as string) || (v.title as string) || `Episode ${(v.number as number) || ''}`,
        description: (v.description as string) || (v.overview as string) || undefined,
        runtime: v.runtime as string | undefined,
        season: seasonNum,
        poster: (v.poster as string) || (v.thumbnail as string) || undefined,
        thumbnail: (v.thumbnail as string) || undefined,
        firstAired: (v.firstAired as string) || (v.released as string) || undefined,
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
    const eps = s?.episodes || seasonsData[0]?.episodes || [];
    if (!episodeSearch.trim()) return eps;
    const q = episodeSearch.toLowerCase();
    return eps.filter(
      (ep) =>
        ep.name.toLowerCase().includes(q) ||
        String(ep.number).includes(q) ||
        (ep.description || '').toLowerCase().includes(q)
    );
  }, [seasonsData, selectedSeason, hasEpisodes, episodeSearch]);

  const sortedStreams = useMemo(() => {
    const qRank: Record<string, number> = {
      '2160p': 6, '4k': 6, '1080p': 5, '720p': 4, '480p': 3,
    };
    return [...streams].sort((a, b) => {
      const aRank = a.infoHash ? 1 : 0;
      const bRank = b.infoHash ? 1 : 0;
      if (aRank !== bRank) return aRank - bRank;
      return (qRank[b.quality || ''] || 0) - (qRank[a.quality || ''] || 0);
    });
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

  const handlePlayStream = (stream: Stream) => {
    const url = stream.proxiedUrl || stream.url;
    if (!url) return;
    navigate(`/watch/${id}?type=${type}&stream=${encodeURIComponent(url)}`);
  };

  const handlePlayEpisode = (ep: Episode) => {
    const epId = ep.id || `${id}:${ep.season || selectedSeason}:${ep.number}`;
    navigate(`/watch/${epId}?type=series&season=${ep.season || selectedSeason}&episode=${ep.number}`);
  };

  const handlePlay = () => {
    if (type === 'series' && hasEpisodes) {
      const firstEp = seasonsData[0]?.episodes[0];
      if (firstEp) {
        handlePlayEpisode(firstEp);
        return;
      }
    }
    if (sortedStreams.length > 0) {
      handlePlayStream(sortedStreams[0]);
      return;
    }
    navigate(`/watch/${id}?type=${type}`);
  };

  if (isLoading) return <SkeletonDetail />;

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-exyo-black">
        <div className="text-center max-w-md px-6">
          <p className="text-gray-300 text-lg mb-2 font-medium">Content not found</p>
          <p className="text-gray-500 text-sm mb-6">This title may no longer be available.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-exyo-red text-white px-7 py-3 rounded-full font-bold text-sm hover:bg-exyo-red-dark transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const yearStr = content.year || content.releaseInfo || '';
  const runtimeStr = content.runtime || '';
  const ratingStr = content.imdbRating || '';
  const isSeries = type === 'series' || content.type === 'series';

  return (
    <div className="min-h-screen bg-exyo-black">
      {/* Full-screen backdrop */}
      <div className="relative min-h-screen flex">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${content.background || content.poster})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-exyo-black via-exyo-black/80 to-exyo-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-exyo-black via-transparent to-exyo-black/40" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-5 md:left-10 p-2.5 hover:bg-white/10 rounded-full transition-colors z-30"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Main content area */}
        <div className="relative z-10 flex w-full pt-20 pb-10 px-5 md:px-10 gap-8">
          {/* Left side — Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-end max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Title */}
              <h1 className="text-[2.2rem] md:text-[3rem] lg:text-[3.8rem] font-black mb-4 tracking-tight leading-[0.9] text-white">
                {content.name}
              </h1>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-3 mb-4 text-[13px]">
                {ratingStr && (
                  <span className="flex items-center gap-1 font-bold">
                    <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[11px] font-black">IMDb</span>
                    <span className="text-white">{ratingStr}</span>
                  </span>
                )}
                {runtimeStr && <span className="text-gray-300">{runtimeStr}</span>}
                {yearStr && <span className="text-gray-300">{yearStr}</span>}
                <span className="px-2 py-0.5 text-[10px] font-bold border border-white/20 rounded uppercase tracking-wider text-gray-300">
                  {isSeries ? 'Series' : 'Movie'}
                </span>
              </div>

              {/* Genres */}
              {content.genres && content.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider self-center mr-1">Genres</span>
                  {content.genres.map((genre: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[12px] font-medium text-white/90 border border-white/10"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Cast */}
              {content.cast && content.cast.length > 0 && (
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Cast</span>
                  <div className="flex flex-wrap gap-2">
                    {content.cast.slice(0, 5).map((actor: { name: string; role: string }, i: number) => (
                      <span key={i} className="text-[13px] text-gray-300">
                        {actor.name}{i < Math.min(content.cast.length, 5) - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {content.description && (
                <div className="mb-6">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Summary</span>
                  <p className="text-[14px] text-gray-300/90 leading-relaxed">
                    {content.description}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handlePlay}
                  className="flex items-center gap-2 bg-white hover:bg-white/90 text-black px-7 py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 shadow-2xl shadow-black/30"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play
                </button>

                <button
                  onClick={handleWatchlistToggle}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 border border-white/20"
                >
                  {isInWatchlist ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                </button>

                <ShareButton contentId={id!} title={content.name} type={type} />
              </div>
            </motion.div>
          </div>

          {/* Right side — Sidebar panel */}
          <div className="hidden lg:flex w-[380px] flex-shrink-0 flex-col">
            <div className="bg-exyo-black/70 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden max-h-[80vh] flex flex-col">
              {/* Sidebar header */}
              <div className="p-4 border-b border-white/[0.06]">
                {isSeries && hasEpisodes ? (
                  <div className="flex items-center gap-2">
                    {/* Season selector */}
                    {seasonsData.length > 1 && (
                      <div className="relative">
                        <button
                          onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg text-[12px] font-semibold text-white transition-colors"
                        >
                          Season {selectedSeason}
                          <svg className={cn('w-3 h-3 transition-transform', showSeasonDropdown && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <AnimatePresence>
                          {showSeasonDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="absolute top-full left-0 mt-1 bg-exyo-surface border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl shadow-black/60 min-w-[140px] z-30"
                            >
                              {seasonsData.map((s) => (
                                <button
                                  key={s.season}
                                  onClick={() => {
                                    setSelectedSeason(s.season);
                                    setShowSeasonDropdown(false);
                                    setEpisodeSearch('');
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
                    <span className="text-[12px] text-gray-500 ml-auto">
                      {currentSeasonEpisodes.length} episode{currentSeasonEpisodes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-white">
                      {streamsLoading ? 'Loading streams...' : `${sortedStreams.length} stream${sortedStreams.length !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Episode search for series */}
              {isSeries && hasEpisodes && (
                <div className="px-4 pt-3">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={episodeSearch}
                      onChange={(e) => setEpisodeSearch(e.target.value)}
                      placeholder="Search episodes..."
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-[12px] text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
                    />
                    {episodeSearch && (
                      <button
                        onClick={() => setEpisodeSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded"
                      >
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isSeries && hasEpisodes ? (
                  /* Episode list */
                  <div className="p-2">
                    {currentSeasonEpisodes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-[13px]">No episodes found</div>
                    ) : (
                      currentSeasonEpisodes.map((ep) => (
                        <button
                          key={ep.number}
                          onClick={() => handlePlayEpisode(ep)}
                          className="w-full text-left p-2.5 hover:bg-white/[0.06] rounded-xl transition-all duration-150 group flex gap-3"
                        >
                          {/* Episode thumbnail */}
                          <div className="w-[120px] h-[68px] flex-shrink-0 bg-white/[0.03] rounded-lg overflow-hidden relative">
                            {ep.thumbnail || ep.poster ? (
                              <img
                                src={ep.thumbnail || ep.poster}
                                alt={`E${ep.number}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[20px] font-bold text-gray-600">
                                {ep.number}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                          {/* Episode info */}
                          <div className="flex-1 min-w-0 py-0.5">
                            <p className="text-[13px] font-semibold text-gray-200 group-hover:text-white truncate transition-colors">
                              {ep.number}. {ep.name}
                            </p>
                            {ep.firstAired && (
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {new Date(ep.firstAired).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            )}
                            {ep.description && (
                              <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{ep.description}</p>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  /* Stream list */
                  <div className="p-2">
                    {streamsLoading ? (
                      <div className="space-y-2 p-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : sortedStreams.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-[13px]">No streams available</div>
                    ) : (
                      sortedStreams.map((stream, i) => (
                        <button
                          key={i}
                          onClick={() => handlePlayStream(stream)}
                          className="w-full text-left p-3 hover:bg-white/[0.06] rounded-xl transition-all duration-150 group"
                        >
                          <div className="flex items-center gap-3">
                            {/* Quality badge */}
                            {stream.quality && (
                              <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/[0.08] text-gray-300 whitespace-nowrap">
                                {stream.quality}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-gray-200 group-hover:text-white truncate transition-colors">
                                {stream.name || stream.title || `Source ${i + 1}`}
                              </p>
                              {stream.description && (
                                <p className="text-[11px] text-gray-500 truncate mt-0.5">{stream.description}</p>
                              )}
                            </div>
                            {stream.addonName && (
                              <span className="text-[10px] text-gray-600 flex-shrink-0">{stream.addonName}</span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar footer */}
              <div className="p-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  {isSeries ? 'Select an episode' : 'Select a source'}
                </span>
                <button
                  onClick={() => navigate('/settings/streaming')}
                  className="text-[11px] text-gray-500 hover:text-white transition-colors"
                >
                  Manage Addons
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: episodes/streams below hero (for non-lg screens) */}
      <div className="lg:hidden px-5 md:px-10 pb-10">
        {isSeries && hasEpisodes ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              {seasonsData.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg text-[12px] font-semibold text-white transition-colors"
                  >
                    Season {selectedSeason}
                    <svg className={cn('w-3 h-3 transition-transform', showSeasonDropdown && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {showSeasonDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 mt-1 bg-exyo-surface border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl shadow-black/60 min-w-[140px] z-30"
                      >
                        {seasonsData.map((s) => (
                          <button
                            key={s.season}
                            onClick={() => {
                              setSelectedSeason(s.season);
                              setShowSeasonDropdown(false);
                              setEpisodeSearch('');
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
                <button
                  key={ep.number}
                  onClick={() => handlePlayEpisode(ep)}
                  className="w-full text-left p-3 bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] rounded-xl transition-all duration-200 group flex gap-3"
                >
                  <div className="w-[120px] h-[68px] flex-shrink-0 bg-white/[0.03] rounded-lg overflow-hidden relative">
                    {(ep.thumbnail || ep.poster) ? (
                      <img src={ep.thumbnail || ep.poster} alt={`E${ep.number}`} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[20px] font-bold text-gray-600">{ep.number}</div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="text-[13px] font-semibold text-gray-200 group-hover:text-white truncate transition-colors">
                      {ep.number}. {ep.name}
                    </p>
                    {ep.firstAired && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {new Date(ep.firstAired).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    {ep.description && (
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{ep.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-[15px] font-bold mb-4">{streamsLoading ? 'Loading streams...' : `Streams (${sortedStreams.length})`}</h3>
            <div className="space-y-2">
              {sortedStreams.map((stream, i) => (
                <button
                  key={i}
                  onClick={() => handlePlayStream(stream)}
                  className="w-full text-left p-3 bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] rounded-xl transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    {stream.quality && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/[0.08] text-gray-300 whitespace-nowrap">{stream.quality}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-200 group-hover:text-white truncate transition-colors">
                        {stream.name || stream.title || `Source ${i + 1}`}
                      </p>
                      {stream.description && <p className="text-[11px] text-gray-500 truncate mt-0.5">{stream.description}</p>}
                    </div>
                    {stream.addonName && <span className="text-[10px] text-gray-600 flex-shrink-0">{stream.addonName}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
