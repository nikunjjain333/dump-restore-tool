export interface Config {
  id: number;
  name: string;
  db_type: 'postgres' | 'mysql';
  database: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  operation: 'dump' | 'restore';
  created_at: string;
  updated_at: string;
}

export type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface OperationStatusMap {
  [key: number]: OperationStatus;
}
