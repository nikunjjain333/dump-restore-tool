const API_BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
  CONFIGS: `${API_BASE_URL}/api/configs`,
  OPERATIONS: (configId?: number) => 
    configId 
      ? `${API_BASE_URL}/api/operations?config_id=${configId}` 
      : `${API_BASE_URL}/api/operations`,
  CONFIG: (id: number) => `${API_BASE_URL}/api/configs/${id}`,
  DUMP: (configId: number) => `${API_BASE_URL}/api/operations/dump/${configId}`,
  RESTORE: (configId: number) => `${API_BASE_URL}/api/operations/restore/${configId}`,
};

export default API_ENDPOINTS;
