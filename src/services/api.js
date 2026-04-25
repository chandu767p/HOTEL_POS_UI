import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
});

// Response interceptor — normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    // Auto-logout on 401 — but DON'T redirect if we are on the public kitchen display
    if (error.response?.status === 401 && window.location.pathname !== '/kitchen') {
      localStorage.removeItem('pos_token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }

    return Promise.reject(new Error(message));
  }
);

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
