import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
}

export interface WatchHistoryInput {
  contentId: string;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  contentType: 'movie' | 'series';
  season?: number;
  episode?: number;
  progress: number;
  addonSource?: string;
}

export interface WatchlistInput {
  contentId: string;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  contentType: 'movie' | 'series';
}

export interface AddonManifest {
  id: string;
  version: string;
  name: string;
  description?: string;
  types: string[];
  catalogs: Catalog[];
  resources: string[];
  behaviorHints?: Record<string, unknown>;
}

export interface Catalog {
  type: string;
  id: string;
  name: string;
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
}

export interface Stream {
  url: string;
  title?: string;
  infoHash?: string;
  quality?: string;
  behaviorHints?: Record<string, unknown>;
}
