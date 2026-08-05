import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize,
  Minimize, Settings, Subtitles, ArrowLeft, Layers, RotateCcw,
} from 'lucide-react';
import { formatTime } from '../../utils/helpers';
import type { PlayerStream } from '../../hooks/usePlayer';

interface Props {
  visible: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
  currentStream: PlayerStream | null;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onSpeedChange: (rate: number) => void;
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenStreams: () => void;
  onSubtitleToggle: () => void;
}

export default function PlayerControls({
  visible, playing, currentTime, duration, buffered, volume, muted,
  isFullscreen, currentStream, onPlayPause, onSeek, onVolumeChange,
  onMuteToggle, onFullscreenToggle, onBack, onOpenSettings, onOpenStreams,
  onSubtitleToggle,
}: Props) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const buffPercent = duration > 0 ? (buffered / 100) * 100 : 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-30 flex flex-col"
        >
          {/* Top gradient */}
          <div className="h-24 bg-gradient-to-b from-black/70 to-transparent" />

          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl glass glass-border flex items-center justify-center hover:bg-white/[0.1] transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm font-medium">
                {currentStream?.name || currentStream?.title || 'Playing'}
              </span>
            </div>
            <div className="w-10" />
          </div>

          {/* Center controls */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-6">
              <button
                onClick={() => onSeek(Math.max(0, currentTime - 10))}
                className="w-14 h-14 rounded-full glass glass-border flex items-center justify-center hover:bg-white/[0.1] transition-all"
              >
                <RotateCcw className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={onPlayPause}
                className="w-18 h-18 rounded-full bg-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                style={{ width: 72, height: 72 }}
              >
                {playing ? (
                  <Pause className="w-8 h-8 text-black fill-black" />
                ) : (
                  <Play className="w-8 h-8 text-black fill-black ml-1" />
                )}
              </button>
              <button
                onClick={() => onSeek(Math.min(duration, currentTime + 10))}
                className="w-14 h-14 rounded-full glass glass-border flex items-center justify-center hover:bg-white/[0.1] transition-all"
              >
                <SkipForward className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Bottom gradient */}
          <div className="h-32 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Bottom controls */}
          <div className="absolute bottom-0 inset-x-0 px-6 pb-5">
            {/* Progress bar */}
            <div className="group/progress mb-3">
              <div
                className="relative h-1 group-hover/progress:h-1.5 bg-white/10 rounded-full cursor-pointer transition-all"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  onSeek((x / rect.width) * duration);
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-white/20 rounded-full"
                  style={{ width: `${buffPercent}%` }}
                />
                <div
                  className="absolute left-0 top-0 bottom-0 bg-red rounded-full"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-red shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
                  style={{ left: `calc(${progress}% - 7px)` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={onPlayPause} className="text-white hover:text-white/80 transition-colors">
                  {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <button
                  onClick={() => onSeek(Math.min(duration, currentTime + 10))}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                {/* Volume */}
                <div className="flex items-center gap-2 group/vol">
                  <button onClick={onMuteToggle} className="text-white/60 hover:text-white transition-colors">
                    {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={muted ? 0 : volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 accent-red opacity-0 group-hover/vol:opacity-100 transition-opacity cursor-pointer"
                  />
                </div>
                <span className="text-white/40 text-xs font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onSubtitleToggle}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  <Subtitles className="w-5 h-5" />
                </button>
                <button
                  onClick={onOpenStreams}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  <Layers className="w-5 h-5" />
                </button>
                <button
                  onClick={onOpenSettings}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={onFullscreenToggle}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
