const SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL || 'https://canny-akita-674.convex.site';

const ADDON_MAP: Record<string, string> = {
  cinepro: 'https://cinepro-core-bt64.onrender.com/stremio',
  pengu: 'https://pengu.uk/%7B%22auth_token%22%3A%22Wc0F6ReosCB1m0Hn-gzD_foLJ6S3IkFfB9TcSCHcGy0%22%7D',
  nuvio: 'https://nuviostreams.hayd.uk',
  anime: 'https://animestream-addon.keypop3750.workers.dev',
  flix: 'https://free.flixnest.app',
  notorrent: 'https://addon.notorrent2.workers.dev',
  webstreamr: 'https://87d6a6ef6b58-webstreamrmbg.baby-beamup.club',
  showbox: 'https://showbox.codiv.dpdns.org',
  stremverse: 'https://stremverse.onrender.com',
  aiocatalogs: 'https://aio.pantelx.com',
  torrentio: 'https://torrentio.strem.fun',
  mediafusion: 'https://mediafusion.elfhosted.com',
  comet: 'https://comet.elfhosted.com',
};

function getEnabledAddonUrls(): string[] {
  try {
    const raw = localStorage.getItem('exyo-addons');
    const customRaw = localStorage.getItem('exyo-custom-addons');
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const customUrls: string[] = customRaw ? JSON.parse(customRaw) : [];
    const builtIn = ids.map((id) => ADDON_MAP[id]).filter(Boolean);
    return [...new Set([...builtIn, ...customUrls])];
  } catch {
    return [];
  }
}

function addonParam(addonUrls?: string[]): string | undefined {
  const urls = addonUrls && addonUrls.length > 0 ? addonUrls : getEnabledAddonUrls();
  return urls.length > 0 ? urls.join(',') : undefined;
}

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
    proxiedUrl?: string;
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

export interface AddonManifest {
  id: string | unknown;
  name: string | unknown;
  description: string | unknown;
  version: string | unknown;
  types: string[];
  catalogs: Array<{ id: string; name: string; type: string; addonUrl?: string; addonName?: string }>;
  resources: unknown;
  logo: string;
  behaviorHints: Record<string, unknown>;
  addonUrl: string;
}

export const contentApi = {
  getManifests: async (addonUrls?: string[]): Promise<AddonManifest[]> => {
    const addons = addonParam(addonUrls);
    const params: Record<string, string> = {};
    if (addons) params.addons = addons;
    return contentFetch('/manifests', params);
  },

  getCatalogs: async (type = 'movie', catalogId = 'top', addonUrls?: string[]) => {
    const addons = addonParam(addonUrls);
    const params: Record<string, string> = { type, catalogId };
    if (addons) params.addons = addons;
    const result = await contentFetch('/catalogs', params);
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

  getCatalog: async (type: string, catalogId: string, addonUrls?: string[]) => {
    const addons = addonParam(addonUrls);
    const params: Record<string, string> = { type, catalogId };
    if (addons) params.addons = addons;
    const result = await contentFetch('/catalogs', params);
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

  search: async (query: string, type?: string, addonUrls?: string[]) => {
    const params: Record<string, string> = { q: query };
    if (type) params.type = type;
    const addons = addonParam(addonUrls);
    if (addons) params.addons = addons;
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
    const addons = addonParam();
    if (addons) params.addons = addons;
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

  getDetails: async (id: string, type = 'movie', addonUrls?: string[]) => {
    const addons = addonParam(addonUrls);
    const params: Record<string, string> = { id, type };
    if (addons) params.addons = addons;
    const result = await contentFetch('/details', params) as ContentDetailsResult;
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
    const params: Record<string, string> = { id, type };
    const addons = addonParam(addonUrls);
    if (addons) params.addons = addons;
    const result = await contentFetch('/streams', params);
    if (Array.isArray(result)) {
      return {
        streams: result.map((item: any) => ({
          url: item.url,
          proxiedUrl: item.proxiedUrl,
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
          proxiedUrl: item.proxiedUrl,
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

  getSubtitles: async (id: string, type = 'movie', addonUrls?: string[]) => {
    const params: Record<string, string> = { id, type };
    const addons = addonParam(addonUrls);
    if (addons) params.addons = addons;
    const result = await contentFetch('/subtitles', params);
    if (Array.isArray(result)) {
      return { subtitles: result };
    }
    return result;
  },

  getManifest: async (addon?: string) => {
    return contentFetch('/manifest', addon ? { addon } : undefined);
  },
};
