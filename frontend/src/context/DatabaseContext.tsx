import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';

// Define and export types
export type DatabaseType = 'postgres' | 'mysql';
export type OperationType = 'dump' | 'restore';

// Define interfaces
export interface DatabaseConfig {
  id?: number;
  name: string;
  db_type: DatabaseType;
  operation: OperationType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  dump_path: string;
  restore_path?: string;
  additional_params?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface OperationLog {
  id: number;
  config_id: number;
  operation_type: string;
  status: string;
  file_path?: string;
  error_message?: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
}

interface DatabaseContextType {
  configs: DatabaseConfig[];
  operations: OperationLog[];
  loading: boolean;
  error: string | null;
  fetchConfigs: () => Promise<void>;
  getConfig: (id: number) => Promise<DatabaseConfig>;
  saveConfig: (config: Omit<DatabaseConfig, 'id'> & { id?: number }) => Promise<DatabaseConfig>;
  deleteConfig: (id: number) => Promise<void>;
  fetchOperations: (configId?: number) => Promise<void>;
  executeDump: (configId: number) => Promise<OperationLog>;
  executeRestore: (configId: number, filePath: string) => Promise<OperationLog>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [configs, setConfigs] = useState<DatabaseConfig[]>([]);
  const [operations, setOperations] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/configs/`);
      setConfigs(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch configurations');
    } finally {
      setLoading(false);
    }
  }, []);

  const getConfig = useCallback(async (id: number) => {
    try {
      const response = await axios.get(API_ENDPOINTS.CONFIG(id));
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch configuration');
      throw err;
    }
  }, []);

  const saveConfig = useCallback(async (config: Omit<DatabaseConfig, 'id'> & { id?: number }) => {
    setLoading(true);
    setError(null);
    try {
      let savedConfig: DatabaseConfig;
      if (config.id) {
        const response = await axios.put(API_ENDPOINTS.CONFIG(config.id), config);
        savedConfig = response.data;
        setConfigs(prev => prev.map(c => c.id === config.id ? savedConfig : c));
      } else {
        const response = await axios.post(API_ENDPOINTS.CONFIGS, config);
        savedConfig = response.data;
        setConfigs(prev => [...prev, savedConfig]);
      }
      return savedConfig;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteConfig = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(API_ENDPOINTS.CONFIG(id));
      setConfigs(prev => prev.filter(config => config.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOperations = useCallback(async (configId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(configId ? API_ENDPOINTS.OPERATIONS(configId) : API_ENDPOINTS.OPERATIONS());
      setOperations(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch operations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const executeDump = useCallback(async (configId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(API_ENDPOINTS.DUMP(configId));
      const operation = response.data;
      setOperations(prev => [operation, ...prev]);
      return operation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute dump';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const executeRestore = useCallback(async (configId: number, filePath: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(API_ENDPOINTS.RESTORE(configId), { file_path: filePath });
      const operation = response.data;
      setOperations(prev => [operation, ...prev]);
      return operation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute restore';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    configs,
    operations,
    loading,
    error,
    fetchConfigs,
    getConfig,
    saveConfig,
    deleteConfig,
    fetchOperations,
    executeDump,
    executeRestore,
  }), [
    configs, 
    operations, 
    loading, 
    error, 
    fetchConfigs, 
    getConfig, 
    saveConfig, 
    deleteConfig, 
    fetchOperations, 
    executeDump, 
    executeRestore
  ]);

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

// Export the hook
export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

// No need to export DatabaseProvider again as it's already exported above
