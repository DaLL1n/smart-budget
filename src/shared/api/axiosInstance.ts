import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Global Axios client instance with default configurations & interceptors
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Auth Token or Headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // If auth token is stored in localStorage/session
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Uniform Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized session
      console.warn('API Unauthorized: 401');
    }
    return Promise.reject(error);
  }
);
