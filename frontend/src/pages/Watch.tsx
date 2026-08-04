import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Hls from 'hls.js';
import { contentApi } from '../api/content.api';
import { useDownloadStore } from '../store/downloadStore';
import type { Stream } from '../types';
import { formatTime, cn } from '../utils/helpers';
import { SkeletonPlayer } from '../components/Skeleton';

interface StreamWithSource extends Stream {
  addonName: string;
  addonUrl: string;
  sourceLabel: string;
}

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
  const [selectedStream, setSelectedStream] = useState<StreamWithSource | null>(null);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showServerPanel, setShowServerPanel] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  const addOrUpdateHistory = useMutation(api.watchHistory.addOrUpdate);
  const addDownload = useDownloadStore((s) => s.addDownload);

  const { data: rawStreams = [], isLoading } = useQuery<Stream[]>({
    queryKey: ['streams', id, type],
    queryFn: () => contentApi.getStreams(id!, type),
    enabled: !!id,
  });

  const { data: content } = useQuery({
    queryKey: ['content', id, type],
    queryFn: () => contentApi.getDetails(id!, type),
    enabled: !!id,
  });

  // Enrich streams with addon source info
  const streams = useMemo<StreamWithSource[]>(() => {
    return rawStreams.map((s, i) => ({
      ...s,
      addonName: s.addonName || 'Unknown',
      addonUrl: s.addonUrl || '',
      sourceLabel: s.name || s.title || s.quality || `Source ${i + 1}`,
    }));
  }, [rawStreams]);

  // Group streams by addon
  const streamsByAddon = useMemo(() => {
    const groups: Record<string, StreamWithSource[]> = {};
    for (const stream of streams) {
      const key = stream.addonName || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(stream);
    }
    return groups;
  }, [streams]);

  const addonNames = Object.keys(streamsByAddon);

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
    if (!selectedStream.url) return;

    let hls: Hls | null = null;
    setVideoError(null);
    setIsBuffering(true);

    const cleanup = () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
      if (hls) hls.destroy();
    };

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
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    const handleError = () => {
      const err = video.error;
      if (err) {
        setVideoError(`Playback error: ${err.message || 'Unknown error'}`);
      }
      setIsBuffering(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);

    const url = selectedStream.url;

    if (url.includes('.m3u8') && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setVideoError(`Stream error: ${data.details}`);
        }
      });
    } else if (url.includes('.m3u8') && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else {
      video.src = url;
    }

    return cleanup;
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
          if (showServerPanel) {
            setShowServerPanel(false);
          } else if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            navigate(-1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, showServerPanel]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleDownloadStream = useCallback((stream: StreamWithSource) => {
    if (!content) return;
    const downloadUrl = stream.url;
    const qualityLabel = stream.quality || stream.sourceLabel || 'Unknown';
    addDownload({
      contentId: id!,
      title: content.name || 'Content',
      posterUrl: content.poster,
      type: type as 'movie' | 'series',
      size: qualityLabel,
      downloaded: '0 MB',
    });
    // Trigger browser download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${content.name || id}_${qualityLabel}.mp4`;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [content, id, type, addDownload]);

  if (isLoading) return <SkeletonPlayer />;

  if (streams.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
        <div className="w-24 h-24 mb-8 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-2xl font-bold mb-3">No streams available</p>
        <p className="text-gray-400 mb-10 text-center max-w-sm">No streams were found. Your addons may not have sources for this content, or they may require a debrid service.</p>
        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="px-8 py-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors font-bold text-sm">
            Go Back
          </button>
          <button onClick={() => navigate('/settings/streaming')} className="px-8 py-3 bg-exyo-red rounded-2xl hover:bg-exyo-red-dark transition-colors font-bold text-sm">
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

      {/* Buffering spinner */}
      {isBuffering && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error overlay */}
      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-white font-bold text-lg mb-2">Playback Error</p>
            <p className="text-gray-400 text-sm mb-6 max-w-md">{videoError}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setVideoError(null); setShowServerPanel(true); }}
                className="px-6 py-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors font-bold text-sm"
              >
                Try Another Source
              </button>
              <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-exyo-red rounded-xl hover:bg-exyo-red-dark transition-colors font-bold text-sm">
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={cn('absolute inset-0 transition-opacity duration-300', showControls ? 'opacity-100' : 'opacity-0')}
        style={{ pointerEvents: showControls ? 'auto' : 'none' }}
      >
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-5 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-white font-bold text-[15px]">{content?.name || 'Now Playing'}</span>
          <div className="w-11" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
          <div className="max-w-5xl mx-auto">
            {/* Current source indicator + server selector button */}
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => setShowServerPanel(!showServerPanel)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 transition-all text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                </svg>
                {selectedStream?.addonName || 'Select Source'}
                <span className="text-white/50">•</span>
                {selectedStream?.quality || 'HD'}
                <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="mb-3 relative group cursor-pointer">
              <div className="h-[3px] group-hover:h-[5px] bg-white/20 rounded-full transition-all relative">
                <div className="absolute h-full bg-white/40 rounded-full" style={{ width: `${buffered}%` }} />
                <div className="absolute h-full bg-exyo-red rounded-full" style={{ width: `${(currentTime / duration) * 100 || 0}%` }} />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-exyo-red rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-black/50"
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
              <button onClick={togglePlay} className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors">
                {isPlaying ? (
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>

              <button onClick={() => skip(-10)} className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors hidden md:block" title="Rewind 10s">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /></svg>
              </button>

              <button onClick={() => skip(10)} className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors hidden md:block" title="Forward 10s">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" /></svg>
              </button>

              <div className="flex items-center gap-0.5 group/vol">
                <button onClick={toggleMute} className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors">
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

              {/* Download button */}
              {selectedStream && (
                <button
                  onClick={() => handleDownloadStream(selectedStream)}
                  className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors hidden md:block"
                  title="Download"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
              )}

              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors hidden md:block"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-3 bg-black/90 backdrop-blur-xl rounded-2xl p-3 min-w-[160px] border border-white/10 shadow-2xl shadow-black/50">
                    <div className="text-[11px] text-gray-500 px-3 py-1 uppercase tracking-wider font-bold mb-1">Speed</div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded-xl transition-colors font-medium',
                          playbackRate === rate ? 'bg-white text-black' : 'text-gray-300 hover:bg-white/10'
                        )}
                      >
                        {rate === 1 ? 'Normal' : `${rate}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={togglePiP} className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors hidden md:block" title="Picture-in-Picture">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm10 7l5-3v6l-5-3v-2z" />
                </svg>
              </button>

              <button onClick={toggleFullscreen} className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors" title="Fullscreen (F)">
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

      {/* ─── SERVER / SOURCE SELECTOR PANEL ─── */}
      <div
        className={cn(
          'absolute top-0 right-0 bottom-0 w-full sm:w-[380px] bg-[#0A0A0A]/95 backdrop-blur-xl border-l border-white/[0.06] z-50 transition-transform duration-300 ease-out overflow-y-auto',
          showServerPanel ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ pointerEvents: showServerPanel ? 'auto' : 'none' }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[18px] font-bold text-white">Sources</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">{streams.length} stream{streams.length !== 1 ? 's' : ''} from {addonNames.length} addon{addonNames.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setShowServerPanel(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stream groups */}
          {addonNames.map((addonName) => {
            const addonStreams = streamsByAddon[addonName];
            return (
              <div key={addonName} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-exyo-red" />
                  <h3 className="text-[13px] font-bold text-gray-300 uppercase tracking-wider">{addonName}</h3>
                  <span className="text-[11px] text-gray-600 bg-white/[0.04] px-1.5 py-0.5 rounded">{addonStreams.length}</span>
                </div>
                <div className="space-y-2">
                  {addonStreams.map((stream, i) => {
                    const isSelected = selectedStream === stream;
                    const isPlayable = stream.url && !stream.infoHash;
                    return (
                      <button
                        key={`${addonName}-${i}`}
                        onClick={() => {
                          setSelectedStream(stream);
                          setShowServerPanel(false);
                          setVideoError(null);
                        }}
                        className={cn(
                          'w-full text-left p-4 rounded-xl border transition-all duration-200',
                          isSelected
                            ? 'bg-exyo-red/10 border-exyo-red/30'
                            : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {stream.quality && (
                              <span className={cn(
                                'text-[11px] font-bold px-2 py-0.5 rounded-md',
                                isSelected ? 'bg-exyo-red text-white' : 'bg-white/[0.08] text-gray-300'
                              )}>
                                {stream.quality}
                              </span>
                            )}
                            {!isPlayable && stream.infoHash && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400">
                                Torrent
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-exyo-red flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {stream.name && (
                          <p className="text-[13px] text-white font-medium truncate">{stream.name}</p>
                        )}
                        {stream.description && (
                          <p className="text-[12px] text-gray-500 truncate mt-1">{stream.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {stream.title && (
                            <span className="text-[11px] text-gray-600 truncate">{stream.title}</span>
                          )}
                          <div className="flex-1" />
                          {!isPlayable && stream.infoHash && (
                            <span className="text-[11px] text-yellow-500/70">Requires debrid service</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Addon management link */}
          <button
            onClick={() => { navigate('/settings/streaming'); }}
            className="w-full p-4 rounded-xl border border-dashed border-white/[0.1] text-gray-500 hover:text-white hover:border-exyo-red/30 hover:bg-white/[0.03] transition-all text-[13px] font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Manage Addons
          </button>
        </div>
      </div>

      {/* Click-away overlay for server panel */}
      {showServerPanel && (
        <div
          className="absolute inset-0 z-40"
          onClick={() => setShowServerPanel(false)}
          style={{ pointerEvents: 'auto' }}
        />
      )}
    </div>
  );
}
