import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Plus, Check, Star, Calendar, Clock, ArrowLeft, Share2,
  ChevronDown, Search, PlayCircle,
} from 'lucide-react';
import { contentApi } from '../api/content.api';
import { DetailSkeleton } from '../components/Skeleton';
import { toast } from '../components/Toast';
import { cn } from '../utils/helpers';
import type { Stream } from '../types';

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [showStreams, setShowStreams] = useState(false);

  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ['contentDetails', id],
    queryFn: () => contentApi.getDetails(id!),
    enabled: !!id,
  });

  const { data: streamsData, isLoading: streamsLoading } = useQuery({
    queryKey: ['contentStreams', id],
    queryFn: () => contentApi.getStreams(id!),
    enabled: !!id,
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
    const contentType = details.type === 'tv' || details.type === 'series' ? 'series' : 'movie';
    try {
      if (isWatchlisted) {
        const existing = watchlist?.find((item: any) => item.contentId === id);
        if (existing) await convexRemove({ id: existing._id });
        toast.success('Removed from My List');
      } else {
        await convexAdd({ contentId: id!, title, posterUrl: details.posterUrl, backdropUrl: details.backdropUrl, contentType });
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
    return Array.from(seasonMap.entries()).sort(([a], [b]) => a - b).map(([season, episodes]) => ({ season, episodes }));
  }, [details?.episodes]);

  const currentEpisodes = useMemo(() => {
    if (!seasons.length) return [];
    return seasons.find((s) => s.season === selectedSeason)?.episodes || seasons[0]?.episodes || [];
  }, [seasons, selectedSeason]);

  const filteredEpisodes = useMemo(() => {
    if (!episodeSearch.trim()) return currentEpisodes;
    const q = episodeSearch.toLowerCase();
    return currentEpisodes.filter((ep: any) =>
      ep.title?.toLowerCase().includes(q) || ep.name?.toLowerCase().includes(q) || ep.episodeNumber?.toString().includes(q)
    );
  }, [currentEpisodes, episodeSearch]);

  const sortedStreams: Stream[] = useMemo(() => {
    return [...(streamsData?.streams || [])].sort((a, b) => {
      const qA = parseInt(a.quality || '0') || 0;
      const qB = parseInt(b.quality || '0') || 0;
      return qB - qA;
    });
  }, [streamsData?.streams]);

  const handlePlayStream = useCallback((stream: Stream) => {
    if (!details) return;
    const slug = (details.name || details.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigate(`/watch/${slug}?id=${id}&stream=${encodeURIComponent(stream.url)}`, {
      state: { title: details.name || details.title, stream, backdropUrl: details.backdropUrl },
    });
  }, [details, id, navigate]);

  const handlePlayEpisode = useCallback((ep: any) => {
    if (!details) return;
    const epId = ep.videoId || ep.id || id;
    const slug = (details.name || details.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigate(`/watch/${slug}?id=${epId}`, {
      state: { title: details.name || details.title, backdropUrl: details.backdropUrl },
    });
  }, [details, id, navigate]);

  const handlePlay = useCallback(() => {
    if (sortedStreams.length > 0) handlePlayStream(sortedStreams[0]);
    else if (details?.episodes?.length) handlePlayEpisode(details.episodes[0]);
  }, [sortedStreams, details, handlePlayStream, handlePlayEpisode]);

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

  const isTv = details.type === 'tv' || details.type === 'series';

  return (
    <main className="min-h-screen bg-bg">
      {/* Hero backdrop */}
      <div className="relative h-[60vh] sm:h-[70vh] overflow-hidden">
        {details.backdropUrl && (
          <img src={details.backdropUrl} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/80 to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-xl glass glass-border flex items-center justify-center hover:bg-white/[0.1] transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content info */}
        <div className="absolute bottom-0 inset-x-0 z-20 px-6 lg:px-10 pb-10 max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-end">
            {details.posterUrl && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
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

                {isSignedIn && (
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

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied');
                  }}
                  className="w-12 h-12 rounded-xl glass glass-border flex items-center justify-center hover:bg-white/[0.08] transition-all"
                >
                  <Share2 className="w-5 h-5 text-white/50" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content below */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 -mt-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left */}
          <div className="flex-1 min-w-0 space-y-10">
            {details.cast?.length > 0 && (
              <div>
                <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Cast</h3>
                <div className="flex flex-wrap gap-2">
                  {details.cast.slice(0, 10).map((name) => (
                    <span key={name} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.04] text-white/50 text-sm">{name}</span>
                  ))}
                </div>
              </div>
            )}

            {details.trailerStreams && details.trailerStreams.length > 0 && (
              <div>
                <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Trailers</h3>
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                  {details.trailerStreams.map((trailer, i) => (
                    <a
                      key={`${trailer.url}-${i}`}
                      href={trailer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-none w-72 aspect-video rounded-2xl overflow-hidden relative group bg-elevated border border-white/[0.04] hover:border-white/[0.1] transition-all"
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                        <PlayCircle className="w-14 h-14 text-white/60 group-hover:text-white transition-colors" />
                      </div>
                      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="text-white text-xs font-medium">{trailer.name || `Trailer ${i + 1}`}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="glass glass-border rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-base">
                    {isTv ? `Season ${selectedSeason}` : 'Streams'}
                  </h3>
                  <span className="text-white/30 text-xs">
                    {isTv ? `${filteredEpisodes.length} episodes` : `${sortedStreams.length} streams`}
                  </span>
                </div>

                {isTv && seasons.length > 1 && (
                  <div className="mt-3 relative">
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                      className="w-full appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red/40 transition-colors cursor-pointer"
                    >
                      {seasons.map((s) => (
                        <option key={s.season} value={s.season} className="bg-card text-white">Season {s.season}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  </div>
                )}

                {isTv && currentEpisodes.length > 3 && (
                  <div className="mt-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="text"
                      placeholder="Search episodes..."
                      value={episodeSearch}
                      onChange={(e) => setEpisodeSearch(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-white/25 focus:outline-none focus:border-red/40 transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="max-h-[500px] overflow-y-auto overscroll-contain">
                {isTv ? (
                  filteredEpisodes.length === 0 ? (
                    <div className="p-8 text-center text-white/30 text-sm">No episodes available</div>
                  ) : (
                    filteredEpisodes.map((ep: any) => {
                      const epId = ep.videoId || ep.id || id;
                      const epImage = ep.stillUrl || ep.posterUrl || details.backdropUrl;
                      return (
                        <button
                          key={epId}
                          onClick={() => handlePlayEpisode(ep)}
                          className="w-full text-left flex gap-3 p-4 hover:bg-white/[0.03] transition-all border-b border-white/[0.03] last:border-0 group"
                        >
                          <div className="w-32 aspect-video rounded-xl overflow-hidden bg-elevated shrink-0 relative">
                            {epImage && <img src={epImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all">
                              <PlayCircle className="w-8 h-8 text-white/60 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white/30 text-xs font-medium">E{ep.episodeNumber || '?'}</span>
                              {ep.rating && (
                                <span className="text-yellow-400/60 text-xs flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-current" /> {ep.rating}
                                </span>
                              )}
                            </div>
                            <h4 className="text-white text-sm font-medium line-clamp-1 mb-1">
                              {ep.name || ep.title || `Episode ${ep.episodeNumber}`}
                            </h4>
                            <p className="text-white/35 text-xs line-clamp-2 leading-relaxed">
                              {ep.description || 'No description'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )
                ) : (
                  sortedStreams.length === 0 ? (
                    <div className="p-8 text-center">
                      {streamsLoading ? (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 border-2 border-red/20 border-t-red rounded-full animate-spin mb-3" />
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
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
