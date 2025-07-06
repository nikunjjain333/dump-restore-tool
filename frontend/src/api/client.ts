import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_URL as string) || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// TypeScript interfaces
export interface DockerInfo {
  containers: number;
  images: number;
  version: string;
  os: string;
  architecture: string;
}

export interface DockerResponse {
  success: boolean;
  message: string;
  status: string;
  info?: DockerInfo;
  error?: string;
}

export interface Config {
  id: number;
  name: string;
  db_type: string;
  operation: string;
  params: Record<string, any>;
}

export interface ConfigCreate {
  name: string;
  db_type: string;
  operation: string;
  params: Record<string, any>;
}

export interface DumpRequest {
  db_type: string;
  params: Record<string, any>;
  path: string;
  run_path?: string;
}

export interface RestoreRequest {
  db_type: string;
  params: Record<string, any>;
  path: string;
  run_path?: string;
}

export interface OperationResponse {
  success: boolean;
  message: string;
  path?: string;
}

export const api = {
  // Docker
  getDockerStatus: (): Promise<AxiosResponse<DockerResponse>> => 
    apiClient.get<DockerResponse>('/docker/status'),
  startDocker: (): Promise<AxiosResponse<DockerResponse>> => 
    apiClient.post<DockerResponse>('/docker/start'),
  stopDocker: (): Promise<AxiosResponse<DockerResponse>> => 
    apiClient.post<DockerResponse>('/docker/stop'),

  // Configs
  getConfigs: (): Promise<AxiosResponse<Config[]>> => 
    apiClient.get<Config[]>('/configs'),
  createConfig: (config: ConfigCreate): Promise<AxiosResponse<Config>> => 
    apiClient.post<Config>('/configs', config),

  // Dump
  startDump: (data: DumpRequest): Promise<AxiosResponse<OperationResponse>> => 
    apiClient.post<OperationResponse>('/dump', data),

  // Restore
  startRestore: (data: RestoreRequest): Promise<AxiosResponse<OperationResponse>> => 
    apiClient.post<OperationResponse>('/restore', data),
};

export default apiClient; 