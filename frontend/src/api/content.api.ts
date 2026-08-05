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
    const result = await contentFetch('/catalogs', { type, catalogId });
    if (Array.isArray(result)) {
      return {
        results: result.map((item: any) => ({
          id: item.id || item.imdb_id || '',
          imdbId: item.imdb_id,
          name: item.name,
          posterUrl: item.poster,
          backdropUrl: item.background,
          year: item.releaseInfo || item.year,
          rating: item.imdbRating ? Number(item.imdbRating) : undefined,
          description: item.description,
          runtime: item.runtime,
          genres: item.genres || item.genre,
          type: item.type || type,
        })),
      } as ContentSearchResult;
    }
    return result as ContentSearchResult;
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
    const result = await contentFetch('/search', params);
    if (Array.isArray(result)) {
      return {
        results: result.map((item: any) => ({
          id: item.id || item.imdb_id || '',
          imdbId: item.imdb_id,
          name: item.name,
          posterUrl: item.poster,
          backdropUrl: item.background,
          year: item.releaseInfo || item.year,
          rating: item.imdbRating ? Number(item.imdbRating) : undefined,
          description: item.description,
          type: item.type || type,
        })),
      } as ContentSearchResult;
    }
    return result as ContentSearchResult;
  },

  searchByName: async (query: string, options?: { type?: 'movie' | 'tv'; limit?: number }) => {
    const params: Record<string, string> = { q: query };
    if (options?.type) params.type = options.type;
    if (options?.limit) params.limit = String(options.limit);
    const result = await contentFetch('/search', params);
    if (Array.isArray(result)) {
      return {
        results: result.map((item: any) => ({
          id: item.id || item.imdb_id || '',
          imdbId: item.imdb_id,
          name: item.name,
          posterUrl: item.poster,
          backdropUrl: item.background,
          year: item.releaseInfo || item.year,
          rating: item.imdbRating ? Number(item.imdbRating) : undefined,
          description: item.description,
          type: item.type || options?.type,
        })),
      } as ContentSearchResult;
    }
    return result as ContentSearchResult;
  },

  getDetails: async (id: string, type = 'movie') => {
    const result = await contentFetch('/details', { id, type }) as ContentDetailsResult;
    if (!result.episodes && (result as any).videos) {
      result.episodes = (result as any).videos
        .filter((v: any) => v.type === 'episode' || v.season)
        .map((v: any) => ({
          id: v.id || `${id}:${v.season}:${v.number || v.episode}`,
          videoId: v.videoId || `${id}:${v.season}:${v.number || v.episode}`,
          name: v.name,
          title: v.name,
          episodeNumber: v.number || v.episode,
          seasonNumber: v.season,
          description: v.description || '',
          runtime: v.runtime,
          rating: v.imdbRating ? Number(v.imdbRating) : undefined,
          stillUrl: v.poster || v.thumb,
        }));
    }
    return result;
  },

  getStreams: async (id: string, type = 'movie', addonUrls?: string[]) => {
    let result;
    if (addonUrls && addonUrls.length > 0) {
      result = await contentFetch('/streams', { id, type, addons: addonUrls.join(',') });
    } else {
      result = await contentFetch('/streams', { id, type });
    }
    if (Array.isArray(result)) {
      return {
        streams: result.map((item: any) => ({
          url: item.url,
          name: item.name,
          title: item.title || item.name,
          quality: item.quality || item.description,
          videoCodec: item.videoCodec || item.codec,
          audioCodec: item.audioCodec,
          codec: item.codec,
          addon: item.addon,
          addonName: item.addonName,
          addonUrl: item.addonUrl,
          description: item.description,
          behaviorHints: item.behaviorHints,
        })),
      } as ContentStreamsResult;
    }
    return result as ContentStreamsResult;
  },

  getStreamFromAddon: async (id: string, type = 'movie', addonUrl: string) => {
    const result = await contentFetch('/stream', { id, type, addon: addonUrl });
    if (Array.isArray(result)) {
      return {
        streams: result.map((item: any) => ({
          url: item.url,
          name: item.name,
          title: item.title || item.name,
          quality: item.quality || item.description,
          videoCodec: item.videoCodec || item.codec,
          audioCodec: item.audioCodec,
          codec: item.codec,
          addon: item.addon,
          addonName: item.addonName,
          addonUrl: item.addonUrl,
          description: item.description,
          behaviorHints: item.behaviorHints,
        })),
      } as ContentStreamsResult;
    }
    return result as ContentStreamsResult;
  },

  getSubtitles: async (id: string, type = 'movie') => {
    const result = await contentFetch('/subtitles', { id, type });
    if (Array.isArray(result)) {
      return { subtitles: result };
    }
    return result;
  },

  getManifest: async (addon?: string) => {
    return contentFetch('/manifest', addon ? { addon } : undefined);
  },
};
