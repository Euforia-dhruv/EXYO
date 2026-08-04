import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useConvexQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { contentApi } from '../api/content.api';
import { usePlayer } from '../hooks/usePlayer';
import PlayerControls from '../components/player/PlayerControls';
import SubtitleRenderer from '../components/player/SubtitleRenderer';
import StreamSelector from '../components/player/StreamSelector';
import { useDownloadStore } from '../store/downloadStore';
import { SkeletonPlayer } from '../components/Skeleton';
import type { Stream } from '../types';

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');
  const navigate = useNavigate();

  const addOrUpdateHistory = useMutation(api.watchHistory.addOrUpdate);
  const addDownload = useDownloadStore((s) => s.addDownload);

  const userAddons = useConvexQuery(api.addons.getAddons);
  const activeAddonUrls = (userAddons ?? [])
    .filter((a: { active: boolean }) => a.active)
    .map((a: { url: string }) => a.url);

  const { data: rawStreams = [], isLoading } = useQuery<Stream[]>({
    queryKey: ['streams', id, type, season, episode, activeAddonUrls.join(',')],
    queryFn: () => contentApi.getStreams(id!, type, activeAddonUrls.length > 0 ? activeAddonUrls : undefined),
    enabled: !!id,
  });

  const { data: content } = useQuery({
    queryKey: ['content', id, type],
    queryFn: () => contentApi.getDetails(id!, type),
    enabled: !!id,
  });

  const { data: subtitleData } = useQuery<{ url: string; lang: string; label: string }[]>({
    queryKey: ['subtitles', id, type],
    queryFn: () => contentApi.getSubtitles(id!, type),
    enabled: !!id,
  });

  const enrichedStreams = rawStreams.map((s, i) => ({
    ...s,
    addonName: s.addonName || 'Unknown',
    addonUrl: s.addonUrl || '',
    name: s.name || s.title || s.quality || `Source ${i + 1}`,
    provider: s.addonName || 'Unknown',
  }));

  const subtitles = (subtitleData || []).map((s) => ({
    ...s,
    type: 'vtt',
  }));

  const player = usePlayer({
    streams: enrichedStreams,
    subtitles,
    onProgress: (progress) => {
      if (!id) return;
      addOrUpdateHistory({
        contentId: id,
        title: content?.name || 'Content',
        posterUrl: content?.poster,
        backdropUrl: content?.background,
        contentType: type as 'movie' | 'series',
        season: season ? parseInt(season) : undefined,
        episode: episode ? parseInt(episode) : undefined,
        progress,
        addonSource: player.selectedStream?.addonName,
      }).catch(() => {});
    },
  });

  const handleDownload = () => {
    if (!player.selectedStream || !content) return;
    const quality = player.selectedStream.quality || 'Unknown';
    addDownload({
      contentId: id!,
      title: content.name || 'Content',
      posterUrl: content.poster,
      type: type as 'movie' | 'series',
      season: season ? parseInt(season) : undefined,
      episode: episode ? parseInt(episode) : undefined,
      size: quality,
      downloaded: '0 MB',
    });
    player.downloadStream(
      player.selectedStream,
      `${content.name || id}_${quality}.mp4`
    );
  };

  if (isLoading) return <SkeletonPlayer />;

  if (enrichedStreams.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
        <div className="w-24 h-24 mb-8 rounded-full bg-white/5 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-2xl font-bold mb-3">No streams found</p>
        <p className="text-gray-400 mb-10 text-center max-w-md">
          Install streaming addons to watch content. PenguPlay and Flix-Streams provide free HTTP
          streams. Torrentio and MediaFusion provide torrent streams (need debrid for instant playback).
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors font-bold text-sm"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/settings/streaming')}
            className="px-8 py-3 bg-exyo-red rounded-2xl hover:bg-exyo-red-dark transition-colors font-bold text-sm"
          >
            Manage Addons
          </button>
        </div>
      </div>
    );
  }

  const contentName = content?.name || 'Now Playing';
  const episodeLabel =
    type === 'series' && season && episode
      ? ` — S${season} E${episode}`
      : '';

  return (
    <div
      ref={player.containerRef}
      className="relative h-screen bg-black flex items-center justify-center"
      onMouseMove={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <video
        ref={player.videoRef}
        className="w-full h-full object-contain"
        playsInline
        onClick={player.togglePlay}
      />

      {player.isBuffering && !player.videoError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {player.videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-white font-bold text-lg mb-2">Playback Error</p>
            <p className="text-gray-400 text-sm mb-6 max-w-md">{player.videoError}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={player.clearErrorAndOpenSelector}
                className="px-6 py-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors font-bold text-sm"
              >
                Try Another Source
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 bg-exyo-red rounded-xl hover:bg-exyo-red-dark transition-colors font-bold text-sm"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      <SubtitleRenderer
        currentTime={player.currentTime}
        subtitleUrl={player.activeSubtitleUrl || ''}
        isActive={player.showSubtitles}
      />

      <div
        className={`transition-opacity duration-300 z-20 ${
          player.showControls ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ pointerEvents: player.showControls ? 'auto' : 'none' }}
      >
        <PlayerControls
          contentName={`${contentName}${episodeLabel}`}
          selectedStream={player.selectedStream}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          volume={player.volume}
          isMuted={player.isMuted}
          isFullscreen={player.isFullscreen}
          buffered={player.buffered}
          playbackRate={player.playbackRate}
          showSettings={player.showSettings}
          onTogglePlay={player.togglePlay}
          onSeek={player.seekTo}
          onVolumeChange={player.setVolumeTo}
          onToggleMute={player.toggleMute}
          onToggleFullscreen={player.toggleFullscreen}
          onTogglePiP={player.togglePiP}
          onSkip={player.skip}
          onChangePlaybackRate={player.changePlaybackRate}
          onToggleSettings={() => player.setShowSettings(!player.showSettings)}
          onOpenStreams={() => player.setShowStreamSelector(true)}
          onDownload={handleDownload}
          onBack={() => navigate(-1)}
          onToggleSubtitles={player.toggleSubtitles}
          showSubtitles={player.showSubtitles}
        />
      </div>

      <StreamSelector
        streams={player.streams}
        selectedStream={player.selectedStream}
        isOpen={player.showStreamSelector}
        onClose={() => player.setShowStreamSelector(false)}
        onSelect={player.selectStream}
        onManageAddons={() => navigate('/settings/streaming')}
      />
    </div>
  );
}
