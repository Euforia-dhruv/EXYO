const SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL || 'https://calm-eagle-889.convex.site';

const contentFetch = async (path: string, params?: Record<string, string>) => {
  const url = new URL(`${SITE_URL}/api/content${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Content fetch failed: ${res.status}`);
  return res.json();
};

export const contentApi = {
  getCatalogs: async (type = 'movie', catalogId = 'top') => {
    return contentFetch('/catalogs', { type, catalogId });
  },

  search: async (query: string, type = 'movie') => {
    return contentFetch('/search', { q: query, type });
  },

  getDetails: async (id: string, type = 'movie') => {
    return contentFetch('/details', { id, type });
  },

  getStreams: async (id: string, type = 'movie', addonUrls?: string[]) => {
    if (addonUrls && addonUrls.length > 0) {
      return contentFetch('/streams', { id, type, addons: addonUrls.join(',') });
    }
    return contentFetch('/streams', { id, type });
  },

  getStreamFromAddon: async (id: string, type = 'movie', addonUrl: string) => {
    return contentFetch('/stream', { id, type, addon: addonUrl });
  },

  getSubtitles: async (id: string, type = 'movie') => {
    return contentFetch('/subtitles', { id, type });
  },

  getManifest: async (addon?: string) => {
    return contentFetch('/manifest', addon ? { addon } : undefined);
  },
};
