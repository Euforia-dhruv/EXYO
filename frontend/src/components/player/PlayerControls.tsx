import { memo, useCallback } from 'react';
import {
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  Bars3BottomLeftIcon,
} from '@heroicons/react/24/outline';
import type { Stream } from '../../types';
import { cn, formatTime } from '../../utils/helpers';

interface PlayerControlsProps {
  visible: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
  currentStream?: Stream | null;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenStreams: () => void;
  onSubtitleToggle?: () => void;
}

function PlayerControls({
  visible,
  playing,
  currentTime,
  duration,
  buffered,
  volume,
  muted,
  isFullscreen,
  playbackRate,
  currentStream,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  onSpeedChange,
  onBack,
  onOpenSettings,
  onOpenStreams,
  onSubtitleToggle,
}: PlayerControlsProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    onSeek(pct * duration);
  }, [duration, onSeek]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value));
  }, [onVolumeChange]);

  const handleSpeedChange = useCallback(() => {
    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const idx = speeds.indexOf(playbackRate);
    const next = speeds[(idx + 1) % speeds.length];
    onSpeedChange(next);
  }, [playbackRate, onSpeedChange]);

  return (
    <div
      className={cn(
        'absolute inset-0 z-30 transition-all duration-300',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Top gradient */}
      <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/70 via-black/20 to-transparent" />

      {/* Bottom gradient */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white transition-all duration-200"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {currentStream && (
            <span className="text-white/40 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-sm">
              {currentStream.name || currentStream.title || 'Stream'}
            </span>
          )}
          {currentStream?.quality && currentStream.quality !== 'Unknown' && (
            <span className="text-exyo-red text-[12px] font-bold px-2.5 py-1.5 rounded-lg bg-exyo-red/10 backdrop-blur-sm">
              {currentStream.quality}
            </span>
          )}
        </div>
      </div>

      {/* Center play/pause (large) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={onPlayPause}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-105"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <PauseIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          ) : (
            <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" />
          )}
        </button>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
        {/* Progress bar */}
        <div
          className="group/progress h-1.5 hover:h-2.5 bg-white/10 rounded-full cursor-pointer transition-all duration-200 mb-4"
          onClick={handleProgressClick}
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(currentTime)}
          aria-valuemax={Math.round(duration)}
        >
          <div className="relative h-full">
            {/* Buffered */}
            <div
              className="absolute inset-y-0 left-0 bg-white/15 rounded-full"
              style={{ width: `${bufferedProgress}%` }}
            />
            {/* Progress */}
            <div
              className="absolute inset-y-0 left-0 bg-exyo-red rounded-full transition-[width] duration-75"
              style={{ width: `${progress}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity duration-200"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Play/Pause */}
            <button
              onClick={onPlayPause}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-white/10 text-white transition-all duration-200"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? (
                <PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>

            {/* Skip -10s */}
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 hidden sm:flex items-center gap-1"
              aria-label="Rewind 10 seconds"
            >
              <BackwardIcon className="w-4 h-4" />
              <span className="text-[11px] font-medium">10</span>
            </button>

            {/* Skip +10s */}
            <button
              onClick={() => onSeek(Math.min(duration, currentTime + 10))}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 hidden sm:flex items-center gap-1"
              aria-label="Forward 10 seconds"
            >
              <ForwardIcon className="w-4 h-4" />
              <span className="text-[11px] font-medium">10</span>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1 group/vol">
              <button
                onClick={onMuteToggle}
                className="p-2 sm:p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? (
                  <SpeakerXMarkIcon className="w-5 h-5" />
                ) : (
                  <SpeakerWaveIcon className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-white h-1 cursor-pointer opacity-0 group-hover/vol:opacity-100"
                aria-label="Volume"
              />
            </div>

            {/* Time */}
            <div className="text-white/50 text-[12px] sm:text-[13px] font-medium tabular-nums ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Subtitles */}
            {onSubtitleToggle && (
              <button
                onClick={onSubtitleToggle}
                className="p-2 sm:p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
                aria-label="Subtitles"
              >
                <Bars3BottomLeftIcon className="w-5 h-5" />
              </button>
            )}

            {/* Stream selector */}
            <button
              onClick={onOpenStreams}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
              aria-label="Change stream"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>

            {/* Speed */}
            <button
              onClick={handleSpeedChange}
              className="px-3 py-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 text-[13px] font-semibold"
              aria-label={`Playback speed: ${playbackRate}x`}
            >
              {playbackRate}x
            </button>

            {/* Fullscreen */}
            <button
              onClick={onFullscreenToggle}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-5 h-5" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PlayerControls);
