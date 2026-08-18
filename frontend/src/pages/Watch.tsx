import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMutation as useConvexMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { usePlayer, type PlayerStream } from '../hooks/usePlayer';
import PlayerControls from '../components/player/PlayerControls';
import StreamSelector from '../components/player/StreamSelector';
import SubtitleRenderer from '../components/player/SubtitleRenderer';
import PlayerSettings from '../components/player/PlayerSettings';
import NextEpisodePopup from '../components/player/NextEpisodePopup';
import type { EpisodeInfo } from '../components/player/NextEpisodePopup';
import StreamStatsOverlay from '../components/player/StreamStatsOverlay';
import { contentApi } from '../api/content.api';
import { ELogo } from '../components/Logo';
import { useAuthStore } from '../stores/authStore';

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
          addon: s.addon,
          addonName: s.addonName,
          addonUrl: s.addonUrl,
          behaviorHints: s.behaviorHints as any,
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

  const [showStats, setShowStats] = useState(false);
  const [showNextEpisode, setShowNextEpisode] = useState(false);

  useEffect(() => {
    if (subtitleTracks.length > 0 && !player.activeSubtitleUrl && player.showSubtitles) {
      player.setActiveSubtitleUrl(subtitleTracks[0].url);
    }
  }, [subtitleTracks, player]);

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
        episodes,
        episodeIndex: (currentEpisodeIndex ?? 0) + 1,
        contentType: streamType,
      },
    });
  }, [nextEpisode, navigate, episodes, currentEpisodeIndex, streamType]);

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

  const lastClickTime = useRef(0);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
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
  }, [player]);

  return (
    <div
      ref={player.containerRef}
      className="fixed inset-0 bg-black"
      onMouseMove={showControlsTemporarily}
      onClick={handleContainerClick}
    >
      <video ref={player.videoRef} className="w-full h-full object-contain" playsInline />
      <canvas
        ref={player.canvasRef}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ display: player.isStreamingPlayer ? 'block' : 'none' }}
      />

      {player.showSubtitles && player.activeSubtitleUrl && (
        <SubtitleRenderer
          currentTime={player.currentTime}
          subtitleUrl={player.activeSubtitleUrl}
          isActive={player.showSubtitles}
        />
      )}

      {player.isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <ELogo size={48} animate />
            <p className="text-white/40 text-sm font-medium">Loading stream...</p>
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
