import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config/api';

// Create Axios Instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// --- Auth Token Management ---
// Matches the key used in auth.service.ts
const TOKEN_KEY = '@auth_token';

export const setAuthToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = async () => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// --- Auth Error Handling (Observer Pattern) ---
type AuthErrorCallback = () => void;
let authErrorListeners: AuthErrorCallback[] = [];

export const onAuthError = (callback: AuthErrorCallback) => {
  authErrorListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    authErrorListeners = authErrorListeners.filter(cb => cb !== callback);
  };
};

const notifyAuthError = () => {
  authErrorListeners.forEach(listener => listener());
};

// --- Interceptors ---

// Request Interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Notify listeners (e.g., AuthProvider to logout user)
      notifyAuthError();
      await removeAuthToken();
      
      // Optionally reject further to stop processing
    }

    // Standardize error response format if needed
    if (error.response && error.response.data) {
        return Promise.reject(error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// --- Generic API Methods ---

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config).then(res => res.data),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config).then(res => res.data),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config).then(res => res.data),

  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(url, data, config).then(res => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config).then(res => res.data),
    
  client: apiClient
};

export default api;
