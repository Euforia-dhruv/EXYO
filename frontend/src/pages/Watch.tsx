import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Hls from 'hls.js';
import { contentApi } from '../api/content.api';
import { historyApi } from '../api/history.api';
import type { Stream } from '../types';
import { formatTime } from '../utils/helpers';
import { SkeletonPlayer } from '../components/Skeleton';

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [buffered, setBuffered] = useState(0);

  const { data: streams = [], isLoading } = useQuery<Stream[]>({
    queryKey: ['streams', id, type],
    queryFn: () => contentApi.getStreams(id!, type),
    enabled: !!id
  });

  const { data: content } = useQuery({
    queryKey: ['content', id, type],
    queryFn: () => contentApi.getDetails(id!, type),
    enabled: !!id
  });

  const saveProgressMutation = useMutation({
    mutationFn: (progress: number) => historyApi.addOrUpdate({
      contentId: id!,
      title: content?.name || 'Content',
      posterUrl: content?.poster,
      backdropUrl: content?.background,
      contentType: type as 'movie' | 'series',
      progress: Math.min(progress, 100)
    })
  });

  useEffect(() => {
    if (streams.length > 0 && !selectedStream) {
      setSelectedStream(streams[0]);
    }
  }, [streams, selectedStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedStream) return;

    let hls: Hls | null = null;

    const setupPlayer = () => {
      if (selectedStream.url.includes('.m3u8') && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(selectedStream.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = selectedStream.url;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(() => {});
        });
      } else {
        video.src = selectedStream.url;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(() => {});
        });
      }
    };

    setupPlayer();

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration) {
        const progress = (video.currentTime / video.duration) * 100;
        saveProgressMutation.mutate(progress);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

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
      if (hls) {
        hls.destroy();
      }
    };
  }, [selectedStream, saveProgressMutation]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isPlaying]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
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

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  }, []);

  if (isLoading) {
    return <SkeletonPlayer />;
  }

  if (streams.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <svg className="w-16 h-16 mb-4 text-exyo-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-xl mb-4">No streams available</p>
        <p className="text-exyo-gray mb-6">Try a different addon or content</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-exyo-red rounded hover:bg-red-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-screen bg-black flex items-center justify-center cursor-none"
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
      />

      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ pointerEvents: showControls ? 'auto' : 'none' }}
      >
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />

        <div className="absolute top-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(-1);
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-4">
              <span className="text-exyo-red font-bold text-xl">EXYO</span>
              <span className="text-white font-medium">
                {content?.name || 'Now Playing'}
              </span>
            </div>

            <div className="w-12" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8">
          <div className="max-w-4xl mx-auto">
            {streams.length > 1 && (
              <div className="mb-4 flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {streams.map((stream, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStream(stream);
                    }}
                    className={`flex-shrink-0 px-4 py-2 rounded text-sm transition-colors ${
                      selectedStream === stream
                        ? 'bg-white text-black'
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    {stream.quality || `Stream ${index + 1}`}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  skip(-10);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors hidden md:block"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  skip(10);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors hidden md:block"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
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
                  onChange={(e) => {
                    e.stopPropagation();
                    handleVolumeChange(e);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-exyo-red"
                />
              </div>

              <span className="text-sm text-white font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex-1 mx-4 relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-gray-600 rounded">
                  <div
                    className="absolute h-full bg-gray-400 rounded"
                    style={{ width: `${buffered}%` }}
                  />
                  <div
                    className="absolute h-full bg-exyo-red rounded"
                    style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSeek(e);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-1 opacity-0 cursor-pointer relative z-10"
                />
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                {isFullscreen ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
