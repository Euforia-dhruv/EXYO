import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Hls from 'hls.js';
import { detectFormat, selectDecodeMethod } from '../lib/formatDetector';

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
}: UsePlayerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamingPlayerRef = useRef<any | null>(null);
  const hlsRef = useRef<Hls | null>(null);

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
  const [audioTracks, setAudioTracks] = useState<Array<{ id: string; label: string; language?: string }>>([]);
  const [activeAudioTrack, setActiveAudioTrack] = useState<{ id: string; label: string; language?: string } | null>(null);

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

  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onStreamErrorRef = useRef(onStreamError);
  onStreamErrorRef.current = onStreamError;
  const streamsRef = useRef(streams);
  streamsRef.current = streams;
  const selectedStreamRef = useRef(selectedStream);
  selectedStreamRef.current = selectedStream;

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

    let cancelled = false;
    setVideoError(null);
    setIsBuffering(true);
    setIsPlaying(false);

    const rawUrl = url;
    const proxyUrl = selectedStream?.proxiedUrl;
    const fmt = detectFormat(rawUrl, selectedStream.title, selectedStream.description);
    const method = selectDecodeMethod(fmt.format, fmt.codec);
    console.log(`[Player] Stream: ${selectedStream.name} | format: ${fmt.format} | codec: ${fmt.codec} | method: ${method}`);

    type Phase =
      | 'hls-direct' | 'hls-proxy' | 'hls-streaming-direct' | 'hls-streaming-proxy'
      | 'native-direct' | 'native-proxy' | 'native-streaming-direct' | 'native-streaming-proxy'
      | 'streaming-direct' | 'streaming-proxy'
      | 'done';

    let phase: Phase = ((): Phase => {
      if (method === 'hls.js') return 'hls-direct';
      if (method === 'webcodecs') return 'streaming-direct';
      return 'native-direct';
    })();

    const bufferingSafety = setTimeout(() => {
      if (!cancelled) setIsBuffering(false);
    }, 15000);

    const handleTimeUpdate = () => {
      if (cancelled) return;
      setCurrentTime(video.currentTime);
      if (video.duration) {
        saveProgress((video.currentTime / video.duration) * 100);
      }
    };
    const handleLoadedMetadata = () => { if (!cancelled) setDuration(video.duration); };
    const handleProgress = () => {
      if (cancelled) return;
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };
    const handlePlay = () => { if (!cancelled) setIsPlaying(true); };
    const handlePause = () => { if (!cancelled) setIsPlaying(false); };
    const handleWaiting = () => { if (!cancelled) setIsBuffering(true); };
    const handlePlaying = () => { if (!cancelled) setIsBuffering(false); };
    const handleCanPlay = () => { if (!cancelled) setIsBuffering(false); };

    function tryNextStream() {
      if (cancelled) return;
      const currentStreams = streamsRef.current;
      const currentIdx = currentStreams.findIndex((s) => s === selectedStreamRef.current);
      const nextIdx = currentIdx + 1;
      if (nextIdx < currentStreams.length) {
        console.log(`[Player] All methods exhausted for stream ${currentIdx + 1}. Falling back to stream ${nextIdx + 1} of ${currentStreams.length}`);
        setSelectedStream(currentStreams[nextIdx]);
        setVideoError(null);
      } else {
        console.log('[Player] ALL streams exhausted');
        setVideoError('All streams failed to play');
        setIsBuffering(false);
        onStreamErrorRef.current?.('All streams failed', selectedStreamRef.current);
      }
    }

    function advancePhase(): Phase | null {
      switch (phase) {
        case 'hls-direct':          return 'hls-proxy';
        case 'hls-proxy':           return 'hls-streaming-direct';
        case 'hls-streaming-direct': return 'hls-streaming-proxy';
        case 'hls-streaming-proxy':  return null;

        case 'native-direct':        return 'native-proxy';
        case 'native-proxy':         return 'native-streaming-direct';
        case 'native-streaming-direct': return 'native-streaming-proxy';
        case 'native-streaming-proxy':  return null;

        case 'streaming-direct':     return 'streaming-proxy';
        case 'streaming-proxy':      return null;

        default: return null;
      }
    }

    function tryNextPhase() {
      if (cancelled) return;
      const next = advancePhase();
      if (next) {
        phase = next;
        console.log(`[Player] Trying phase: ${phase}`);
        executePhase();
      } else {
        phase = 'done';
        tryNextStream();
      }
    }

    function cleanupHls() {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    }

    function cleanupStreamingPlayer() {
      if (streamingPlayerRef.current) {
        streamingPlayerRef.current.destroy();
        streamingPlayerRef.current = null;
      }
      video.style.display = '';
      if (canvasRef.current) canvasRef.current.style.display = 'none';
      setIsStreamingPlayer(false);
    }

    function restoreVideoElement() {
      video.style.display = '';
      if (canvasRef.current) canvasRef.current.style.display = 'none';
      setIsStreamingPlayer(false);
    }

    const handleError = () => {
      if (cancelled) return;
      const err = video.error;
      const errMsg = err?.message || 'Unknown playback error';
      console.log(`[Player] Native error in phase ${phase}: ${errMsg}`);
      tryNextPhase();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    function playWithHls(sourceUrl: string, isProxy: boolean) {
      if (cancelled || !video) return;
      cleanupHls();

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal && !cancelled) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            if (!isProxy && proxyUrl && proxyUrl !== rawUrl) {
              console.log('[Player] HLS network error on direct, trying proxy...');
              hlsRef.current?.destroy();
              hlsRef.current = null;
              playWithHls(proxyUrl, true);
              return;
            }
            hls.startLoad();
          } else {
            console.log('[Player] HLS fatal non-network error, advancing phase');
            cleanupHls();
            tryNextPhase();
          }
        }
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data) => {
        if (cancelled) return;
        const tracks: Array<{ id: string; label: string; language?: string }> = data.audioTracks.map((at) => ({
          id: String(at.id),
          label: at.name || at.lang || `Track ${at.id}`,
          language: at.lang,
        }));
        if (tracks.length > 0) {
          setAudioTracks(tracks);
          setActiveAudioTrack(tracks[0]);
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!cancelled) {
          setIsBuffering(false);
          video.play().catch(() => {});
        }
      });

      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
    }

    async function launchStreamingPlayer(sourceUrl: string): Promise<boolean> {
      if (cancelled) return false;
      const canvas = canvasRef.current;
      if (!canvas) return false;

      video.style.display = 'none';
      canvas.style.display = 'block';
      setIsStreamingPlayer(true);
      setIsBuffering(true);

      try {
        const { MoviPlayer } = await import('movi-player/player');
        if (cancelled) return false;

        const moviPlayer = new MoviPlayer({
          source: { type: 'url', url: sourceUrl },
          renderer: 'canvas',
          canvas,
        });

        streamingPlayerRef.current = moviPlayer;

        moviPlayer.on('timeupdate', (t: number) => { if (!cancelled) setCurrentTime(t); });
        moviPlayer.on('statechange', (state: string) => {
          if (cancelled) return;
          if (state === 'playing') { setIsBuffering(false); setIsPlaying(true); }
          if (state === 'ended') { setIsBuffering(false); setIsPlaying(false); }
          if (state === 'buffering') setIsBuffering(true);
        });

        let playerFailed = false;
        moviPlayer.on('error', (err: any) => {
          console.error('[Player] MoviPlayer error:', err?.message || err);
          playerFailed = true;
        });

        await moviPlayer.load();

        if (cancelled || playerFailed) {
          try { await moviPlayer.destroy(); } catch {}
          restoreVideoElement();
          return false;
        }

        const dur = moviPlayer.getDuration();
        if (dur > 0) setDuration(dur);
        moviPlayer.play();
        console.log('[Player] Streaming player playing successfully');
        return true;
      } catch (e: any) {
        console.error('[Player] Streaming player failed:', e?.message || e);
        if (!cancelled) restoreVideoElement();
        return false;
      }
    }

    function executePhase() {
      if (cancelled) return;

      switch (phase) {
        case 'hls-direct':
          playWithHls(rawUrl, false);
          break;

        case 'hls-proxy':
          if (proxyUrl && proxyUrl !== rawUrl) {
            playWithHls(proxyUrl, true);
          } else {
            tryNextPhase();
          }
          break;

        case 'hls-streaming-direct':
          cleanupHls();
          launchStreamingPlayer(rawUrl).then(ok => {
            if (!cancelled && !ok) tryNextPhase();
          });
          break;

        case 'hls-streaming-proxy':
          if (proxyUrl && proxyUrl !== rawUrl) {
            launchStreamingPlayer(proxyUrl).then(ok => {
              if (!cancelled && !ok) tryNextPhase();
            });
          } else {
            tryNextPhase();
          }
          break;

        case 'native-direct':
          video.src = rawUrl;
          video.muted = false;
          video.play().catch(() => {
            video.muted = true;
            video.play().catch(() => {});
          });
          break;

        case 'native-proxy':
          if (proxyUrl && proxyUrl !== rawUrl) {
            setVideoError(null);
            video.src = proxyUrl;
            video.muted = false;
            video.play().catch(() => {
              video.muted = true;
              video.play().catch(() => {});
            });
          } else {
            tryNextPhase();
          }
          break;

        case 'native-streaming-direct':
          launchStreamingPlayer(rawUrl).then(ok => {
            if (!cancelled && !ok) tryNextPhase();
          });
          break;

        case 'native-streaming-proxy':
          if (proxyUrl && proxyUrl !== rawUrl) {
            launchStreamingPlayer(proxyUrl).then(ok => {
              if (!cancelled && !ok) tryNextPhase();
            });
          } else {
            tryNextPhase();
          }
          break;

        case 'streaming-direct':
          launchStreamingPlayer(rawUrl).then(ok => {
            if (!cancelled && !ok) tryNextPhase();
          });
          break;

        case 'streaming-proxy':
          if (proxyUrl && proxyUrl !== rawUrl) {
            launchStreamingPlayer(proxyUrl).then(ok => {
              if (!cancelled && !ok) tryNextPhase();
            });
          } else {
            tryNextPhase();
          }
          break;

        default:
          break;
      }
    }

    executePhase();

    return () => {
      cancelled = true;
      clearTimeout(bufferingSafety);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      cleanupHls();
      cleanupStreamingPlayer();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStream]);

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
          else if (showSettings) setShowSettings(false);
          else if (document.fullscreenElement) document.exitFullscreen();
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isPlaying, showStreamSelector, showSettings]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const switchAudioTrack = useCallback((track: { id: string; label: string; language?: string }) => {
    setActiveAudioTrack(track);
    if (hlsRef.current) {
      hlsRef.current.audioTrack = parseInt(track.id);
    }
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
    clearErrorAndOpenSelector,
    downloadStream,
    audioTracks,
    activeAudioTrack,
    switchAudioTrack,
  };
}
