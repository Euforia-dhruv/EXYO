const SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL || 'https://canny-akita-674.convex.site';

const contentFetch = async (path: string, params?: Record<string, string | string[]>) => {
  const url = new URL(`${SITE_URL}/api/content${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        url.searchParams.set(k, v.join(','));
      } else {
        url.searchParams.set(k, v);
      }
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Content fetch failed: ${res.status}`);
  return res.json();
};

export interface ContentSearchResult {
  results: Array<{
    id?: string;
    imdbId?: string;
    name?: string;
    title?: string;
    posterUrl?: string;
    backdropUrl?: string;
    type?: string;
    year?: string;
    rating?: number;
    description?: string;
    runtime?: string;
    genres?: string[];
    cast?: string[];
  }>;
}

export interface ContentStreamsResult {
  streams: Array<{
    url: string;
    name?: string;
    title?: string;
    quality?: string;
    videoCodec?: string;
    audioCodec?: string;
    codec?: string;
    addon?: string;
    behaviorHints?: Record<string, unknown>;
    addonName?: string;
    addonUrl?: string;
    description?: string;
  }>;
}

export interface ContentDetailsResult {
  id?: string;
  imdbId?: string;
  name?: string;
  title?: string;
  posterUrl?: string;
  backdropUrl?: string;
  type?: string;
  year?: string;
  rating?: number;
  description?: string;
  runtime?: string;
  genres?: string[];
  cast?: string[];
  trailerStreams?: Array<{ url: string; name?: string }>;
  episodes?: Array<{
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
  }>;
}

export const contentApi = {
  getCatalogs: async (type = 'movie', catalogId = 'top') => {
    return contentFetch('/catalogs', { type, catalogId }) as Promise<ContentSearchResult>;
  },

  getCatalog: async (type: string, catalogId: string) => {
    const result = await contentFetch('/catalogs', { type, catalogId });
    if (!Array.isArray(result)) return { results: [] } as ContentSearchResult;
    return {
      results: result.map((item: any) => ({
        id: item.id || item.imdb_id || '',
        imdbId: item.imdb_id,
        name: item.name,
        posterUrl: item.poster,
        backdropUrl: item.background,
        year: item.year,
        rating: item.imdbRating,
        description: item.description,
        runtime: item.runtime,
        genres: item.genres,
        type: item.type || type,
      })),
    } as ContentSearchResult;
  },

  search: async (query: string, type?: string) => {
    const params: Record<string, string> = { q: query };
    if (type) params.type = type;
    return contentFetch('/search', params) as Promise<ContentSearchResult>;
  },

  searchByName: async (query: string, options?: { type?: 'movie' | 'tv'; limit?: number }) => {
    const params: Record<string, string> = { q: query };
    if (options?.type) params.type = options.type;
    if (options?.limit) params.limit = String(options.limit);
    return contentFetch('/search', params) as Promise<ContentSearchResult>;
  },

  getDetails: async (id: string, type = 'movie') => {
    return contentFetch('/details', { id, type }) as Promise<ContentDetailsResult>;
  },

  getStreams: async (id: string, type = 'movie', addonUrls?: string[]) => {
    if (addonUrls && addonUrls.length > 0) {
      return contentFetch('/streams', { id, type, addons: addonUrls.join(',') }) as Promise<ContentStreamsResult>;
    }
    return contentFetch('/streams', { id, type }) as Promise<ContentStreamsResult>;
  },

  getStreamFromAddon: async (id: string, type = 'movie', addonUrl: string) => {
    return contentFetch('/stream', { id, type, addon: addonUrl }) as Promise<ContentStreamsResult>;
  },

  getSubtitles: async (id: string, type = 'movie') => {
    return contentFetch('/subtitles', { id, type });
  },

  getManifest: async (addon?: string) => {
    return contentFetch('/manifest', addon ? { addon } : undefined);
  },
};
