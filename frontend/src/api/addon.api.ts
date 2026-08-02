import { api } from './axios';

export interface UserAddon {
  id: string;
  url: string;
  name: string | null;
  manifest: any;
  active: boolean;
  createdAt: string;
}

export const addonApi = {
  getAddons: async (): Promise<UserAddon[]> => {
    const response = await api.get('/addons');
    return response.data;
  },

  addAddon: async (url: string) => {
    const response = await api.post('/addons', { url });
    return response.data;
  },

  removeAddon: async (id: string) => {
    const response = await api.delete(`/addons/${id}`);
    return response.data;
  },

  toggleAddon: async (id: string) => {
    const response = await api.patch(`/addons/${id}/toggle`);
    return response.data;
  },
};
