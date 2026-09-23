import axios from 'axios';

const api = axios.create({
  baseURL: 'https://notehub-extk.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage on outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('notehub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to normalize error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
