import { api } from './axios';

export interface WatchlistInput {
  contentId: string;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  contentType: 'movie' | 'series';
}

export const watchlistApi = {
  getWatchlist: async () => {
    const response = await api.get('/watchlist');
    return response.data;
  },

  addToWatchlist: async (data: WatchlistInput) => {
    const response = await api.post('/watchlist', data);
    return response.data;
  },

  removeFromWatchlist: async (id: string) => {
    const response = await api.delete(`/watchlist/${id}`);
    return response.data;
  },

  checkInWatchlist: async (contentId: string) => {
    const response = await api.get(`/watchlist/check/${contentId}`);
    return response.data;
  }
};
