import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Hls from 'hls.js';
import { contentApi } from '../api/content.api';
import type { Stream } from '../types';
import { formatTime, cn } from '../utils/helpers';
import { SkeletonPlayer } from '../components/Skeleton';

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSaveTime = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const addOrUpdateHistory = useMutation(api.watchHistory.addOrUpdate);

  const { data: streams = [], isLoading } = useQuery<Stream[]>({
    queryKey: ['streams', id, type],
    queryFn: () => contentApi.getStreams(id!, type),
    enabled: !!id,
  });

  const { data: content } = useQuery({
    queryKey: ['content', id, type],
    queryFn: () => contentApi.getDetails(id!, type),
    enabled: !!id,
  });

  const saveProgress = useCallback(
    (progress: number) => {
      const now = Date.now();
      if (now - lastSaveTime.current < 10000) return;
      lastSaveTime.current = now;
      addOrUpdateHistory({
        contentId: id!,
        title: content?.name || 'Content',
        posterUrl: content?.poster,
        backdropUrl: content?.background,
        contentType: type as 'movie' | 'series',
        progress: Math.min(progress, 100),
      }).catch(() => {});
    },
    [id, type, content, addOrUpdateHistory]
  );

  useEffect(() => {
    if (streams.length > 0 && !selectedStream) {
      setSelectedStream(streams[0]);
    }
  }, [streams, selectedStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedStream) return;

    let hls: Hls | null = null;

    if (selectedStream.url.includes('.m3u8') && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(selectedStream.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else {
      video.src = selectedStream.url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
      }, { once: true });
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration) {
        const progress = (video.currentTime / video.duration) * 100;
        saveProgress(progress);
      }
    };

    const handleLoadedMetadata = () => setDuration(video.duration);

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      if (hls) hls.destroy();
    };
  }, [selectedStream, saveProgress]);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(controlsTimeout.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'Escape':
          if (document.fullscreenElement) document.exitFullscreen();
          else navigate(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play().catch(() => {}) : video.pause();
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  }, []);

  const adjustVolume = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = Math.max(0, Math.min(1, video.volume + delta));
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    document.fullscreenElement
      ? document.exitFullscreen()
      : containerRef.current.requestFullscreen();
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video.readyState >= 2) {
        await video.requestPictureInPicture();
      }
    } catch {}
  }, []);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  }, []);

  if (isLoading) return <SkeletonPlayer />;

  if (streams.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
        <div className="w-20 h-20 mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-10 h-10 text-exyo-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-xl font-semibold mb-2">No streams available</p>
        <p className="text-exyo-muted mb-8 text-center max-w-sm">No streams were found for this content. Try selecting a different addon in your settings.</p>
        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-white/10 rounded-netflix hover:bg-white/20 transition-colors font-bold text-sm">
            Go Back
          </button>
          <button onClick={() => navigate('/settings/addons')} className="px-6 py-2.5 bg-exyo-red rounded-netflix hover:bg-exyo-red-dark transition-colors font-bold text-sm">
            Manage Addons
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-screen bg-black flex items-center justify-center cursor-none"
      onMouseMove={() => {
        setShowControls(true);
        document.body.style.cursor = 'default';
        clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => {
          if (isPlaying) {
            setShowControls(false);
            document.body.style.cursor = 'none';
          }
        }, 3000);
      }}
    >
      <video ref={videoRef} className="w-full h-full object-contain" playsInline onClick={togglePlay} />

      {/* Controls overlay */}
      <div
        className={cn('absolute inset-0 transition-opacity duration-300', showControls ? 'opacity-100' : 'opacity-0')}
        style={{ pointerEvents: showControls ? 'auto' : 'none' }}
      >
        {/* Top gradient */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded transition-colors">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">{content?.name || 'Now Playing'}</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-5">
          <div className="max-w-5xl mx-auto">
            {/* Stream selector */}
            {streams.length > 1 && (
              <div className="mb-2.5 flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                {streams.map((stream, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedStream(stream)}
                    className={cn(
                      'flex-shrink-0 px-3 py-1 rounded text-xs font-bold transition-all',
                      selectedStream === stream
                        ? 'bg-white text-black'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    )}
                  >
                    {stream.quality || `Stream ${i + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* Progress bar */}
            <div className="mb-2.5 relative group cursor-pointer">
              <div className="h-[3px] group-hover:h-[5px] bg-white/20 rounded-sm transition-all relative">
                <div className="absolute h-full bg-white/40 rounded-sm" style={{ width: `${buffered}%` }} />
                <div className="absolute h-full bg-exyo-red rounded-sm" style={{ width: `${(currentTime / duration) * 100 || 0}%` }} />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-exyo-red rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  style={{ left: `calc(${(currentTime / duration) * 100 || 0}% - 6px)` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Control buttons */}
            <div className="flex items-center gap-1.5">
              <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded transition-colors">
                {isPlaying ? (
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>

              <button onClick={() => skip(-10)} className="p-2 hover:bg-white/10 rounded transition-colors hidden md:block" title="Rewind 10s (←)">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /></svg>
              </button>

              <button onClick={() => skip(10)} className="p-2 hover:bg-white/10 rounded transition-colors hidden md:block" title="Forward 10s (→)">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" /></svg>
              </button>

              <div className="flex items-center gap-0.5 group/vol">
                <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded transition-colors">
                  {isMuted || volume === 0 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                  ) : volume < 0.5 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  onClick={(e) => e.stopPropagation()}
                  className="w-0 group-hover/vol:w-16 transition-all duration-200 h-1 bg-white/30 rounded appearance-none cursor-pointer accent-exyo-red"
                />
              </div>

              <span className="text-xs text-white/70 font-mono hidden sm:inline ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex-1" />

              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-white/10 rounded transition-colors hidden md:block"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-exyo-dark/95 backdrop-blur-sm rounded-netflix p-2 min-w-[140px] border border-exyo-border shadow-xl">
                    <div className="text-[11px] text-exyo-muted px-3 py-1 uppercase tracking-wider font-bold">Speed</div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={cn(
                          'w-full text-left px-3 py-1.5 text-sm rounded-netflix transition-colors font-medium',
                          playbackRate === rate ? 'bg-white text-black' : 'text-white hover:bg-white/10'
                        )}
                      >
                        {rate === 1 ? 'Normal' : `${rate}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={togglePiP} className="p-2 hover:bg-white/10 rounded transition-colors hidden md:block" title="Picture-in-Picture">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm10 7l5-3v6l-5-3v-2z" />
                </svg>
              </button>

              <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded transition-colors" title="Fullscreen (F)">
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
