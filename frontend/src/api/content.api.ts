import { api } from './axios';

export const contentApi = {
  getCatalogs: async (type = 'movie', catalogId = 'top') => {
    const response = await api.get(`/content/catalogs?type=${type}&catalogId=${catalogId}`);
    return response.data;
  },

  search: async (query: string, type = 'movie') => {
    const response = await api.get(`/content/search?q=${encodeURIComponent(query)}&type=${type}`);
    return response.data;
  },

  getDetails: async (id: string, type = 'movie') => {
    const response = await api.get(`/content/${id}?type=${type}`);
    return response.data;
  },

  getStreams: async (id: string, type = 'movie') => {
    const response = await api.get(`/content/${id}/streams?type=${type}`);
    return response.data;
  },

  getSubtitles: async (id: string, type = 'movie') => {
    const response = await api.get(`/content/${id}/subtitles?type=${type}`);
    return response.data;
  },

  getManifest: async (addon = 'cinemeta') => {
    const response = await api.get(`/content/manifest?addon=${addon}`);
    return response.data;
  }
};
