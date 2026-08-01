import { api } from './axios';

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

export const historyApi = {
  getHistory: async (page = 1, limit = 20) => {
    const response = await api.get(`/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  getContinueWatching: async () => {
    const response = await api.get('/history/continue-watching');
    return response.data;
  },

  addOrUpdate: async (data: WatchHistoryInput) => {
    const response = await api.post('/history', data);
    return response.data;
  },

  updateProgress: async (id: string, progress: number) => {
    const response = await api.put(`/history/${id}`, { progress });
    return response.data;
  },

  deleteItem: async (id: string) => {
    const response = await api.delete(`/history/${id}`);
    return response.data;
  },

  clearHistory: async () => {
    const response = await api.delete('/history');
    return response.data;
  }
};
