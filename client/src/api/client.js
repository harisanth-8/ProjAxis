import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach Bearer token (ensures auth works even when browsers block third-party cookies)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('projaxis_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified data and error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('projaxis_token');
    }
    const errorPayload = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'An unexpected network error occurred'
    };
    // Attach original response so both err.message and err.response?.data?.error?.message work
    errorPayload.response = error.response;
    return Promise.reject(errorPayload);
  }
);

export default api;
