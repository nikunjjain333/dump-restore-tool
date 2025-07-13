import { api, setApiClient } from '../../../api/client';

describe('API Client Unit Tests', () => {
  let mockApiClient: any;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    setApiClient(mockApiClient);
  });

  describe('getConfigs', () => {
    it('should fetch configurations successfully', async () => {
      const mockConfigs = [
        {
          id: 1,
          name: 'Test Config',
          db_type: 'postgres',
          params: { host: 'localhost', port: 5432 },
          restore_password: 'password',
        },
      ];
      mockApiClient.get.mockResolvedValueOnce({ data: mockConfigs });
      const result = await api.getConfigs();
      expect(result.data).toEqual(mockConfigs);
    });
    it('should handle API errors', async () => {
      const errorMessage = 'Network error';
      mockApiClient.get.mockRejectedValueOnce(new Error(errorMessage));
      await expect(api.getConfigs()).rejects.toThrow(errorMessage);
    });
    it('should handle empty response', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: [] });
      const result = await api.getConfigs();
      expect(result.data).toEqual([]);
    });
  });

  describe('createConfig', () => {
    it('should create configuration successfully', async () => {
      const configData = {
        name: 'New Config',
        db_type: 'mysql',
        params: { host: 'localhost', port: 3306 },
        restore_password: 'password',
      };
      const mockResponse = { id: 2, ...configData };
      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });
      const result = await api.createConfig(configData);
      expect(result.data).toEqual(mockResponse);
    });
    it('should handle validation errors', async () => {
      const configData = { name: '', db_type: 'invalid', params: {}, restore_password: 'password' };
      const errorResponse = { response: { data: { detail: 'Validation error' } } };
      mockApiClient.post.mockRejectedValueOnce(errorResponse);
      await expect(api.createConfig(configData)).rejects.toEqual(errorResponse);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration successfully', async () => {
      const configId = 1;
      const updateData = { name: 'Updated Config' };
      const mockResponse = { id: configId, ...updateData };
      mockApiClient.put.mockResolvedValueOnce({ data: mockResponse });
      const result = await api.updateConfig(configId, updateData);
      expect(result.data).toEqual(mockResponse);
    });
    it('should handle non-existent config', async () => {
      const configId = 999;
      const updateData = { name: 'Updated Config' };
      const errorResponse = { response: { status: 404, data: { detail: 'Config not found' } } };
      mockApiClient.put.mockRejectedValueOnce(errorResponse);
      await expect(api.updateConfig(configId, updateData)).rejects.toEqual(errorResponse);
    });
  });

  describe('deleteConfig', () => {
    it('should delete configuration successfully', async () => {
      const configId = 1;
      mockApiClient.delete.mockResolvedValueOnce({ data: { success: true, message: 'Config deleted' } });
      const result = await api.deleteConfig(configId);
      expect(result.data).toEqual({ success: true, message: 'Config deleted' });
    });
    it('should handle deletion of non-existent config', async () => {
      const configId = 999;
      const errorResponse = { response: { status: 404, data: { detail: 'Config not found' } } };
      mockApiClient.delete.mockRejectedValueOnce(errorResponse);
      await expect(api.deleteConfig(configId)).rejects.toEqual(errorResponse);
    });
  });

  describe('startDump', () => {
    it('should start dump operation successfully', async () => {
      const dumpData = {
        db_type: 'postgres',
        params: { host: 'localhost', port: 5432 },
        config_name: 'test-config',
      };
      const mockResponse = {
        success: true,
        message: 'Dump completed',
        path: '/tmp/dump.sql',
      };
      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });
      const result = await api.startDump(dumpData);
      expect(result.data).toEqual(mockResponse);
    });
    it('should handle dump operation failure', async () => {
      const dumpData = {
        db_type: 'postgres',
        params: { host: 'invalid', port: 5432 },
        config_name: 'test-config',
      };
      const errorResponse = {
        response: {
          status: 500,
          data: { detail: 'Database connection failed' },
        },
      };
      mockApiClient.post.mockRejectedValueOnce(errorResponse);
      await expect(api.startDump(dumpData)).rejects.toEqual(errorResponse);
    });
  });

  describe('startRestore', () => {
    it('should start restore operation successfully', async () => {
      const restoreData = {
        db_type: 'postgres',
        params: { host: 'localhost', port: 5432 },
        config_name: 'test-config',
        restore_password: 'password',
        local_database_name: 'testdb',
        dump_file_name: 'dump.sql',
        restore_username: 'postgres',
        restore_host: 'localhost',
        restore_port: '5432',
      };
      const mockResponse = {
        success: true,
        message: 'Restore completed',
        path: '/tmp/dump.sql',
      };
      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });
      const result = await api.startRestore(restoreData);
      expect(result.data).toEqual(mockResponse);
    });
    it('should handle restore operation failure', async () => {
      const restoreData = {
        db_type: 'postgres',
        params: { host: 'localhost', port: 5432 },
        config_name: 'test-config',
        restore_password: 'password',
        local_database_name: 'testdb',
        dump_file_name: 'nonexistent.sql',
        restore_username: 'postgres',
        restore_host: 'localhost',
        restore_port: '5432',
      };
      const errorResponse = {
        response: {
          status: 404,
          data: { detail: 'Dump file not found' },
        },
      };
      mockApiClient.post.mockRejectedValueOnce(errorResponse);
      await expect(api.startRestore(restoreData)).rejects.toEqual(errorResponse);
    });
  });

  describe('getDockerStatus', () => {
    it('should get Docker status successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Docker daemon is running',
        status: 'running',
        info: { containers: 5, images: 12, version: '24.0.5', os: 'linux', architecture: 'x86_64' },
      };
      mockApiClient.get.mockResolvedValueOnce({ data: mockResponse });
      const result = await api.getDockerStatus();
      expect(result.data).toEqual(mockResponse);
    });
    it('should handle Docker not running', async () => {
      const errorResponse = {
        response: {
          status: 503,
          data: { detail: 'Docker daemon not accessible' },
        },
      };
      mockApiClient.get.mockRejectedValueOnce(errorResponse);
      await expect(api.getDockerStatus()).rejects.toEqual(errorResponse);
    });
  });

  describe('getDockerComposeConfigs', () => {
    it('should fetch Docker Compose configurations successfully', async () => {
      const mockConfigs = [
        {
          id: 1,
          name: 'Test Stack',
          path: '/path/to/compose.yml',
          service_name: 'web',
          flags: { detach: true },
          description: 'Test description',
          is_active: true,
        },
      ];
      mockApiClient.get.mockResolvedValueOnce({ data: mockConfigs });
      const result = await api.getDockerComposeConfigs();
      expect(result.data).toEqual(mockConfigs);
    });
    it('should handle empty Docker Compose configurations', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: [] });
      const result = await api.getDockerComposeConfigs();
      expect(result.data).toEqual([]);
    });
  });

  describe('createDockerComposeConfig', () => {
    it('should create Docker Compose configuration successfully', async () => {
      const configData = {
        name: 'New Stack',
        path: '/path/to/compose.yml',
        service_name: 'app',
        flags: { detach: true, build: false },
        description: 'New stack description',
      };
      const mockResponse = { id: 2, ...configData, is_active: false };
      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });
      const result = await api.createDockerComposeConfig(configData);
      expect(result.data).toEqual(mockResponse);
    });
    it('should handle invalid Docker Compose configuration', async () => {
      const configData = {
        name: '',
        path: '/invalid/path',
        service_name: '',
        flags: {},
        description: '',
      };
      const errorResponse = {
        response: {
          status: 400,
          data: { detail: 'Invalid configuration' },
        },
      };
      mockApiClient.post.mockRejectedValueOnce(errorResponse);
      await expect(api.createDockerComposeConfig(configData)).rejects.toEqual(errorResponse);
    });
  });

  describe('operateDockerCompose', () => {
    it('should operate Docker Compose successfully', async () => {
      const configId = 1;
      const operationData = {
        config_id: configId,
        operation: 'up',
        service_name: 'web',
        flags: { detach: true, build: true },
      };
      const mockResponse = {
        success: true,
        message: 'Docker Compose up completed successfully',
        output: 'Starting web_1 ... done',
      };
      mockApiClient.post.mockResolvedValueOnce({ data: mockResponse });
      const result = await api.operateDockerCompose(configId, operationData);
      expect(result.data).toEqual(mockResponse);
    });
    it('should handle Docker Compose operation failure', async () => {
      const configId = 1;
      const operationData = {
        config_id: configId,
        operation: 'up',
        service_name: 'nonexistent',
        flags: { detach: true },
      };
      const errorResponse = {
        response: {
          status: 500,
          data: { detail: 'Service not found' },
        },
      };
      mockApiClient.post.mockRejectedValueOnce(errorResponse);
      await expect(api.operateDockerCompose(configId, operationData)).rejects.toEqual(errorResponse);
    });
    it('should handle invalid operation', async () => {
      const configId = 1;
      const operationData = {
        config_id: configId,
        operation: 'invalid',
        service_name: 'web',
        flags: {},
      };
      const errorResponse = {
        response: {
          status: 400,
          data: { detail: 'Invalid operation' },
        },
      };
      mockApiClient.post.mockRejectedValueOnce(errorResponse);
      await expect(api.operateDockerCompose(configId, operationData)).rejects.toEqual(errorResponse);
    });
  });
}); 