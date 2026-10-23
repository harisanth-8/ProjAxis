import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for unified data and error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
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
