// ─────────────────────────────────────────────────────────────
// Content types
// ─────────────────────────────────────────────────────────────
export type ContentType = "movie" | "series" | "anime";

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  year?: string;
  poster?: string;
  backdrop?: string;
  description?: string;
  genres?: string[];
  rating?: number;
  runtime?: string;
  cast?: string[];
  sourceId: string;
  sourceItemId: string;
  imdbId?: string;
  tmdbId?: string;
}

export interface ContentDetails extends ContentItem {
  episodes?: EpisodeItem[];
  trailerStreams?: Array<{ url: string; name?: string }>;
}

export interface EpisodeItem {
  id: string;
  videoId?: string;
  name: string;
  title?: string;
  episodeNumber: number;
  seasonNumber: number;
  description?: string;
  runtime?: number;
  rating?: number;
  stillUrl?: string;
}

// ─────────────────────────────────────────────────────────────
// Stream types
// ─────────────────────────────────────────────────────────────
export type StreamType = "hls" | "mp4" | "dash" | "torrent" | "external";

export interface Stream {
  id: string;
  sourceId: string;
  title?: string;
  name?: string;
  url?: string;
  infoHash?: string;
  type: StreamType;
  quality?: string;
  resolution?: number;
  codec?: string;
  language?: string;
  headers?: Record<string, string>;
  behaviorHints?: {
    notWebReady?: boolean;
    proxyHeaders?: { request?: Record<string, string> };
  };
  addonName?: string;
  addonUrl?: string;
}

// ─────────────────────────────────────────────────────────────
// Subtitle types
// ─────────────────────────────────────────────────────────────
export interface Subtitle {
  id: string;
  sourceId: string;
  url: string;
  language: string;
  label?: string;
  format?: string;
}

// ─────────────────────────────────────────────────────────────
// Source manifest / capabilities
// ─────────────────────────────────────────────────────────────
export interface SourceCapabilities {
  catalogs: boolean;
  search: boolean;
  details: boolean;
  streams: boolean;
  subtitles: boolean;
}

export interface SourceManifest {
  id: string;
  name: string;
  description?: string;
  version?: string;
  types?: string[];
  catalogs?: Array<{
    type: string;
    id: string;
    name?: string;
    extra?: Array<{ name: string; isRequired?: boolean }>;
  }>;
  resources?: Array<string | { name: string; types?: string[]; idPrefixes?: string[] }>;
  logo?: string;
  behaviorHints?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// Source adapter interface
// ─────────────────────────────────────────────────────────────
export interface ContentSource {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  priority: number;
  capabilities: SourceCapabilities;

  getManifest?(): Promise<SourceManifest | null>;
  getCatalog?(type: ContentType, catalogId: string): Promise<ContentItem[]>;
  search?(query: string, type?: ContentType): Promise<ContentItem[]>;
  getDetails?(id: string, type: ContentType): Promise<ContentDetails | null>;
  getStreams?(id: string, type: ContentType): Promise<Stream[]>;
  getSubtitles?(id: string, type: ContentType): Promise<Subtitle[]>;
}

// ─────────────────────────────────────────────────────────────
// Source health
// ─────────────────────────────────────────────────────────────
export interface SourceHealth {
  sourceId: string;
  healthy: boolean;
  latencyMs?: number;
  lastChecked: number;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Stream health
// ─────────────────────────────────────────────────────────────
export interface StreamHealth {
  healthy: boolean;
  latencyMs?: number;
  status?: number;
  reason?: string;
}

// ─────────────────────────────────────────────────────────────
// Source registry config
// ─────────────────────────────────────────────────────────────
export interface SourceConfig {
  id: string;
  name: string;
  baseUrl: string;
  type: "stremio" | "custom" | "catalog";
  enabled: boolean;
  priority: number;
  auth?: string;
  authType?: "cookie" | "bearer";
  timeout?: number;
}
