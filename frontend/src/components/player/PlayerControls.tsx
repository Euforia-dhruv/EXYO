import { useRef, useState } from 'react';
import { cn, formatTime } from '../../utils/helpers';
import type { PlayerStream } from '../../hooks/usePlayer';

interface PlayerControlsProps {
  contentName: string;
  selectedStream: PlayerStream | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  buffered: number;
  playbackRate: number;
  showSettings: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onTogglePiP: () => void;
  onSkip: (seconds: number) => void;
  onChangePlaybackRate: (rate: number) => void;
  onToggleSettings: () => void;
  onOpenStreams: () => void;
  onDownload: () => void;
  onBack: () => void;
  onToggleSubtitles: () => void;
  showSubtitles: boolean;
  subtitleTracks?: { url: string; lang: string; label: string }[];
  activeSubtitleUrl?: string;
  onSelectSubtitle?: (url: string) => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function PlayerControls({
  contentName,
  selectedStream,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  buffered,
  playbackRate,
  showSettings: settingsOpen,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onTogglePiP,
  onSkip,
  onChangePlaybackRate,
  onToggleSettings,
  onOpenStreams,
  onDownload,
  onBack,
  onToggleSubtitles,
  showSubtitles,
  subtitleTracks = [],
  activeSubtitleUrl,
  onSelectSubtitle,
}: PlayerControlsProps) {
  const seekRef = useRef<HTMLInputElement>(null);
  const [showSubtitlePanel, setShowSubtitlePanel] = useState(false);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseFloat(e.target.value));
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-5 flex items-center justify-between z-10 pointer-events-auto">
        <button onClick={onBack} className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors" aria-label="Go back">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-white font-bold text-[15px]">{contentName}</span>
        <button onClick={onBack} className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors" aria-label="Close player">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-auto" />

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 z-10 pointer-events-auto">
        <div className="max-w-5xl mx-auto">
          {/* Server/Source selector */}
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={onOpenStreams}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 transition-all text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"
                />
              </svg>
              {selectedStream?.addonName || 'Select Source'}
              <span className="text-white/50">&bull;</span>
              {selectedStream?.quality || 'HD'}
              <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-3 relative group cursor-pointer">
            <div className="h-[3px] group-hover:h-[5px] bg-white/20 rounded-full transition-all relative">
              <div
                className="absolute h-full bg-white/40 rounded-full"
                style={{ width: `${buffered}%` }}
              />
              <div
                className="absolute h-full bg-exyo-red rounded-full"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-exyo-red rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-black/50"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
            <input
              ref={seekRef}
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeekChange}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-1.5">
            {/* Play/Pause */}
            <button onClick={onTogglePlay} className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors" aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Skip -10s */}
            <button
              onClick={() => onSkip(-10)}
              className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors hidden md:block"
              title="Rewind 10s"
              aria-label="Rewind 10 seconds"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
            </button>

            {/* Skip +10s */}
            <button
              onClick={() => onSkip(10)}
              className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors hidden md:block"
              title="Forward 10s"
              aria-label="Forward 10 seconds"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
              </svg>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-0.5 group/vol">
              <button onClick={onToggleMute} className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors" aria-label={isMuted ? "Unmute" : "Mute"}>
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="w-0 group-hover/vol:w-16 transition-all duration-200 h-1 bg-white/30 rounded appearance-none cursor-pointer accent-exyo-red"
              />
            </div>

            {/* Time display */}
            <span className="text-xs text-white/70 font-mono hidden sm:inline ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Download */}
            <button
              onClick={onDownload}
              className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors hidden md:block"
              title="Download"
              aria-label="Download"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </button>

            {/* Settings */}
            <div className="relative">
              <button
                onClick={onToggleSettings}
                className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors hidden md:block"
                title="Settings"
                aria-label="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              {settingsOpen && (
                <div className="absolute bottom-full right-0 mb-3 bg-black/90 backdrop-blur-xl rounded-2xl p-3 min-w-[160px] border border-white/10 shadow-2xl shadow-black/50">
                  <div className="text-[11px] text-gray-500 px-3 py-1 uppercase tracking-wider font-bold mb-1">
                    Speed
                  </div>
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onChangePlaybackRate(rate);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm rounded-xl transition-colors font-medium',
                        playbackRate === rate
                          ? 'bg-white text-black'
                          : 'text-gray-300 hover:bg-white/10'
                      )}
                    >
                      {rate === 1 ? 'Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitles */}
            <div className="relative">
              <button
                onClick={() => {
                  if (subtitleTracks.length > 0) {
                    setShowSubtitlePanel(!showSubtitlePanel);
                  } else {
                    onToggleSubtitles();
                  }
                }}
                className={cn(
                  'p-2.5 hover:bg-white/10 rounded-2xl transition-colors hidden md:block',
                  showSubtitles && 'bg-white/10'
                )}
                title="Subtitles (C)"
                aria-label="Subtitles"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6v-2zm0 4h8v2H6v-2zm10 0h2v2h-2v-2zm-6-4h8v2h-8v-2z" />
                </svg>
              </button>
              {showSubtitlePanel && subtitleTracks.length > 0 && (
                <div className="absolute bottom-full right-0 mb-3 bg-black/90 backdrop-blur-xl rounded-2xl p-3 min-w-[200px] border border-white/10 shadow-2xl shadow-black/50">
                  <div className="text-[11px] text-gray-500 px-3 py-1 uppercase tracking-wider font-bold mb-1">
                    Subtitles
                  </div>
                  <button
                    onClick={() => {
                      onSelectSubtitle?.('');
                      setShowSubtitlePanel(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-xl transition-colors font-medium',
                      !activeSubtitleUrl
                        ? 'bg-white text-black'
                        : 'text-gray-300 hover:bg-white/10'
                    )}
                  >
                    Off
                  </button>
                  {subtitleTracks.map((track) => (
                    <button
                      key={track.url}
                      onClick={() => {
                        onSelectSubtitle?.(track.url);
                        setShowSubtitlePanel(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm rounded-xl transition-colors font-medium',
                        activeSubtitleUrl === track.url
                          ? 'bg-white text-black'
                          : 'text-gray-300 hover:bg-white/10'
                      )}
                    >
                      {track.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP */}
            <button
              onClick={onTogglePiP}
              className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors hidden md:block"
              title="Picture-in-Picture"
              aria-label="Picture in Picture"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm10 7l5-3v6l-5-3v-2z"
                />
              </svg>
            </button>

            {/* Fullscreen */}
            <button
              onClick={onToggleFullscreen}
              className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors"
              title="Fullscreen (F)"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
