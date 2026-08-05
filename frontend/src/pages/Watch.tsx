import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { useMutation as useConvexMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { usePlayer, type PlayerStream } from '../hooks/usePlayer';
import PlayerControls from '../components/player/PlayerControls';
import StreamSelector from '../components/player/StreamSelector';
import SubtitleRenderer from '../components/player/SubtitleRenderer';
import { contentApi } from '../api/content.api';

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const title = location.state?.title as string | undefined;
  const backdropUrl = location.state?.backdropUrl as string | undefined;
  const initialStream = location.state?.stream as PlayerStream | undefined;

  const { isSignedIn } = useUser();

  // Fetch streams
  const { data: streamsData, isLoading: streamsLoading } = useQuery({
    queryKey: ['contentStreams', id],
    queryFn: () => contentApi.getStreams(id!),
    enabled: !!id,
  });

  // Fetch subtitles
  const { data: subtitlesData } = useQuery({
    queryKey: ['contentSubtitles', id],
    queryFn: () => contentApi.getSubtitles(id!),
    enabled: !!id,
  });

  const rawStreams: PlayerStream[] = useMemo(() => {
    if (initialStream) return [initialStream];
    if (!streamsData?.streams) return [];
    return streamsData.streams.map((s) => ({
      url: s.url,
      name: s.name || s.title,
      title: s.name || s.title,
      quality: s.quality,
      codec: s.videoCodec || s.codec,
      addon: s.addon,
      behaviorHints: s.behaviorHints,
    }));
  }, [streamsData, initialStream]);

  const subtitleTracks = useMemo(() => {
    if (!subtitlesData?.subtitles) return [];
    return subtitlesData.subtitles.map((s) => ({
      url: s.url,
      lang: s.lang || 'en',
      label: s.label || s.lang || 'English',
    }));
  }, [subtitlesData]);

  const updateProgress = useConvexMutation(api.watchHistory.addOrUpdate);

  const player = usePlayer({
    streams: rawStreams,
    subtitles: subtitleTracks,
    onProgress: isSignedIn
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

  // Auto-select first subtitle when tracks load
  useEffect(() => {
    if (subtitleTracks.length > 0 && !player.activeSubtitleUrl && player.showSubtitles) {
      player.setActiveSubtitleUrl(subtitleTracks[0].url);
    }
  }, [subtitleTracks, player]);

  // Auto-hide controls
  const [controlsTimeout, setControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const showControlsTemporarily = useCallback(() => {
    player.setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() => {
      if (player.isPlaying) player.setShowControls(false);
    }, 4000);
    setControlsTimeout(timeout);
  }, [player, controlsTimeout]);

  useEffect(() => {
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [controlsTimeout]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          player.togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          player.skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          player.skip(10);
          break;
        case 'f':
          e.preventDefault();
          player.toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          player.toggleMute();
          break;
        case 'Escape':
          handleBack();
          break;
        case 'ArrowUp':
          e.preventDefault();
          player.adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          player.adjustVolume(-0.1);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [player]);

  const handleBack = useCallback(() => {
    if (id) {
      const type = id.includes(':') ? 'series' : 'movie';
      navigate(`/${type}/${id}`);
    } else {
      navigate(-1);
    }
  }, [id, navigate]);

  const handleStreamSelect = useCallback(
    (stream: PlayerStream) => {
      player.selectStream(stream);
    },
    [player]
  );

  return (
    <div
      ref={player.containerRef}
      className="fixed inset-0 bg-black cursor-none"
      onMouseMove={showControlsTemporarily}
      onClick={player.togglePlay}
    >
      {/* Video element */}
      <video
        ref={player.videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
      />

      {/* Canvas for movi-player (MKV/HEVC/AV1) */}
      <canvas
        ref={player.canvasRef}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ display: player.isStreamingPlayer ? 'block' : 'none' }}
      />

      {/* Subtitles */}
      {player.showSubtitles && player.activeSubtitleUrl && (
        <SubtitleRenderer
          currentTime={player.currentTime}
          subtitleUrl={player.activeSubtitleUrl}
          isActive={player.showSubtitles}
        />
      )}

      {/* Loading spinner */}
      {player.isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error overlay */}
      {player.videoError && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/80">
          <div className="text-center max-w-md px-6">
            <p className="text-white text-[16px] font-medium mb-2">Playback Error</p>
            <p className="text-white/50 text-[13px] mb-6">{player.videoError}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); player.clearErrorAndOpenSelector(); }}
                className="px-5 py-2.5 rounded-xl bg-white/[0.08] text-white text-[13px] font-medium hover:bg-white/[0.14] transition-all border border-white/[0.08]"
              >
                Try Another Stream
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleBack(); }}
                className="px-5 py-2.5 rounded-xl bg-white/[0.08] text-white/60 text-[13px] font-medium hover:bg-white/[0.14] transition-all border border-white/[0.06]"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls overlay */}
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
      />

      {/* Stream selector */}
      {player.showStreamSelector && (
        <StreamSelector
          streams={rawStreams}
          currentStream={player.selectedStream}
          onSelect={handleStreamSelect}
          onClose={() => player.setShowStreamSelector(false)}
          loading={streamsLoading}
        />
      )}
    </div>
  );
}
