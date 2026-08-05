import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeftIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { usePlayer } from '../hooks/usePlayer';
import PlayerControls from '../components/player/PlayerControls';
import StreamSelector from '../components/player/StreamSelector';
import SubtitleRenderer from '../components/player/SubtitleRenderer';
import { contentApi } from '../api/content.api';
import type { Stream } from '../types';

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const title = location.state?.title as string | undefined;
  const backdropUrl = location.state?.backdropUrl as string | undefined;
  const streamParam = searchParams.get('stream');
  const initialStream: Stream | undefined = streamParam
    ? { url: streamParam, name: location.state?.stream?.name || 'Stream' }
    : undefined;

  const [selectedStream, setSelectedStream] = useState<Stream | null>(initialStream || null);
  const [showStreamSelector, setShowStreamSelector] = useState(!initialStream);
  const [showControls, setShowControls] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);

  const { data: streamsData, isLoading: streamsLoading } = useQuery({
    queryKey: ['contentStreams', id],
    queryFn: () => contentApi.getStreams(id!),
    enabled: !!id,
  });

  const streams = streamsData?.streams || [];

  // Auto-select first stream if none selected and streams are loaded
  useEffect(() => {
    if (!selectedStream && streams.length > 0 && !streamsLoading) {
      setSelectedStream(streams[0]);
    }
  }, [selectedStream, streams, streamsLoading]);

  // If URL has stream param, navigate with it
  useEffect(() => {
    if (streamParam && !selectedStream) {
      setSelectedStream({ url: streamParam, name: 'Stream' });
    }
  }, [streamParam]);

  const handleStreamSelect = useCallback((stream: Stream) => {
    setSelectedStream(stream);
    setShowStreamSelector(false);
  }, []);

  const handleBack = useCallback(() => {
    if (id) {
      const type = id.includes(':') ? 'series' : 'movie';
      navigate(`/${type}/${id}`);
    } else {
      navigate(-1);
    }
  }, [id, navigate]);

  const player = usePlayer({
    streamUrl: selectedStream?.url || null,
    containerRef,
    title: title || 'Video',
    onError: (error) => {
      console.error('Player error:', error);
    },
  });

  // Hide controls after inactivity
  useEffect(() => {
    if (!player.playing) return;
    let timeout: ReturnType<typeof setTimeout>;
    const show = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 4000);
    };
    show();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', show);
      container.addEventListener('touchstart', show);
    }
    return () => {
      clearTimeout(timeout);
      if (container) {
        container.removeEventListener('mousemove', show);
        container.removeEventListener('touchstart', show);
      }
    };
  }, [player.playing]);

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
          player.seek(Math.max(0, player.currentTime - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          player.seek(Math.min(player.duration, player.currentTime + 10));
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
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [player, handleBack]);

  if (!selectedStream) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Back button */}
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={handleBack}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-all duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
        </div>

        {streamsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-exyo-red/20 border-t-exyo-red rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/50 text-[14px]">Loading streams...</p>
            </div>
          </div>
        ) : streams.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <p className="text-white/70 text-[16px] font-medium mb-2">No streams available</p>
              <p className="text-white/40 text-[13px]">Try again later or select a different title.</p>
              <button
                onClick={handleBack}
                className="mt-6 px-6 py-2.5 rounded-xl bg-exyo-red hover:bg-exyo-red-hover text-white text-[13px] font-semibold transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <StreamSelector
            streams={streams}
            onSelect={handleStreamSelect}
            onClose={() => setShowStreamSelector(false)}
            loading={streamsLoading}
          />
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black cursor-none"
      onMouseMove={() => setShowControls(true)}
    >
      {/* Video element (used by hls.js and native playback) */}
      <video
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        onClick={player.togglePlay}
      />

      {/* Canvas for movi-player (MKV/HEVC/AV1) */}
      <canvas
        className="absolute inset-0 w-full h-full object-contain"
        style={{ display: player.canvasActive ? 'block' : 'none' }}
      />

      {/* Subtitles */}
      {showSubtitles && player.currentSubtitle && (
        <SubtitleRenderer
          text={player.currentSubtitle.text}
          style={player.currentSubtitle.style}
        />
      )}

      {/* Controls overlay */}
      <PlayerControls
        visible={showControls}
        playing={player.playing}
        currentTime={player.currentTime}
        duration={player.duration}
        buffered={player.buffered}
        volume={player.volume}
        muted={player.muted}
        isFullscreen={player.isFullscreen}
        playbackRate={player.playbackRate}
        currentStream={selectedStream}
        onPlayPause={player.togglePlay}
        onSeek={player.seek}
        onVolumeChange={player.setVolume}
        onMuteToggle={player.toggleMute}
        onFullscreenToggle={player.toggleFullscreen}
        onSpeedChange={player.setPlaybackRate}
        onBack={handleBack}
        onOpenSettings={() => {}}
        onOpenStreams={() => setShowStreamSelector(true)}
        onSubtitleToggle={() => setShowSubtitles(!showSubtitles)}
      />

      {/* Stream selector */}
      {showStreamSelector && (
        <StreamSelector
          streams={streams}
          currentStream={selectedStream}
          onSelect={handleStreamSelect}
          onClose={() => setShowStreamSelector(false)}
          loading={streamsLoading}
        />
      )}
    </div>
  );
}
