export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  buffered: number;
  playbackRate: number;
  isBuffering: boolean;
  error: string | null;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  url: string;
  format: 'srt' | 'vtt' | 'ass' | 'ssa';
  isDefault?: boolean;
}

export interface AudioTrack {
  id: string;
  label: string;
  language: string;
  url?: string;
}

export interface StreamQuality {
  url: string;
  quality: string;
  bitrate?: number;
  codec?: string;
  hdr?: boolean;
  dolby?: boolean;
  fileSize?: string;
  seeds?: number;
  peers?: number;
  language?: string;
  provider: string;
  addonName: string;
  addonUrl: string;
  infoHash?: string;
  name?: string;
  title?: string;
  description?: string;
}
