export interface WatchHistory {
  id: string;
  contentId: string;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  contentType: 'movie' | 'series';
  season?: number;
  episode?: number;
  progress: number;
  watchedAt: string;
  addonSource?: string;
}

export interface WatchlistItem {
  id: string;
  contentId: string;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  contentType: 'movie' | 'series';
  addedAt: string;
}

export interface CatalogItem {
  id: string;
  type: string;
  name: string;
  poster?: string;
  background?: string;
  description?: string;
  year?: string;
  runtime?: string;
  genres?: string[];
  imdbRating?: string;
  cast?: { name: string; role: string; avatar?: string }[];
}

export interface Stream {
  url: string;
  proxiedUrl?: string;
  title?: string;
  infoHash?: string;
  quality?: string;
  videoCodec?: string;
  audioCodec?: string;
  codec?: string;
  addon?: string;
  behaviorHints?: Record<string, unknown>;
  addonName?: string;
  addonUrl?: string;
  name?: string;
  description?: string;
}

export interface AddonManifest {
  id: string;
  version: string;
  name: string;
  description?: string;
  types: string[];
  catalogs: Catalog[];
}

export interface Catalog {
  type: string;
  id: string;
  name: string;
}

export interface SearchHistory {
  id: string;
  query: string;
  searchedAt: string;
}
