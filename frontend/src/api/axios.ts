import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('exyo-auth');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.accessToken) {
      config.headers.Authorization = `Bearer ${state.accessToken}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const stored = localStorage.getItem('exyo-auth');
      if (stored) {
        const { state } = JSON.parse(stored);
        if (state?.refreshToken) {
          try {
            const response = await axios.post('/api/auth/refresh', {
              refreshToken: state.refreshToken
            });

            const { accessToken, refreshToken } = response.data;

            const updatedState = {
              ...state,
              accessToken,
              refreshToken
            };
            localStorage.setItem('exyo-auth', JSON.stringify({ state: updatedState }));

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem('exyo-auth');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
      }
    }

    return Promise.reject(error);
  }
);
