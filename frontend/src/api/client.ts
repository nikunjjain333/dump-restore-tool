import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_URL as string) || 'http://localhost:8000';

// Export apiClient as a variable for testability
export let apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Allow tests to override apiClient
export const setApiClient = (client: typeof apiClient) => {
  apiClient = client;
};

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
  params: Record<string, any>;
  restore_password?: string;
  local_database_name?: string;
  dump_file_name?: string;
  restore_username?: string;
  restore_host?: string;
  restore_port?: string;
}

export interface ConfigCreate {
  name: string;
  db_type: string;
  params: Record<string, any>;
  restore_password?: string;
  local_database_name?: string;
  dump_file_name?: string;
  restore_username?: string;
  restore_host?: string;
  restore_port?: string;
}

export interface DumpRequest {
  db_type: string;
  params: Record<string, any>;
  config_name: string;
  dump_file_name?: string;
}

export interface RestoreRequest {
  db_type: string;
  params: Record<string, any>;
  config_name: string;
  restore_password?: string;
  local_database_name?: string;
  dump_file_name?: string;
  restore_username?: string;
  restore_host?: string;
  restore_port?: string;
}

export interface OperationResponse {
  success: boolean;
  message: string;
  path?: string;
}

export interface DockerComposeConfig {
  id: number;
  name: string;
  path: string;
  service_name?: string;
  flags?: Record<string, any>;
  description?: string;
  is_active: boolean;
}

export interface DockerComposeConfigCreate {
  name: string;
  path: string;
  service_name?: string;
  flags?: Record<string, any>;
  description?: string;
}

export interface DockerComposeOperationRequest {
  config_id: number;
  service_name?: string;
  flags?: Record<string, any>;
  operation: string;
}

export interface DockerComposeOperationResponse {
  success: boolean;
  message: string;
  output?: string;
  services?: Record<string, any>[];
}

export const api = {
  // Docker
  getDockerStatus: (): Promise<AxiosResponse<DockerResponse>> => 
    apiClient.get<DockerResponse>('/docker/status'),

  // Configs
  getConfigs: (): Promise<AxiosResponse<Config[]>> => 
    apiClient.get<Config[]>('/configs/'),
  createConfig: (config: ConfigCreate): Promise<AxiosResponse<Config>> => 
    apiClient.post<Config>('/configs/', config),
  updateConfig: (id: number, config: Partial<ConfigCreate>): Promise<AxiosResponse<Config>> =>
    apiClient.put<Config>(`/configs/${id}`, config),
  deleteConfig: (id: number): Promise<AxiosResponse<{success: boolean, message: string}>> =>
    apiClient.delete(`/configs/${id}`),

  // Dump
  startDump: (data: DumpRequest): Promise<AxiosResponse<OperationResponse>> => 
    apiClient.post<OperationResponse>('/dump', data),

  // Restore
  startRestore: (data: RestoreRequest): Promise<AxiosResponse<OperationResponse>> => 
    apiClient.post<OperationResponse>('/restore', data),

  // Docker Compose
  getDockerComposeConfigs: (): Promise<AxiosResponse<DockerComposeConfig[]>> => 
    apiClient.get<DockerComposeConfig[]>('/docker-compose/'),
  getDockerComposeConfig: (id: number): Promise<AxiosResponse<DockerComposeConfig>> => 
    apiClient.get<DockerComposeConfig>(`/docker-compose/${id}`),
  createDockerComposeConfig: (config: DockerComposeConfigCreate): Promise<AxiosResponse<DockerComposeConfig>> => 
    apiClient.post<DockerComposeConfig>('/docker-compose/', config),
  updateDockerComposeConfig: (id: number, config: Partial<DockerComposeConfigCreate>): Promise<AxiosResponse<DockerComposeConfig>> => 
    apiClient.put<DockerComposeConfig>(`/docker-compose/${id}`, config),
  deleteDockerComposeConfig: (id: number): Promise<AxiosResponse<{success: boolean, message: string}>> => 
    apiClient.delete(`/docker-compose/${id}`),
  operateDockerCompose: (id: number, operation: DockerComposeOperationRequest): Promise<AxiosResponse<DockerComposeOperationResponse>> => 
    apiClient.post<DockerComposeOperationResponse>(`/docker-compose/${id}/operate`, operation),
  getDockerComposeServices: (id: number): Promise<AxiosResponse<{success: boolean, services?: Record<string, any>[], message?: string}>> => 
    apiClient.get(`/docker-compose/${id}/services`),
}; 