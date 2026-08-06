export interface CatalogItem {
  id: string;
  imdbId?: string;
  name?: string;
  title?: string;
  posterUrl?: string;
  backdropUrl?: string;
  description?: string;
  type?: 'movie' | 'tv' | 'series' | 'anime';
  year?: string;
  rating?: number;
  runtime?: string;
  genres?: string[];
}

export interface Stream {
  url: string;
  proxiedUrl?: string;
  name?: string;
  title?: string;
  quality?: string;
  videoCodec?: string;
  audioCodec?: string;
  codec?: string;
  addon?: string;
  addonName?: string;
  addonUrl?: string;
  description?: string;
  behaviorHints?: Record<string, unknown>;
}

export interface Episode {
  id?: string;
  videoId?: string;
  name?: string;
  title?: string;
  episodeNumber?: number;
  seasonNumber?: number;
  description?: string;
  runtime?: number;
  rating?: number;
  stillUrl?: string;
  posterUrl?: string;
}

export interface WatchHistory {
  _id: string;
  contentId: string;
  title: string;
  contentType: string;
  progress: number;
  position: number;
  duration: number;
  backdropUrl?: string;
  lastWatched: number;
}

export interface WatchlistItem {
  _id: string;
  contentId: string;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  contentType: string;
  addedAt: number;
}
