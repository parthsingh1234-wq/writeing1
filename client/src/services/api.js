import axios from 'axios';

const API = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vault_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('vault_token');
      localStorage.removeItem('vault_user');
      // Redirect to login if unauthenticated on protected route
      if (!window.location.pathname.startsWith('/article/')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(new Error(message));
  }
);

export default API;
