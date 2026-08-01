import { api } from './axios';

export const searchApi = {
  getSearchHistory: async () => {
    const response = await api.get('/search-history');
    return response.data;
  },

  saveSearch: async (query: string) => {
    const response = await api.post('/search-history', { query });
    return response.data;
  },

  clearSearchHistory: async () => {
    const response = await api.delete('/search-history');
    return response.data;
  }
};
