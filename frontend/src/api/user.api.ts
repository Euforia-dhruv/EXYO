import { api } from './axios';

export const userApi = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updateProfile: async (data: { displayName?: string; email?: string }) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/user/password', { currentPassword, newPassword });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/user/account');
    return response.data;
  }
};
