import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Hls from 'hls.js';

export interface PlayerStream {
  url: string;
  title?: string;
  infoHash?: string;
  quality?: string;
  name?: string;
  description?: string;
  addonName?: string;
  addonUrl?: string;
  provider?: string;
  hdr?: boolean;
  dolby?: boolean;
  codec?: string;
  seeds?: number;
  peers?: number;
  language?: string;
  fileSize?: string;
  bitrate?: number;
}

export interface SubtitleTrack {
  url: string;
  lang: string;
  label: string;
  type?: string;
}

interface UsePlayerOptions {
  streams: PlayerStream[];
  subtitles?: SubtitleTrack[];
  onProgress?: (progress: number) => void;
  onStreamError?: (error: string, stream: PlayerStream) => void;
  autoSelectBest?: boolean;
}

const QUALITY_RANK: Record<string, number> = {
  '2160p': 5, '4k': 5, '1080p': 4, '720p': 3, '480p': 2, '360p': 1,
};

function rankQuality(q?: string): number {
  if (!q) return 0;
  return QUALITY_RANK[q.toLowerCase()] ?? 0;
}

function sortStreamsByQuality(streams: PlayerStream[]): PlayerStream[] {
  return [...streams].sort((a, b) => {
    const aPlay = a.url && !a.infoHash ? 1 : 0;
    const bPlay = b.url && !b.infoHash ? 1 : 0;
    if (aPlay !== bPlay) return bPlay - aPlay;
    return rankQuality(b.quality) - rankQuality(a.quality);
  });
}

export function usePlayer({
  streams: rawStreams,
  subtitles: subtitleTracks = [],
  onProgress,
  onStreamError,
  autoSelectBest = true,
}: UsePlayerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<PlayerStream | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStreamSelector, setShowStreamSelector] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [activeSubtitleUrl, setActiveSubtitleUrl] = useState<string | null>(null);

  const streams = useMemo(() => sortStreamsByQuality(rawStreams), [rawStreams]);

  const streamsByAddon = useMemo(() => {
    const groups: Record<string, PlayerStream[]> = {};
    for (const stream of streams) {
      const key = stream.addonName || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(stream);
    }
    return groups;
  }, [streams]);

  const addonNames = Object.keys(streamsByAddon);

  useEffect(() => {
    if (streams.length > 0 && !selectedStream && autoSelectBest) {
      const best = streams.find((s) => s.url && !s.infoHash) || streams[0];
      setSelectedStream(best);
    }
  }, [streams, selectedStream, autoSelectBest]);

  const lastSaveTime = useRef(0);
  const saveProgress = useCallback(
    (progress: number) => {
      const now = Date.now();
      if (now - lastSaveTime.current < 10000) return;
      lastSaveTime.current = now;
      onProgress?.(Math.min(progress, 100));
    },
    [onProgress]
  );

  const tryNextStream = useCallback(() => {
    const currentIdx = streams.findIndex((s) => s === selectedStream);
    const nextIdx = currentIdx + 1;
    if (nextIdx < streams.length) {
      setSelectedStream(streams[nextIdx]);
      setVideoError(null);
    } else {
      setVideoError('All streams failed to play');
      setIsBuffering(false);
    }
  }, [streams, selectedStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedStream) return;

    const url = selectedStream.url;
    if (!url) {
      setIsBuffering(false);
      return;
    }

    let hls: Hls | null = null;
    setVideoError(null);
    setIsBuffering(true);

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration) {
        saveProgress((video.currentTime / video.duration) * 100);
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
      const errMsg = err?.message || 'Unknown playback error';
      const currentIdx = streams.findIndex((s) => s === selectedStream);
      const nextIdx = currentIdx + 1;
      if (nextIdx < streams.length) {
        setSelectedStream(streams[nextIdx]);
        setVideoError(null);
      } else {
        setVideoError(errMsg);
        setIsBuffering(false);
        onStreamError?.(errMsg, selectedStream);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);

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
          const currentIdx = streams.findIndex((s) => s === selectedStream);
          const nextIdx = currentIdx + 1;
          if (nextIdx < streams.length) {
            setSelectedStream(streams[nextIdx]);
            setVideoError(null);
          } else {
            setVideoError(`Stream error: ${data.details}`);
            setIsBuffering(false);
          }
        }
      });
    } else if (url.includes('.m3u8') && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(() => {});
    } else {
      video.src = url;
      video.play().catch(() => {});
    }

    return () => {
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
  }, [selectedStream, saveProgress, onStreamError, tryNextStream]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      document.body.style.cursor = 'default';
      clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
          document.body.style.cursor = 'none';
        }
      }, 3000);
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(controlsTimeout.current);
      document.body.style.cursor = 'default';
    };
  }, [isPlaying]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': e.preventDefault(); skip(-10); break;
        case 'ArrowRight': e.preventDefault(); skip(10); break;
        case 'ArrowUp': e.preventDefault(); adjustVolume(0.1); break;
        case 'ArrowDown': e.preventDefault(); adjustVolume(-0.1); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 'm': e.preventDefault(); toggleMute(); break;
        case 'c': e.preventDefault(); toggleSubtitles(); break;
        case 'Escape':
          if (showStreamSelector) setShowStreamSelector(false);
          else if (document.fullscreenElement) document.exitFullscreen();
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isPlaying, showStreamSelector]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play().catch(() => {}) : video.pause();
  }, []);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
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

  const setVolumeTo = useCallback((vol: number) => {
    const video = videoRef.current;
    if (!video) return;
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
    document.fullscreenElement ? document.exitFullscreen() : containerRef.current.requestFullscreen();
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (video.readyState >= 2) await video.requestPictureInPicture();
    } catch { /* PiP not supported */ }
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

  const toggleSubtitles = useCallback(() => {
    setShowSubtitles((prev) => !prev);
  }, []);

  const selectStream = useCallback((stream: PlayerStream) => {
    setSelectedStream(stream);
    setShowStreamSelector(false);
    setVideoError(null);
  }, []);

  const clearErrorAndOpenSelector = useCallback(() => {
    setVideoError(null);
    setShowStreamSelector(true);
  }, []);

  const downloadStream = useCallback((stream: PlayerStream, filename?: string) => {
    if (!stream.url) return;
    const a = document.createElement('a');
    a.href = stream.url;
    a.download = filename || 'download';
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  return {
    videoRef,
    containerRef,
    streams,
    streamsByAddon,
    addonNames,
    selectedStream,
    selectStream,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    showControls,
    buffered,
    playbackRate,
    isBuffering,
    videoError,
    showSettings,
    setShowSettings,
    showStreamSelector,
    setShowStreamSelector,
    showSubtitles,
    activeSubtitleUrl,
    setActiveSubtitleUrl,
    subtitleTracks,
    togglePlay,
    seekTo,
    adjustVolume,
    setVolumeTo,
    toggleMute,
    toggleFullscreen,
    togglePiP,
    skip,
    changePlaybackRate,
    toggleSubtitles,
    tryNextStream,
    clearErrorAndOpenSelector,
    downloadStream,
  };
}
