import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMutation as useConvexMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { usePlayer, type PlayerStream } from '../hooks/usePlayer';
import { useTorrentPlayer } from '../hooks/useTorrentPlayer';
import PlayerControls from '../components/player/PlayerControls';
import StreamSelector from '../components/player/StreamSelector';
import SubtitleRenderer from '../components/player/SubtitleRenderer';
import PlayerSettings from '../components/player/PlayerSettings';
import NextEpisodePopup from '../components/player/NextEpisodePopup';
import type { EpisodeInfo } from '../components/player/NextEpisodePopup';
import StreamStatsOverlay from '../components/player/StreamStatsOverlay';
import TorrentStatsOverlay from '../components/player/TorrentStatsOverlay';
import { contentApi } from '../api/content.api';
import { ELogo } from '../components/Logo';
import { useAuthStore } from '../stores/authStore';
import { formatTime } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';

export default function Watch() {
  const { id: slug } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const id = searchParams.get('id') || slug;

  const title = location.state?.title as string | undefined;
  const backdropUrl = location.state?.backdropUrl as string | undefined;
  const initialStream = location.state?.stream as PlayerStream | undefined;
  const contentType = location.state?.contentType as string | undefined;
  const episodes = location.state?.episodes as EpisodeInfo[] | undefined;
  const currentEpisodeIndex = location.state?.episodeIndex as number | undefined;
  const user = useAuthStore((s) => s.user);

  const streamType = contentType || (id?.includes(':') ? 'series' : 'movie');
  const isTv = streamType === 'series' || streamType === 'anime';

  const { data: streamsData, isLoading: streamsLoading } = useQuery({
    queryKey: ['contentStreams', id, streamType],
    queryFn: () => contentApi.getStreams(id!, streamType),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: subtitlesData } = useQuery({
    queryKey: ['contentSubtitles', id, streamType],
    queryFn: () => contentApi.getSubtitles(id!, streamType),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const rawStreams: PlayerStream[] = useMemo(() => {
    const fetched = streamsData?.streams
      ? streamsData.streams.map((s) => ({
          url: s.url,
          proxiedUrl: s.proxiedUrl || undefined,
          name: s.name || s.title,
          title: s.name || s.title,
          quality: s.quality,
          codec: s.videoCodec || s.codec,
          infoHash: s.infoHash,
          addon: s.addon,
          addonName: s.addonName,
          addonUrl: s.addonUrl,
          behaviorHints: s.behaviorHints as any,
          isTorrent: !!s.infoHash && (!s.url || s.url.startsWith('magnet:')),
        }))
      : [];

    if (initialStream) {
      const seen = new Set<string>();
      seen.add(initialStream.url);
      const rest = fetched.filter((s) => {
        if (seen.has(s.url)) return false;
        seen.add(s.url);
        return true;
      });
      return [initialStream, ...rest];
    }
    return fetched;
  }, [streamsData, initialStream]);

  const subtitleTracks = useMemo(() => {
    if (!subtitlesData?.subtitles) return [];
    return subtitlesData.subtitles.map((s: any) => ({
      url: s.url,
      lang: s.lang || 'en',
      label: s.label || s.lang || 'English',
    }));
  }, [subtitlesData]);

  const updateProgress = useConvexMutation(api.watchHistory.addOrUpdate);

  const player = usePlayer({
    streams: rawStreams,
    subtitles: subtitleTracks,
    onProgress: user
      ? (progress: number) => {
          if (id && progress > 0.05) {
            const type = id.includes(':') ? 'series' : 'movie';
            updateProgress({
              contentId: id,
              title: title || 'Untitled',
              contentType: type,
              progress,
              backdropUrl,
            }).catch(() => {});
          }
        }
      : undefined,
  });

  const torrent = useTorrentPlayer();
  const [showStats, setShowStats] = useState(false);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const isTorrentStreamRef = useRef(false);
  const torrentResolvingRef = useRef(false);

  // --- RESUME FROM LAST POSITION ---
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);
  const resumeCheckedRef = useRef(false);

  // Resume: check localStorage for saved progress
  useEffect(() => {
    if (!user || !id || resumeCheckedRef.current) return;
    resumeCheckedRef.current = true;

    const checkResume = async () => {
      try {
        const mod = await import('convex/react');
        // Can't call query from here directly, use a different approach
        // Store last progress in localStorage keyed by contentId
        const key = `exyo:progress:${id}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          const { progress } = JSON.parse(saved);
          if (progress > 5 && progress < 95) {
            setResumeTime(progress);
            setShowResumePrompt(true);
          }
        }
      } catch {}
    };
    checkResume();
  }, [user, id]);

  // Save progress to localStorage as well for resume
  const lastProgressRef = useRef(0);
  useEffect(() => {
    if (!id || player.duration <= 0) return;
    const pct = (player.currentTime / player.duration) * 100;
    lastProgressRef.current = pct;
    if (pct > 5 && pct < 95) {
      try {
        localStorage.setItem(`exyo:progress:${id}`, JSON.stringify({ progress: pct, time: player.currentTime }));
      } catch {}
    }
  }, [player.currentTime, player.duration, id]);

  const handleResume = useCallback(() => {
    if (player.duration > 0) {
      const seekTo = (resumeTime / 100) * player.duration;
      player.seekTo(seekTo);
    }
    setShowResumePrompt(false);
  }, [player, resumeTime]);

  const handleStartFromBeginning = useCallback(() => {
    setShowResumePrompt(false);
  }, []);

  useEffect(() => {
    if (subtitleTracks.length > 0 && !player.activeSubtitleUrl && player.showSubtitles) {
      player.setActiveSubtitleUrl(subtitleTracks[0].url);
    }
  }, [subtitleTracks, player]);

  // ─── Torrent stream resolution ──────────────────────────────
  // When the selected stream is a torrent (infoHash, no playable URL),
  // use WebTorrent to stream directly to the video element.
  useEffect(() => {
    const stream = player.selectedStream;
    if (!stream || !player.videoRef.current) return;

    const isTorrent = !!stream.infoHash && (!stream.url || stream.url.startsWith('magnet:'));

    if (isTorrent) {
      isTorrentStreamRef.current = true;
      if (!torrentResolvingRef.current) {
        torrentResolvingRef.current = true;
        torrent.resolveTorrent(stream.infoHash!, player.videoRef.current);
      }
    } else {
      isTorrentStreamRef.current = false;
      torrentResolvingRef.current = false;
      if (torrent.status !== 'idle') {
        torrent.cleanup();
      }
    }
  }, [player.selectedStream, torrent]);

  // Clean up torrent on unmount
  useEffect(() => {
    return () => {
      torrent.cleanup();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nextEpisode = useMemo<EpisodeInfo | null>(() => {
    if (!isTv || !episodes || currentEpisodeIndex === undefined) return null;
    const nextIdx = currentEpisodeIndex + 1;
    if (nextIdx >= episodes.length) return null;
    return episodes[nextIdx];
  }, [isTv, episodes, currentEpisodeIndex]);

  useEffect(() => {
    if (!nextEpisode) return;
    if (player.duration > 0 && player.currentTime > 0) {
      const remaining = player.duration - player.currentTime;
      if (remaining <= 10 && remaining > 0 && player.isPlaying) {
        setShowNextEpisode(true);
      }
    }
  }, [player.currentTime, player.duration, player.isPlaying, nextEpisode]);

  const handlePlayNextEpisode = useCallback(() => {
    if (!nextEpisode) return;
    setShowNextEpisode(false);
    const slugName = (nextEpisode.title || `episode-${nextEpisode.episodeNumber}`)
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigate(`/watch/${slugName}?id=${nextEpisode.id}`, {
      state: {
        title: nextEpisode.title,
        backdropUrl,
        episodes,
        episodeIndex: (currentEpisodeIndex ?? 0) + 1,
        contentType: streamType,
      },
    });
  }, [nextEpisode, navigate, episodes, currentEpisodeIndex, streamType, backdropUrl]);

  const handleBack = useCallback(() => {
    if (id) {
      const resolvedType = contentType === 'anime' ? 'anime' : id.includes(':') ? 'series' : 'movie';
      navigate(`/${resolvedType}/${id}`);
    } else {
      navigate(-1);
    }
  }, [id, navigate, contentType]);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControlsTemporarily = useCallback(() => {
    player.setShowControls(true);
    document.body.style.cursor = 'default';
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (player.isPlaying) {
        player.setShowControls(false);
        document.body.style.cursor = 'none';
      }
    }, 3000);
  }, [player]);

  useEffect(() => () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (player.showStreamSelector) {
          player.setShowStreamSelector(false);
        } else if (player.showSettings) {
          player.setShowSettings(false);
        } else if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          handleBack();
        }
      }
      if ((e.key === 'd' || e.key === 'D') && !(e.target instanceof HTMLInputElement)) {
        setShowStats((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleBack, player.showStreamSelector, player.showSettings, player.setShowStreamSelector, player.setShowSettings]);

  // --- LONG-PRESS TO 2X SPEED ---
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressingRef = useRef(false);
  const prevSpeedRef = useRef(1);
  const [isLongPressSpeed, setIsLongPressSpeed] = useState(false);

  const handleLongPressStart = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressingRef.current = true;
      prevSpeedRef.current = player.playbackRate;
      player.changePlaybackRate(2);
      setIsLongPressSpeed(true);
    }, 400);
  }, [player.playbackRate]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressingRef.current) {
      player.changePlaybackRate(prevSpeedRef.current);
      isLongPressingRef.current = false;
      setIsLongPressSpeed(false);
    }
  }, [player]);

  // --- MOBILE TOUCH GESTURES (swipe + double-tap) ---
  const isMobile = useMemo(() =>
    typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    []
  );

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapTimeRef = useRef(0);
  const lastTapXRef = useRef(0);
  const [swipeIndicator, setSwipeIndicator] = useState<{ side: 'left' | 'right'; type: 'volume' | 'brightness'; value: number } | null>(null);
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);
  const [doubleTapRipple, setDoubleTapRipple] = useState<{ x: number; y: number; side: 'left' | 'right' } | null>(null);
  const [longPressIndicator, setLongPressIndicator] = useState(false);

  const brightnessRef = useRef(1);
  const [brightness, setBrightness] = useState(1);
  const volumeStartRef = useRef(0);
  const brightnessStartRef = useRef(0);
  const swipeStartYRef = useRef(0);

  useEffect(() => {
    if (isLongPressSpeed) {
      setLongPressIndicator(true);
      const t = setTimeout(() => setLongPressIndicator(false), 1500);
      return () => clearTimeout(t);
    }
    setLongPressIndicator(false);
  }, [isLongPressSpeed]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    volumeStartRef.current = player.volume;
    brightnessStartRef.current = brightnessRef.current;
    swipeStartYRef.current = touch.clientY;
    handleLongPressStart();
  }, [player.volume, handleLongPressStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    // If moved significantly, cancel long-press
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    const screenW = window.innerWidth;
    const isLeftSide = touchStartRef.current.x < screenW / 2;

    // Vertical swipe = volume/brightness
    if (Math.abs(dy) > 20 && Math.abs(dy) > Math.abs(dx)) {
      const delta = (swipeStartYRef.current - touch.clientY) / window.innerHeight;

      if (isLeftSide) {
        // Left side = brightness
        const newBright = Math.max(0.1, Math.min(1, brightnessStartRef.current + delta));
        brightnessRef.current = newBright;
        setBrightness(newBright);
        setSwipeIndicator({ side: 'left', type: 'brightness', value: Math.round(newBright * 100) });
      } else {
        // Right side = volume
        const newVol = Math.max(0, Math.min(1, volumeStartRef.current + delta));
        player.setVolumeTo(newVol);
        setSwipeIndicator({ side: 'right', type: 'volume', value: Math.round(newVol * 100) });
      }
    } else {
      setSwipeIndicator(null);
    }
  }, [player]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    handleLongPressEnd();
    setSwipeIndicator(null);

    if (!touchStartRef.current) return;
    const endTouch = e.changedTouches[0];
    const dx = endTouch.clientX - touchStartRef.current.x;
    const dy = endTouch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;

    // If it was a short tap with minimal movement
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && elapsed < 300) {
      const now = Date.now();
      const tapX = endTouch.clientX;
      const screenW = window.innerWidth;
      const side = tapX < screenW / 2 ? 'left' : 'right';

      // Double-tap detection (< 300ms, same side)
      if (now - lastTapTimeRef.current < 300 && Math.abs(tapX - lastTapXRef.current) < screenW / 2) {
        // Double tap: skip ±10s
        if (side === 'left') {
          player.skip(-10);
        } else {
          player.skip(10);
        }
        // Show ripple
        setDoubleTapRipple({ x: tapX, y: endTouch.clientY, side });
        setTimeout(() => setDoubleTapRipple(null), 600);
        setDoubleTapSide(null);
        lastTapTimeRef.current = 0;
      } else {
        // Single tap: toggle controls
        lastTapTimeRef.current = now;
        lastTapXRef.current = tapX;
        setDoubleTapSide(side);

        // Toggle play on single tap (after short delay to check for double)
        setTimeout(() => {
          if (lastTapTimeRef.current === now) {
            // No double-tap happened, this was a single tap
            if (player.showControls) {
              player.setShowControls(false);
            } else {
              showControlsTemporarily();
            }
          }
        }, 320);
      }
    }

    touchStartRef.current = null;
  }, [player, handleLongPressEnd, showControlsTemporarily]);

  // Desktop click handler (non-touch devices)
  const lastClickTime = useRef(0);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (isMobile) return; // Mobile uses touch handlers
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('[data-no-play]')) return;
    const now = Date.now();
    if (now - lastClickTime.current < 300) {
      player.toggleFullscreen();
      lastClickTime.current = 0;
    } else {
      lastClickTime.current = now;
      player.togglePlay();
    }
  }, [player, isMobile]);

  // Mini player: when navigating back with video playing, could show mini player
  // Currently handled by PiP feature

  return (
    <div
      ref={player.containerRef}
      className="fixed inset-0 bg-black"
      onMouseMove={!isMobile ? showControlsTemporarily : undefined}
      onClick={!isMobile ? handleContainerClick : undefined}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      style={{
        filter: brightness < 1 ? `brightness(${brightness})` : undefined,
      }}
    >
      <video ref={player.videoRef} className="w-full h-full object-contain" playsInline />
      <canvas
        ref={player.canvasRef}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ display: player.isStreamingPlayer ? 'block' : 'none' }}
      />

      {/* Long-press 2x speed indicator */}
      <AnimatePresence>
        {longPressIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-2">
              <Play className="w-5 h-5 text-white fill-white" />
              <span className="text-white font-bold text-lg">2x</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe indicator (volume/brightness) */}
      <AnimatePresence>
        {swipeIndicator && (
          <motion.div
            initial={{ opacity: 0, x: swipeIndicator.side === 'left' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className={`absolute top-1/2 -translate-y-1/2 z-50 pointer-events-none ${
              swipeIndicator.side === 'left' ? 'left-8' : 'right-8'
            }`}
          >
            <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-3 flex flex-col items-center gap-1 min-w-[60px]">
              <div className="text-white text-2xl font-bold">{swipeIndicator.value}%</div>
              <div className="text-white/50 text-xs uppercase tracking-wider">
                {swipeIndicator.type === 'volume' ? 'Vol' : 'Bright'}
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1">
                <div
                  className="h-full bg-red rounded-full transition-all"
                  style={{ width: `${swipeIndicator.value}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double-tap ±10s ripple */}
      <AnimatePresence>
        {doubleTapRipple && (
          <motion.div
            initial={{ opacity: 0.7, scale: 0 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute z-50 pointer-events-none"
            style={{
              left: doubleTapRipple.x - 30,
              top: doubleTapRipple.y - 30,
            }}
          >
            <div className="w-[60px] h-[60px] rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {doubleTapRipple.side === 'left' ? (
                <RotateCcw className="w-6 h-6 text-white" />
              ) : (
                <div className="w-6 h-6 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">10</span>
                  <span className="text-white text-xs">s</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {player.showSubtitles && player.activeSubtitleUrl && (
        <SubtitleRenderer
          currentTime={player.currentTime}
          subtitleUrl={player.activeSubtitleUrl}
          isActive={player.showSubtitles}
        />
      )}

      {(player.isBuffering || (isTorrentStreamRef.current && torrent.status === 'loading')) && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <ELogo size={48} animate />
            <p className="text-white/40 text-sm font-medium">
              {isTorrentStreamRef.current && torrent.status === 'loading'
                ? `Connecting to peers... ${torrent.peers > 0 ? `(${torrent.peers} peers)` : ''}`
                : 'Loading stream...'}
            </p>
            {isTorrentStreamRef.current && torrent.status === 'loading' && torrent.progress > 0 && (
              <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(torrent.progress, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {player.videoError && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/80 backdrop-blur-sm">
          <div className="glass glass-border rounded-3xl p-10 text-center max-w-md">
            <p className="text-white font-bold text-lg mb-2">Playback Error</p>
            <p className="text-white/40 text-sm mb-6">{player.videoError}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); player.clearErrorAndOpenSelector(); }}
                className="px-6 py-3 rounded-xl bg-white/[0.08] text-white text-sm font-medium hover:bg-white/[0.14] transition-all border border-white/[0.08]"
              >
                Try Another Stream
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleBack(); }}
                className="px-6 py-3 rounded-xl bg-white/[0.08] text-white/50 text-sm font-medium hover:bg-white/[0.14] transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Torrent error */}
      {isTorrentStreamRef.current && torrent.status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/80 backdrop-blur-sm">
          <div className="glass glass-border rounded-3xl p-10 text-center max-w-md">
            <p className="text-white font-bold text-lg mb-2">Torrent Error</p>
            <p className="text-white/40 text-sm mb-6">{torrent.error || 'Failed to connect to torrent swarm'}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (player.selectedStream?.infoHash && player.videoRef.current) {
                    torrentResolvingRef.current = false;
                    torrent.cleanup();
                    torrent.resolveTorrent(player.selectedStream.infoHash, player.videoRef.current);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-white/[0.08] text-white text-sm font-medium hover:bg-white/[0.14] transition-all border border-white/[0.08]"
              >
                Retry
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); player.clearErrorAndOpenSelector(); }}
                className="px-6 py-3 rounded-xl bg-white/[0.08] text-white text-sm font-medium hover:bg-white/[0.14] transition-all border border-white/[0.08]"
              >
                Try Another Stream
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleBack(); }}
                className="px-6 py-3 rounded-xl bg-white/[0.08] text-white/50 text-sm font-medium hover:bg-white/[0.14] transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume prompt */}
      <AnimatePresence>
        {showResumePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass glass-border rounded-3xl p-8 text-center max-w-sm"
            >
              <p className="text-white font-bold text-lg mb-2">Resume Playback</p>
              <p className="text-white/50 text-sm mb-6">
                Continue from {formatTime((resumeTime / 100) * (player.duration || 0))}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleResume(); }}
                  className="px-6 py-3 rounded-xl bg-red text-white text-sm font-bold hover:bg-red/80 transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Resume
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleStartFromBeginning(); }}
                  className="px-6 py-3 rounded-xl bg-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.14] transition-all"
                >
                  Start from Beginning
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerControls
        visible={player.showControls}
        playing={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        buffered={player.buffered}
        volume={player.volume}
        muted={player.isMuted}
        isFullscreen={player.isFullscreen}
        playbackRate={player.playbackRate}
        currentStream={player.selectedStream}
        onPlayPause={player.togglePlay}
        onSeek={player.seekTo}
        onVolumeChange={player.setVolumeTo}
        onMuteToggle={player.toggleMute}
        onFullscreenToggle={player.toggleFullscreen}
        onSpeedChange={player.changePlaybackRate}
        onBack={handleBack}
        onOpenSettings={() => player.setShowSettings(true)}
        onOpenStreams={() => player.setShowStreamSelector(true)}
        onSubtitleToggle={player.toggleSubtitles}
        showSubtitles={player.showSubtitles}
        showStats={showStats}
        onToggleStats={() => setShowStats((p) => !p)}
        onPiP={player.togglePiP}
      />

      <StreamStatsOverlay
        videoRef={player.videoRef}
        visible={showStats}
      />

      <TorrentStatsOverlay
        stats={isTorrentStreamRef.current ? {
          peers: torrent.peers,
          downloadSpeed: torrent.downloadSpeed,
          uploadSpeed: torrent.uploadSpeed,
          progress: torrent.progress,
          downloaded: torrent.downloaded,
          uploaded: torrent.uploaded,
        } : null}
        visible={showStats && isTorrentStreamRef.current && torrent.status !== 'idle'}
      />

      {player.showStreamSelector && (
        <StreamSelector
          streams={rawStreams}
          currentStream={player.selectedStream}
          onSelect={player.selectStream}
          onClose={() => player.setShowStreamSelector(false)}
          loading={streamsLoading}
        />
      )}

      {player.showSettings && (
        <PlayerSettings
          open={player.showSettings}
          onClose={() => player.setShowSettings(false)}
          playbackRate={player.playbackRate}
          onSpeedChange={player.changePlaybackRate}
          audioTracks={player.audioTracks}
          activeAudioTrack={player.activeAudioTrack}
          onAudioTrackSelect={player.switchAudioTrack}
          subtitleTracks={subtitleTracks}
          activeSubtitleUrl={player.activeSubtitleUrl}
          onSubtitleTrackSelect={player.selectSubtitleTrack}
          showSubtitles={player.showSubtitles}
        />
      )}

      <NextEpisodePopup
        show={showNextEpisode}
        nextEpisode={nextEpisode}
        onPlayNext={handlePlayNextEpisode}
        onDismiss={() => setShowNextEpisode(false)}
      />
    </div>
  );
}
