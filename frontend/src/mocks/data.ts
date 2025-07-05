import { DatabaseConfig, OperationLog } from '../context/DatabaseContext';

export const mockConfigs: DatabaseConfig[] = [
  {
    id: 1,
    name: 'Production DB',
    db_type: 'postgres',
    operation: 'dump',
    host: 'prod-db.example.com',
    port: 5432,
    username: 'admin',
    password: 'securepassword',
    database: 'production',
    dump_path: '/dumps/prod_backup.sql',
    created_at: '2023-05-15T10:00:00Z',
    updated_at: '2023-05-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Staging DB',
    db_type: 'mysql',
    operation: 'dump',
    host: 'staging-db.example.com',
    port: 3306,
    username: 'staging_user',
    password: 'stagingpass',
    database: 'staging',
    dump_path: '/dumps/staging_backup.sql',
    created_at: '2023-05-10T14:30:00Z',
    updated_at: '2023-05-12T09:15:00Z'
  },
  {
    id: 3,
    name: 'Local Development',
    db_type: 'postgres',
    operation: 'restore',
    host: 'localhost',
    port: 5432,
    username: 'dev',
    password: 'devpassword',
    database: 'dev_db',
    dump_path: '/dumps/dev_backup.sql',
    restore_path: '/dumps/restore.sql',
    additional_params: {
      ssl: false,
      poolSize: 10
    },
    created_at: '2023-05-01T08:45:00Z',
    updated_at: '2023-05-05T16:20:00Z'
  }
];

export const mockOperations: OperationLog[] = [
  {
    id: 1,
    config_id: 1,
    operation_type: 'dump',
    status: 'completed',
    file_path: '/dumps/prod_backup_20230515.sql',
    start_time: '2023-05-15T10:00:00Z',
    end_time: '2023-05-15T10:05:23Z',
    created_at: '2023-05-15T10:00:00Z'
  },
  {
    id: 2,
    config_id: 1,
    operation_type: 'restore',
    status: 'completed',
    file_path: '/dumps/prod_backup_20230514.sql',
    start_time: '2023-05-14T23:00:00Z',
    end_time: '2023-05-14T23:15:45Z',
    created_at: '2023-05-14T23:00:00Z'
  },
  {
    id: 3,
    config_id: 2,
    operation_type: 'dump',
    status: 'failed',
    error_message: 'Connection timeout',
    start_time: '2023-05-12T09:00:00Z',
    created_at: '2023-05-12T09:00:00Z'
  },
  {
    id: 4,
    config_id: 3,
    operation_type: 'dump',
    status: 'in_progress',
    start_time: '2023-05-11T15:30:00Z',
    created_at: '2023-05-11T15:30:00Z'
  }
];

// Helper functions for tests
const initialConfigs = [...mockConfigs];
const initialOperations = [...mockOperations];

export function resetMockData() {
  mockConfigs.length = 0;
  mockOperations.length = 0;
  mockConfigs.push(...initialConfigs);
  mockOperations.push(...initialOperations);
}

export function addMockConfig(config: Omit<DatabaseConfig, 'id'>) {
  const newConfig: DatabaseConfig = {
    ...config,
    id: Math.max(0, ...mockConfigs.map(c => c.id ?? 0)) + 1,
    created_at: config.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockConfigs.push(newConfig);
  return newConfig;
}

export function addMockOperation(operation: Omit<OperationLog, 'id'>) {
  const newOperation: OperationLog = {
    ...operation,
    id: Math.max(0, ...mockOperations.map(o => o.id)) + 1,
    start_time: operation.start_time || new Date().toISOString(),
    end_time: operation.end_time || (operation.status === 'completed' ? new Date().toISOString() : undefined),
    created_at: operation.created_at || new Date().toISOString()
  };
  mockOperations.push(newOperation);
  return newOperation;
};
