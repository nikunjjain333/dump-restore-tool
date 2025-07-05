export type DatabaseType = 'postgres' | 'mysql';

export interface DatabaseConfig {
  id?: number;
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  createdAt?: string;
  updatedAt?: string;
}

export type OperationStatus = 'pending' | 'running' | 'completed' | 'failed';
export type OperationType = 'dump' | 'restore';

export interface OperationLog {
  id?: number;
  configId: number;
  operationType: OperationType;
  status: OperationStatus;
  filePath?: string;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}
