import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import {
  Play, Plus, Check, Star, Calendar, Clock, ArrowLeft, Share2,
  Search, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { contentApi } from '../api/content.api';
import { DetailSkeleton } from '../components/Skeleton';
import StreamDrawer from '../components/StreamDrawer';
import { ELogo } from '../components/Logo';
import { toast } from '../components/Toast';
import { cn } from '../utils/helpers';
import type { Stream } from '../types';
import { useAuthStore } from '../stores/authStore';

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const seasonPillsRef = useRef<HTMLDivElement>(null);

  const contentType = location.pathname.startsWith('/anime/') ? 'anime'
    : location.pathname.startsWith('/series/') ? 'series'
    : 'movie';

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [showStreams, setShowStreams] = useState(false);
  const [streamEpisodeId, setStreamEpisodeId] = useState<string | null>(null);
  const [streamTitle, setStreamTitle] = useState('');

  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ['contentDetails', id, contentType],
    queryFn: () => contentApi.getDetails(id!, contentType),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const { data: streamsData, isLoading: streamsLoading } = useQuery({
    queryKey: ['contentStreams', streamEpisodeId || id, contentType],
    queryFn: () => contentApi.getStreams(streamEpisodeId || id!, contentType),
    enabled: !!(streamEpisodeId || id),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const watchlist = useConvexQuery(api.watchlist.getWatchlist);
  const convexAdd = useConvexMutation(api.watchlist.addToWatchlist);
  const convexRemove = useConvexMutation(api.watchlist.removeFromWatchlist);

  const isWatchlisted = useMemo(() => {
    if (!watchlist || !Array.isArray(watchlist) || !id) return false;
    return watchlist.some((item: any) => item.contentId === id);
  }, [watchlist, id]);

  const toggleWatchlist = useCallback(async () => {
    if (!user || !details) return;
    const title = details.name || details.title || 'Untitled';
    const contentTypeStr = details.type === 'tv' || details.type === 'series' || details.type === 'anime' ? 'series' : 'movie';
    try {
      if (isWatchlisted) {
        const existing = watchlist?.find((item: any) => item.contentId === id);
        if (existing) await convexRemove({ id: existing._id });
        toast.success('Removed from My List');
      } else {
        await convexAdd({ contentId: id!, title, posterUrl: details.posterUrl, backdropUrl: details.backdropUrl, contentType: contentTypeStr });
        toast.success('Added to My List');
      }
    } catch {
      toast.error('Failed to update list');
    }
  }, [user, details, isWatchlisted, id, watchlist, convexAdd, convexRemove]);

  const seasons = useMemo(() => {
    if (!details?.episodes) return [];
    const seasonMap = new Map<number, any[]>();
    for (const ep of details.episodes) {
      const s = ep.seasonNumber || 1;
      if (!seasonMap.has(s)) seasonMap.set(s, []);
      seasonMap.get(s)!.push(ep);
    }
    return Array.from(seasonMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([season, episodes]) => ({
        season,
        episodes: episodes.sort((a: any, b: any) => (a.episodeNumber || 0) - (b.episodeNumber || 0)),
      }));
  }, [details?.episodes]);

  const currentEpisodes = useMemo(() => {
    if (!seasons.length) return [];
    return seasons.find((s) => s.season === selectedSeason)?.episodes || seasons[0]?.episodes || [];
  }, [seasons, selectedSeason]);

  const isTv = details?.type === 'tv' || details?.type === 'series' || details?.type === 'anime' || contentType === 'anime';

  const filteredEpisodes = useMemo(() => {
    if (!episodeSearch.trim()) return currentEpisodes;
    const q = episodeSearch.toLowerCase();
    return currentEpisodes.filter((ep: any) =>
      ep.title?.toLowerCase().includes(q) ||
      ep.name?.toLowerCase().includes(q) ||
      ep.episodeNumber?.toString().includes(q)
    );
  }, [currentEpisodes, episodeSearch]);

  const sortedStreams: Stream[] = useMemo(() => {
    return [...(streamsData?.streams || [])].sort((a, b) => {
      const qA = parseInt(a.quality || '0') || 0;
      const qB = parseInt(b.quality || '0') || 0;
      return qB - qA;
    });
  }, [streamsData?.streams]);

  const openStreamDrawer = useCallback((episodeId: string, title: string) => {
    setStreamEpisodeId(episodeId);
    setStreamTitle(title);
    setShowStreams(true);
  }, []);

  const handlePlayStream = useCallback((stream: Stream) => {
    const effectiveId = streamEpisodeId || id;
    if (!details || !effectiveId) return;
    const slug = (details.name || details.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const allEpisodes = details.episodes || [];
    const episodeList = isTv && allEpisodes.length > 0
      ? allEpisodes.map((ep: any) => ({
          id: ep.videoId || ep.id || `${id}:${ep.seasonNumber}:${ep.episodeNumber}`,
          title: ep.name || ep.title || `Episode ${ep.episodeNumber}`,
          episodeNumber: ep.episodeNumber || 0,
          seasonNumber: ep.seasonNumber || 1,
          stillUrl: ep.stillUrl || ep.posterUrl,
        }))
      : undefined;

    const epIdx = episodeList?.findIndex((ep) => ep.id === effectiveId) ?? undefined;

    navigate(`/watch/${slug}?id=${effectiveId}&stream=${encodeURIComponent(stream.url)}`, {
      state: {
        title: details.name || details.title,
        stream,
        backdropUrl: details.backdropUrl,
        contentType,
        episodes: episodeList,
        episodeIndex: epIdx,
      },
    });
    setShowStreams(false);
  }, [details, id, streamEpisodeId, navigate, contentType, isTv]);

  const handlePlayEpisode = useCallback((ep: any, _epIdx?: number) => {
    if (!details) return;
    const epId = ep.videoId || ep.id || `${id}:${ep.seasonNumber}:${ep.episodeNumber}`;
    openStreamDrawer(epId, ep.name || ep.title || `E${ep.episodeNumber || '?'}`);
  }, [details, id, openStreamDrawer]);

  const handlePlay = useCallback(() => {
    if (isTv) {
      if (currentEpisodes.length > 0) {
        const ep = currentEpisodes[0];
        const epId = ep.videoId || ep.id || `${id}:${ep.seasonNumber}:${ep.episodeNumber}`;
        openStreamDrawer(epId, ep.name || ep.title || 'Episode 1');
      }
    } else {
      openStreamDrawer(id!, details?.name || details?.title || 'Movie');
    }
  }, [isTv, currentEpisodes, id, details, openStreamDrawer]);

  const scrollSeasonPills = useCallback((direction: 'left' | 'right') => {
    if (!seasonPillsRef.current) return;
    const scrollAmount = 200;
    seasonPillsRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (detailsLoading) return <DetailSkeleton />;
  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 text-sm mb-4">Content not found</p>
          <Link to="/home" className="inline-flex items-center gap-2 text-red text-sm font-medium hover:text-red-hover transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg">
      {/* Hero backdrop */}
      <div className="relative h-[60vh] sm:h-[70vh] overflow-hidden">
        {details.backdropUrl && (
          <motion.img
            src={details.backdropUrl}
            alt=""
            className="w-full h-full object-cover"
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: 'easeOut' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg/40" />

        {/* Back button */}
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-xl glass glass-border flex items-center justify-center hover:bg-white/[0.1] transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Share button */}
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Link copied');
            }}
            className="w-11 h-11 rounded-xl glass glass-border flex items-center justify-center hover:bg-white/[0.1] transition-all"
          >
            <Share2 className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content info */}
        <div className="absolute bottom-0 inset-x-0 z-20 px-6 lg:px-10 pb-10 max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-end">
            {details.posterUrl && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="hidden lg:block w-48 shrink-0"
              >
                <img
                  src={details.posterUrl}
                  alt={details.name || details.title}
                  className="w-full aspect-[2/3] object-cover rounded-2xl shadow-2xl"
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 max-w-[700px]"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-red text-xs font-bold uppercase tracking-wider">
                  {isTv ? 'TV Series' : 'Movie'}
                </span>
                {details.rating && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    {details.rating}
                  </span>
                )}
                {isTv && seasons.length > 0 && (
                  <span className="text-white/30 text-xs font-medium">
                    {seasons.length} Season{seasons.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <h1 className="text-white text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.02] tracking-tight mb-4">
                {details.name || details.title || 'Untitled'}
              </h1>

              <div className="flex flex-wrap items-center gap-2.5 mb-5">
                {details.year && (
                  <span className="inline-flex items-center gap-1.5 text-white/50 text-sm">
                    <Calendar className="w-3.5 h-3.5" /> {details.year}
                  </span>
                )}
                {details.runtime && (
                  <span className="inline-flex items-center gap-1.5 text-white/50 text-sm">
                    <Clock className="w-3.5 h-3.5" /> {details.runtime}
                  </span>
                )}
                {details.genres?.slice(0, 4).map((g) => (
                  <span key={g} className="px-3 py-1 rounded-lg bg-white/[0.05] border border-white/[0.05] text-white/50 text-xs font-medium">{g}</span>
                ))}
              </div>

              {details.description && (
                <p className="text-white/55 text-[15px] leading-relaxed line-clamp-3 mb-8">{details.description}</p>
              )}

              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePlay}
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-black font-bold text-base shadow-xl"
                >
                  <Play className="w-6 h-6 fill-black" />
                  Play
                </motion.button>

                {user && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={toggleWatchlist}
                    className={cn(
                      'inline-flex items-center gap-2 px-6 py-4 rounded-2xl font-semibold text-sm transition-all border',
                      isWatchlisted
                        ? 'bg-white/[0.08] border-white/[0.12] text-white'
                        : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08]'
                    )}
                  >
                    {isWatchlisted ? <><Check className="w-5 h-5 text-red" /> In My List</> : <><Plus className="w-5 h-5" /> My List</>}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content below */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 -mt-6 relative z-10 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — Main content */}
          <div className="flex-1 min-w-0">
            {/* Cast */}
            {details.cast && details.cast.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-10"
              >
                <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Cast</h3>
                <div className="flex flex-wrap gap-2">
                  {details.cast!.slice(0, 10).map((name) => (
                    <span key={name} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.04] text-white/50 text-sm">{name}</span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Season pills + Episode browser for TV */}
            {isTv && seasons.length > 0 && (
              <div>
                {/* Season pills header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider">
                    Episodes
                  </h3>
                  <span className="text-white/25 text-xs">
                    {filteredEpisodes.length} episode{filteredEpisodes.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Season pills */}
                {seasons.length > 1 && (
                  <div className="relative mb-6">
                    <button
                      onClick={() => scrollSeasonPills('left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full glass glass-border flex items-center justify-center hover:bg-white/[0.08] transition-all"
                    >
                      <ChevronLeft className="w-4 h-4 text-white/50" />
                    </button>
                    <button
                      onClick={() => scrollSeasonPills('right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full glass glass-border flex items-center justify-center hover:bg-white/[0.08] transition-all"
                    >
                      <ChevronRight className="w-4 h-4 text-white/50" />
                    </button>

                    <div
                      ref={seasonPillsRef}
                      className="flex gap-2 overflow-x-auto hide-scrollbar px-10 py-1"
                    >
                      {seasons.map((s) => (
                        <button
                          key={s.season}
                          onClick={() => {
                            setSelectedSeason(s.season);
                            setEpisodeSearch('');
                            setSelectedEpisode(null);
                          }}
                          className={cn(
                            'relative shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200',
                            selectedSeason === s.season
                              ? 'text-white'
                              : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                          )}
                        >
                          {selectedSeason === s.season && (
                            <motion.div
                              layoutId="activeSeason"
                              className="absolute inset-0 bg-red rounded-full"
                              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            />
                          )}
                          <span className="relative z-10">Season {s.season}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Episode search */}
                {currentEpisodes.length > 3 && (
                  <div className="relative mb-5">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="text"
                      placeholder="Search episodes..."
                      value={episodeSearch}
                      onChange={(e) => setEpisodeSearch(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-10 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-red/30 focus:bg-white/[0.05] transition-all"
                    />
                    {episodeSearch && (
                      <button
                        onClick={() => setEpisodeSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-all"
                      >
                        <X className="w-3 h-3 text-white/40" />
                      </button>
                    )}
                  </div>
                )}

                {/* Episode grid */}
                {filteredEpisodes.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-white/30 text-sm">No episodes available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredEpisodes.map((ep: any, idx: number) => {
                      const epId = ep.videoId || ep.id || `${id}:${ep.seasonNumber}:${ep.episodeNumber}`;
                      const epImage = ep.stillUrl || ep.posterUrl;
                      const isSelected = selectedEpisode === epId;

                      return (
                        <motion.button
                          key={epId}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04, duration: 0.3 }}
                          onClick={() => {
                            setSelectedEpisode(epId);
                            handlePlayEpisode(ep);
                          }}
                          className={cn(
                            'text-left rounded-2xl overflow-hidden border transition-all duration-200 group',
                            isSelected
                              ? 'border-red/30 bg-red/[0.04]'
                              : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.1]'
                          )}
                        >
                          {/* Thumbnail */}
                          <div className="relative aspect-video bg-elevated overflow-hidden">
                            {epImage && (
                              <img
                                src={epImage}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                            {/* Episode number badge */}
                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                              <span className="text-white text-xs font-bold">E{ep.episodeNumber || '?'}</span>
                            </div>

                            {/* Rating badge */}
                            {ep.rating && (
                              <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-white text-xs font-semibold">{ep.rating}</span>
                              </div>
                            )}

                            {/* Play icon overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl">
                                <Play className="w-6 h-6 text-black fill-black ml-0.5" />
                              </div>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-white text-sm font-semibold line-clamp-1 flex-1">
                                {ep.name || ep.title || `Episode ${ep.episodeNumber}`}
                              </h4>
                              {ep.runtime && (
                                <span className="text-white/30 text-xs shrink-0 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {ep.runtime}m
                                </span>
                              )}
                            </div>

                            {ep.description && (
                              <p className="text-white/35 text-xs leading-relaxed line-clamp-2 mb-3">
                                {ep.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-white/25 text-[11px]">Click to play</span>
                              <motion.span
                                className="text-red text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Watch now →
                              </motion.span>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar — Movie streams (only for non-TV) */}
          {!isTv && (
            <div className="w-full lg:w-[400px] shrink-0">
              <div className="glass glass-border rounded-3xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-base">Streams</h3>
                    <span className="text-white/30 text-xs">
                      {sortedStreams.length} available
                    </span>
                  </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto overscroll-contain">
                  {sortedStreams.length === 0 ? (
                    <div className="p-8 text-center">
                      {streamsLoading ? (
                        <div className="flex flex-col items-center gap-3 py-4">
                          <ELogo size={40} animate />
                          <p className="text-white/30 text-sm">Loading streams...</p>
                        </div>
                      ) : (
                        <p className="text-white/30 text-sm">No streams available</p>
                      )}
                    </div>
                  ) : (
                    sortedStreams.map((stream, i) => (
                      <button
                        key={`${stream.url}-${i}`}
                        onClick={() => handlePlayStream(stream)}
                        className="w-full text-left p-4 hover:bg-white/[0.03] transition-all border-b border-white/[0.03] last:border-0 group flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center group-hover:bg-red/10 transition-colors shrink-0">
                          <Play className="w-4 h-4 text-white/30 group-hover:text-red transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {stream.name || stream.title || `Stream ${i + 1}`}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {stream.quality && stream.quality !== 'Unknown' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">{stream.quality}</span>
                            )}
                            {stream.videoCodec && (
                              <span className="text-[10px] text-white/25">{stream.videoCodec.toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stream drawer */}
      <StreamDrawer
        open={showStreams}
        streams={sortedStreams}
        currentStreamUrl={undefined}
        onSelect={handlePlayStream}
        onClose={() => setShowStreams(false)}
        loading={streamsLoading}
        title={streamTitle}
      />
    </main>
  );
}
