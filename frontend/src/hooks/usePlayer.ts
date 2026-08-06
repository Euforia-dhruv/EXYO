import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Hls from 'hls.js';
import { detectFormat, selectDecodeMethod } from '../lib/formatDetector';
import { remuxToSupported, transcodeForBrowser } from '../lib/browserDecoder';

export interface PlayerStream {
  url: string;
  proxiedUrl?: string;
  title?: string;
  infoHash?: string;
  quality?: string;
  name?: string;
  description?: string;
  addon?: string;
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
  behaviorHints?: { notWebReady?: boolean; proxyHeaders?: { request?: Record<string, string> } };
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
  remuxMkv?: (url: string) => Promise<string | null>;
  onRemuxProgress?: (stage: string, progress: number) => void;
}

const QUALITY_RANK: Record<string, number> = {
  '2160p': 5, '4k': 5, '1080p': 4, '720p': 3, '480p': 2, '360p': 1,
};

function rankQuality(q?: string): number {
  if (!q) return 0;
  return QUALITY_RANK[q.toLowerCase()] ?? 0;
}

function codecRank(s: PlayerStream): number {
  const c = (s.codec || '').toLowerCase();
  if (c === 'h264' || c === 'avc') return 3;
  if (c === 'vp9' || c === 'vp8' || c === 'av1') return 2;
  if (c === 'hevc' || c === 'h265') return 1;
  return 0;
}

function sortStreamsByQuality(streams: PlayerStream[]): PlayerStream[] {
  return [...streams].sort((a, b) => {
    const aPlay = a.url && !a.infoHash ? 1 : 0;
    const bPlay = b.url && !b.infoHash ? 1 : 0;
    if (aPlay !== bPlay) return bPlay - aPlay;
    const cd = codecRank(b) - codecRank(a);
    if (cd !== 0) return cd;
    return rankQuality(b.quality) - rankQuality(a.quality);
  });
}

export function usePlayer({
  streams: rawStreams,
  subtitles: subtitleTracks = [],
  onProgress,
  onStreamError,
  autoSelectBest = true,
  remuxMkv,
  onRemuxProgress,
}: UsePlayerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const streamingPlayerRef = useRef<any | null>(null);

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
  const [isStreamingPlayer, setIsStreamingPlayer] = useState(false);

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

  // Store all callbacks in refs so the main playback effect never re-runs
  // due to callback reference changes
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onStreamErrorRef = useRef(onStreamError);
  onStreamErrorRef.current = onStreamError;
  const onRemuxProgressRef = useRef(onRemuxProgress);
  onRemuxProgressRef.current = onRemuxProgress;
  const remuxMkvRef = useRef(remuxMkv);
  remuxMkvRef.current = remuxMkv;
  const streamsRef = useRef(streams);
  streamsRef.current = streams;

  const lastSaveTime = useRef(0);
  const saveProgress = useCallback(
    (progress: number) => {
      const now = Date.now();
      if (now - lastSaveTime.current < 10000) return;
      lastSaveTime.current = now;
      onProgressRef.current?.(Math.min(progress, 100));
    },
    []
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedStream) return;

    const url = selectedStream.url;
    if (!url) {
      setIsBuffering(false);
      return;
    }

    let hls: Hls | null = null;
    let cancelled = false;
    let blobUrl: string | null = null;
    let tryingFFmpeg = false;
    setVideoError(null);
    setIsBuffering(true);

    const playUrl = selectedStream?.proxiedUrl || url;
    const fmt = detectFormat(playUrl, selectedStream.title, selectedStream.description);
    console.log('[Player] Stream:', selectedStream.name, '| codec:', fmt.codec, '| format:', fmt.format, '| URL:', playUrl.substring(0, 100));

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

    function tryNextStreamPlayback() {
      if (cancelled) return;
      const currentStreams = streamsRef.current;
      const currentIdx = currentStreams.findIndex((s) => s === selectedStream);
      const nextIdx = currentIdx + 1;
      if (nextIdx < currentStreams.length) {
        console.log('[Player] Auto-falling back to stream', nextIdx + 1, 'of', currentStreams.length);
        setSelectedStream(currentStreams[nextIdx]);
        setVideoError(null);
      } else {
        setVideoError('All streams failed to play');
        setIsBuffering(false);
      }
    }

    const handleError = () => {
      if (cancelled) return;
      const err = video.error;
      const errMsg = err?.message || 'Unknown playback error';
      console.log('[Player] Native error:', errMsg, '| format:', fmt.format, '| codec:', fmt.codec);

      // For MKV/HEVC/AVI, try streaming player first
      if (!tryingFFmpeg && (fmt.format === 'mkv' || fmt.format === 'avi' || fmt.codec === 'hevc')) {
        tryingFFmpeg = true;
        console.log('[Player] Launching streaming player for', fmt.format, fmt.codec);
        launchStreamingPlayer(playUrl).then(() => {
          if (!cancelled) console.log('[Player] Streaming player launched');
        }).catch(e => {
          console.error('[Player] Streaming player failed, trying next stream:', e.message);
          if (!cancelled) tryNextStreamPlayback();
        });
        return;
      }

      // Auto-fallback to next stream
      console.log('[Player] Auto-trying next stream due to:', errMsg);
      tryNextStreamPlayback();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);

    function playWithHls(sourceUrl: string) {
      if (cancelled || !video) return;
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal && !cancelled) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls?.startLoad();
          } else {
            setVideoError(data.error?.message || 'HLS playback error');
            setIsBuffering(false);
          }
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!cancelled) {
          setIsBuffering(false);
          video?.play().catch(() => {});
        }
      });

      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
    }

    function setSourceAndPlay(sourceUrl: string) {
      if (cancelled || !video) return;
      video.src = sourceUrl;
      video.play().catch(() => {});
    }

    async function decodeWithFFmpeg(sourceUrl: string, format: string) {
      if (cancelled) return;
      onRemuxProgressRef.current?.('converting', 0);
      try {
        const result = await remuxToSupported(sourceUrl, format, (stage, p) => {
          onRemuxProgressRef.current?.(stage, p);
        });
        if (!cancelled && result.blobUrl) {
          blobUrl = result.blobUrl;
          onRemuxProgressRef.current?.('done', 1);
          setSourceAndPlay(result.blobUrl);
        } else if (!cancelled) {
          setSourceAndPlay(playUrl);
        }
      } catch {
        if (!cancelled) {
          try {
            onRemuxProgressRef.current?.('transcoding', 0);
            const transcoded = await transcodeForBrowser(sourceUrl, format, (stage, p) => {
              onRemuxProgressRef.current?.(stage, p);
            });
            if (!cancelled && transcoded) {
              blobUrl = transcoded;
              onRemuxProgressRef.current?.('done', 1);
              setSourceAndPlay(transcoded);
            } else if (!cancelled) {
              setSourceAndPlay(playUrl);
            }
          } catch {
            setVideoError('Transcoding failed for this format');
            setIsBuffering(false);
          }
        }
      }
    }

    async function launchStreamingPlayer(sourceUrl: string): Promise<void> {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error('[Player] No canvas element for streaming player');
        setVideoError('Streaming player unavailable');
        setIsBuffering(false);
        return;
      }

      video.style.display = 'none';
      canvas.style.display = 'block';
      setIsStreamingPlayer(true);
      setIsBuffering(true);

      // Always use proxiedUrl when available (it handles auth, CORS, redirects)
      // Only try direct URL when no proxy exists (e.g. HLS from CDN)
      const hasProxy = !!selectedStream?.proxiedUrl;
      const urlsToTry = hasProxy ? [sourceUrl] : [sourceUrl];

      const { MoviPlayer } = await import('movi-player/player');

      for (const tryUrl of urlsToTry) {
        if (cancelled) return;
        console.log('[Player] MoviPlayer trying URL:', tryUrl.substring(0, 100));

        const moviPlayer = new MoviPlayer({
          source: { type: 'url', url: tryUrl },
          renderer: 'canvas',
          canvas,
        });

        streamingPlayerRef.current = moviPlayer;

        moviPlayer.on('timeupdate', (t: number) => {
          setCurrentTime(t);
        });
        moviPlayer.on('statechange', (state: string) => {
          if (state === 'playing') setIsBuffering(false);
          if (state === 'ended') setIsBuffering(false);
          if (state === 'buffering') setIsBuffering(true);
        });

        let playerFailed = false;
        moviPlayer.on('error', (err: any) => {
          console.error('[Player] MoviPlayer error on', tryUrl.substring(0, 60), ':', err?.message || err);
          playerFailed = true;
        });

        try {
          await moviPlayer.load();
          if (cancelled || playerFailed) {
            try { await moviPlayer.destroy(); } catch {}
            continue;
          }
          const dur = moviPlayer.getDuration();
          if (dur > 0) setDuration(dur);
          moviPlayer.play();
          return; // Success
        } catch (e: any) {
          console.error('[Player] MoviPlayer load failed:', e?.message || e);
          try { await moviPlayer.destroy(); } catch {}
          continue;
        }
      }

      // All URLs failed
      if (!cancelled) {
        video.style.display = '';
        canvas.style.display = 'none';
        setIsStreamingPlayer(false);
        tryNextStreamPlayback();
      }
    }

    (async () => {
      const method = await selectDecodeMethod(fmt.format, fmt.codec);
      console.log('[Player] Decode method:', method, '| format:', fmt.format, '| codec:', fmt.codec);

      if (method === 'hls.js' && Hls.isSupported()) {
        playWithHls(playUrl);
      } else if (method === 'hls.js' && video.canPlayType('application/vnd.apple.mpegurl')) {
        setSourceAndPlay(playUrl);
      } else if (method === 'webcodecs') {
        // MKV/AVI/FLV — go straight to streaming player, skip native
        (async () => {
          try {
            await launchStreamingPlayer(playUrl);
          } catch (e: any) {
            console.error('[Player] Streaming player failed:', e?.message || e);
            if (!cancelled) tryNextStreamPlayback();
          }
        })();
      } else if (method === 'native') {
        setSourceAndPlay(playUrl);
      } else {
        setSourceAndPlay(playUrl);
      }
    })();

    return () => {
      cancelled = true;
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
      if (hls) hls.destroy();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (streamingPlayerRef.current) {
        streamingPlayerRef.current.destroy();
        streamingPlayerRef.current = null;
      }
      // Reset streaming player UI state
      video.style.display = '';
      if (canvasRef.current) canvasRef.current.style.display = 'none';
      setIsStreamingPlayer(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStream]);

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
    if (streamingPlayerRef.current && isStreamingPlayer) {
      const sp = streamingPlayerRef.current;
      if (sp.getState() === 'playing') {
        sp.pause();
      } else {
        sp.play();
      }
      setIsPlaying(sp.getState() === 'playing');
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play().catch(() => {}) : video.pause();
  }, [isStreamingPlayer]);

  const seekTo = useCallback((time: number) => {
    if (streamingPlayerRef.current && isStreamingPlayer) {
      streamingPlayerRef.current.seek(time * 1000);
      setCurrentTime(time);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  }, [isStreamingPlayer]);

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
    canvasRef,
    isStreamingPlayer,
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
    setShowControls,
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
    tryNextStream: useCallback(() => {
      const currentStreams = streamsRef.current;
      const currentIdx = currentStreams.findIndex((s) => s === selectedStream);
      const nextIdx = currentIdx + 1;
      if (nextIdx < currentStreams.length) {
        setSelectedStream(currentStreams[nextIdx]);
        setVideoError(null);
      } else {
        setVideoError('All streams failed to play');
        setIsBuffering(false);
      }
    }, [selectedStream]),
    clearErrorAndOpenSelector,
    downloadStream,
  };
}
