import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { useAuthStore } from '@/store/useAuthStore';
import { Alert } from 'react-native';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT or pre-auth tokens automatically
api.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState();
    const token = state.token || state.preAuthToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid infinite alerts if multiple requests fail at the same time
      const state = useAuthStore.getState();
      if (state.isAuthenticated || state.token || state.preAuthToken) {
        state.clearAuth();
        Alert.alert(
          'Sesi Berakhir',
          error.response.data?.message || 'Sesi Anda telah kedaluwarsa atau token tidak valid. Silakan login kembali.'
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;
