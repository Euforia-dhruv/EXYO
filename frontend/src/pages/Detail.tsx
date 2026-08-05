import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlayIcon,
  PlusIcon,
  CheckIcon,
  StarIcon,
  ClockIcon,
  CalendarIcon,
  ArrowLeftIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { contentApi } from '../api/content.api';
import { DetailSkeleton } from '../components/Skeleton';
import { toast } from '../components/Toast';
import type { Stream, CatalogItem } from '../types';
import { cn } from '../utils/helpers';

const API_URL = import.meta.env.VITE_CONVEX_SITE_URL;

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const queryClient = useQueryClient();

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [showEpisodes, setShowEpisodes] = useState(true);

  // Fetch details (handles both movies and series with episode IDs)
  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ['contentDetails', id],
    queryFn: () => contentApi.getDetails(id!),
    enabled: !!id,
  });

  // Fetch streams for this content
  const { data: streamsData, isLoading: streamsLoading } = useQuery({
    queryKey: ['contentStreams', id],
    queryFn: () => contentApi.getStreams(id!),
    enabled: !!id,
  });

  // Watchlist
  const { data: watchlist } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => contentApi.getWatchlist(user!.id),
    enabled: isSignedIn,
  });

  const addToWatchlist = useMutation({
    mutationFn: (data: { userId: string; contentId: string; type: string }) =>
      contentApi.addToWatchlist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success('Added to My List');
    },
  });

  const removeFromWatchlist = useMutation({
    mutationFn: (data: { userId: string; contentId: string }) =>
      contentApi.removeFromWatchlist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success('Removed from My List');
    },
  });

  const isWatchlisted = useMemo(() => {
    if (!watchlist || !Array.isArray(watchlist) || !id) return false;
    return watchlist.some((item: { contentId?: string }) => item.contentId === id);
  }, [watchlist, id]);

  const toggleWatchlist = useCallback(() => {
    if (!user || !details) return;
    if (isWatchlisted) {
      removeFromWatchlist.mutate({ userId: user.id, contentId: id! });
    } else {
      addToWatchlist.mutate({
        userId: user.id,
        contentId: id!,
        type: details.type === 'tv' || details.type === 'series' ? 'tv' : 'movie',
      });
    }
  }, [user, details, isWatchlisted, id, addToWatchlist, removeFromWatchlist]);

  // Parse seasons from episodes
  const seasons = useMemo(() => {
    if (!details?.episodes) return [];
    const seasonMap = new Map<number, typeof details.episodes>();
    for (const ep of details.episodes) {
      const season = ep.seasonNumber || 1;
      if (!seasonMap.has(season)) seasonMap.set(season, []);
      seasonMap.get(season)!.push(ep);
    }
    return Array.from(seasonMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([season, eps]) => ({ season, episodes: eps }));
  }, [details?.episodes]);

  const currentSeasonEpisodes = useMemo(() => {
    if (!seasons.length) return [];
    const found = seasons.find((s) => s.season === selectedSeason);
    return found?.episodes || seasons[0]?.episodes || [];
  }, [seasons, selectedSeason]);

  const filteredEpisodes = useMemo(() => {
    if (!episodeSearch.trim()) return currentSeasonEpisodes;
    const q = episodeSearch.toLowerCase();
    return currentSeasonEpisodes.filter(
      (ep) =>
        ep.title?.toLowerCase().includes(q) ||
        ep.name?.toLowerCase().includes(q) ||
        ep.episodeNumber?.toString().includes(q)
    );
  }, [currentSeasonEpisodes, episodeSearch]);

  const sortedStreams: Stream[] = useMemo(() => {
    const streams = streamsData?.streams || [];
    return [...streams].sort((a, b) => {
      const qA = parseInt(a.quality || '0') || 0;
      const qB = parseInt(b.quality || '0') || 0;
      return qB - qA;
    });
  }, [streamsData?.streams]);

  const handleStreamSelect = useCallback(
    (stream: Stream) => {
      if (!details) return;
      const titleSlug = (details.name || details.title || 'untitled')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      navigate(`/watch/${titleSlug}?id=${id}&stream=${encodeURIComponent(stream.url)}`, {
        state: {
          title: details.name || details.title,
          stream,
          backdropUrl: details.backdropUrl,
        },
      });
    },
    [details, id, navigate]
  );

  const handleEpisodeClick = useCallback(
    (episode: { id?: string; videoId?: string }) => {
      if (!details) return;
      const episodeId = episode.videoId || episode.id || id;
      const titleSlug = (details.name || details.title || 'untitled')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      navigate(`/watch/${titleSlug}?id=${episodeId}`, {
        state: {
          title: details.name || details.title,
          backdropUrl: details.backdropUrl,
        },
      });
    },
    [details, id, navigate]
  );

  const handlePlay = useCallback(() => {
    if (sortedStreams.length > 0) {
      handleStreamSelect(sortedStreams[0]);
    } else if (details?.episodes?.length) {
      handleEpisodeClick(details.episodes[0]);
    }
  }, [sortedStreams, details, handleStreamSelect, handleEpisodeClick]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (detailsLoading) return <DetailSkeleton />;

  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 text-[15px] mb-4">Content not found</p>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-exyo-red hover:text-exyo-red-hover text-[14px] font-medium transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Hero backdrop */}
      <div className="relative h-[60vh] sm:h-[70vh] overflow-hidden">
        {details.backdropUrl && (
          <img
            src={details.backdropUrl}
            alt=""
            className="w-full h-full object-cover animate-ken-burns"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-exyo-bg via-exyo-bg/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-exyo-bg/80 to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-black/40 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/60 border border-white/[0.06] transition-all duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content info overlay */}
        <div className="absolute bottom-0 inset-x-0 z-20 px-6 lg:px-10 pb-8 max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-end">
            {/* Poster */}
            {details.posterUrl && (
              <div className="hidden lg:block w-44 shrink-0">
                <img
                  src={details.posterUrl}
                  alt={details.name || details.title}
                  className="w-full aspect-[2/3] object-cover rounded-2xl shadow-2xl"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 max-w-[700px]">
              {/* Type badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-exyo-red text-[12px] font-bold uppercase tracking-wider">
                  {details.type === 'tv' || details.type === 'series' ? 'TV Series' : 'Movie'}
                </span>
                {details.rating && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/15 text-yellow-400 text-[12px] font-semibold">
                    <StarIcon className="w-3 h-3 fill-current" />
                    {details.rating}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-white text-[32px] sm:text-[44px] lg:text-[52px] font-bold leading-[1.05] tracking-tight mb-3">
                {details.name || details.title || 'Untitled'}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {details.year && (
                  <span className="inline-flex items-center gap-1 text-white/60 text-[13px]">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {details.year}
                  </span>
                )}
                {details.runtime && (
                  <span className="inline-flex items-center gap-1 text-white/60 text-[13px]">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {details.runtime}m
                  </span>
                )}
                {details.genres?.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-white/50 text-[12px] font-medium border border-white/[0.04]"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Description */}
              {details.description && (
                <p className="text-white/60 text-[14px] leading-relaxed line-clamp-3 mb-6">
                  {details.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlay}
                  disabled={sortedStreams.length === 0 && (!details.episodes || details.episodes.length === 0)}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-white text-black font-semibold text-[15px] hover:bg-white/90 transition-all duration-200 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <PlayIcon className="w-5 h-5 fill-black" />
                  <span>Play</span>
                </button>

                {isSignedIn && (
                  <button
                    onClick={toggleWatchlist}
                    disabled={addToWatchlist.isPending || removeFromWatchlist.isPending}
                    className={cn(
                      'inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-[14px] transition-all duration-200 border',
                      isWatchlisted
                        ? 'bg-white/[0.08] border-white/[0.12] text-white'
                        : 'bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]'
                    )}
                  >
                    {isWatchlisted ? (
                      <>
                        <CheckIcon className="w-5 h-5 text-exyo-red" />
                        <span>In My List</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-5 h-5" />
                        <span>My List</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard');
                  }}
                  className="p-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white border border-white/[0.06] transition-all duration-200"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 -mt-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Main info */}
          <div className="flex-1 min-w-0">
            {/* Cast */}
            {details.cast && details.cast.length > 0 && (
              <div className="mb-8">
                <h3 className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">
                  Cast
                </h3>
                <div className="flex flex-wrap gap-2">
                  {details.cast.slice(0, 8).map((name) => (
                    <span
                      key={name}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-white/60 text-[13px] border border-white/[0.04]"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trailer */}
            {details.trailerStreams && details.trailerStreams.length > 0 && (
              <div className="mb-8">
                <h3 className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">
                  Trailer
                </h3>
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                  {details.trailerStreams.map((trailer, i) => (
                    <a
                      key={`${trailer.url}-${i}`}
                      href={trailer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-none w-64 aspect-video rounded-xl overflow-hidden relative group bg-exyo-elevated border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                        <PlayCircleIcon className="w-12 h-12 text-white/70 group-hover:text-white transition-colors" />
                      </div>
                      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="text-white text-[12px] font-medium">
                          {trailer.name || `Trailer ${i + 1}`}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar: Episodes / Streams */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-exyo-card rounded-2xl border border-white/[0.04] overflow-hidden">
              {/* Sidebar header */}
              <div className="px-5 py-4 border-b border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-[15px] font-semibold">
                    {details.type === 'tv' || details.type === 'series'
                      ? `Season ${selectedSeason}`
                      : 'Streams'}
                  </h3>
                  <span className="text-white/30 text-[12px]">
                    {details.type === 'tv' || details.type === 'series'
                      ? `${filteredEpisodes.length} episodes`
                      : `${sortedStreams.length} streams`}
                  </span>
                </div>

                {/* Season dropdown */}
                {details.type === 'tv' && seasons.length > 1 && (
                  <div className="mt-3 relative">
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                      className="w-full appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-exyo-red/40 transition-colors cursor-pointer"
                    >
                      {seasons.map((s) => (
                        <option key={s.season} value={s.season} className="bg-exyo-card text-white">
                          Season {s.season}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                )}

                {/* Episode search (series only) */}
                {details.type === 'tv' && currentSeasonEpisodes.length > 3 && (
                  <div className="mt-3 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      placeholder="Search episodes..."
                      value={episodeSearch}
                      onChange={(e) => setEpisodeSearch(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-white text-[13px] placeholder-white/30 focus:outline-none focus:border-exyo-red/40 transition-colors"
                    />
                    {episodeSearch && (
                      <button
                        onClick={() => setEpisodeSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Episode/stream list */}
              <div className="max-h-[480px] overflow-y-auto overscroll-contain">
                {details.type === 'tv' || details.type === 'series' ? (
                  // Episodes
                  filteredEpisodes.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-white/40 text-[13px]">
                        {episodeSearch ? 'No episodes match your search' : 'No episodes available'}
                      </p>
                    </div>
                  ) : (
                    filteredEpisodes.map((ep) => {
                      const epId = ep.videoId || ep.id || id;
                      const epImage = ep.stillUrl || ep.posterUrl || details.backdropUrl;

                      return (
                        <button
                          key={epId}
                          onClick={() => handleEpisodeClick(ep)}
                          className="w-full text-left flex gap-3 p-4 hover:bg-white/[0.03] transition-all duration-200 border-b border-white/[0.03] last:border-0 group"
                        >
                          {/* Thumbnail */}
                          <div className="w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-exyo-elevated shrink-0 relative">
                            {epImage && (
                              <img
                                src={epImage}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all">
                              <PlayCircleIcon className="w-8 h-8 text-white/70 group-hover:text-white transition-colors" />
                            </div>
                            {ep.runtime && (
                              <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium">
                                {ep.runtime}m
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 py-0.5">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white/30 text-[11px] font-medium">
                                E{ep.episodeNumber || '?'}
                              </span>
                              {ep.rating && (
                                <span className="text-yellow-400/70 text-[11px] font-medium flex items-center gap-0.5">
                                  <StarIcon className="w-2.5 h-2.5 fill-current" />
                                  {ep.rating}
                                </span>
                              )}
                            </div>
                            <h4 className="text-white text-[13px] font-medium line-clamp-1 mb-1">
                              {ep.name || ep.title || `Episode ${ep.episodeNumber}`}
                            </h4>
                            <p className="text-white/40 text-[12px] line-clamp-2 leading-relaxed">
                              {ep.description || 'No description available.'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )
                ) : (
                  // Movie streams
                  sortedStreams.length === 0 ? (
                    <div className="p-8 text-center">
                      {streamsLoading ? (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 border-2 border-exyo-red/20 border-t-exyo-red rounded-full animate-spin mb-3" />
                          <p className="text-white/40 text-[13px]">Loading streams...</p>
                        </div>
                      ) : (
                        <p className="text-white/40 text-[13px]">No streams available</p>
                      )}
                    </div>
                  ) : (
                    sortedStreams.map((stream, i) => (
                      <button
                        key={`${stream.url}-${i}`}
                        onClick={() => handleStreamSelect(stream)}
                        className="w-full text-left p-4 hover:bg-white/[0.03] transition-all duration-200 border-b border-white/[0.03] last:border-0 group flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-exyo-red/10 transition-colors shrink-0">
                          <PlayIcon className="w-4 h-4 text-white/40 group-hover:text-exyo-red transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-white text-[13px] font-medium truncate">
                              {stream.name || stream.title || `Stream ${i + 1}`}
                            </span>
                            {stream.quality && stream.quality !== 'Unknown' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50 shrink-0">
                                {stream.quality}
                              </span>
                            )}
                          </div>
                          <span className="text-white/30 text-[11px]">
                            {stream.videoCodec && stream.videoCodec !== 'Unknown'
                              ? stream.videoCodec.toUpperCase()
                              : 'Auto'}
                          </span>
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
