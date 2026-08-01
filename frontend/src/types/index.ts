export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

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
}

export interface Stream {
  url: string;
  title?: string;
  infoHash?: string;
  quality?: string;
  behaviorHints?: Record<string, unknown>;
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
