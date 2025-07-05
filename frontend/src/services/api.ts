import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { DatabaseConfig, OperationLog } from '../types/database';

const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Create headers if they don't exist
      if (!config.headers) {
        config.headers = {} as any;
      }
      // Set the Authorization header
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Database Config API
export const getConfigs = (): Promise<DatabaseConfig[]> => 
  api.get('/configs').then((res) => res.data);

export const getConfig = (id: number): Promise<DatabaseConfig> => 
  api.get(`/configs/${id}`).then((res) => res.data);

export const createConfig = (config: Omit<DatabaseConfig, 'id'>): Promise<DatabaseConfig> => 
  api.post('/configs', config).then((res) => res.data);

export const updateConfig = (id: number, config: Partial<DatabaseConfig>): Promise<DatabaseConfig> => 
  api.put(`/configs/${id}`, config).then((res) => res.data);

export const deleteConfig = (id: number): Promise<void> => 
  api.delete(`/configs/${id}`);

// Operations API
export const getOperations = (configId?: number): Promise<OperationLog[]> => {
  const url = configId ? `/operations?configId=${configId}` : '/operations';
  return api.get(url).then((res) => res.data);
};

export const executeDump = (configId: number): Promise<OperationLog> => 
  api.post(`/operations/dump/${configId}`).then((res) => res.data);

export const executeRestore = (configId: number, filePath: string): Promise<OperationLog> => 
  api.post(`/operations/restore/${configId}`, { filePath }).then((res) => res.data);

// Auth API
export const login = (credentials: { username: string; password: string }) => 
  api.post('/auth/login', credentials);

export const logout = () => api.post('/auth/logout');

export const refreshToken = () => api.post('/auth/refresh');

export default api;
