import { DatabaseConfig, OperationLog } from '../context/DatabaseContext';

export interface AppState {
  configs: DatabaseConfig[];
  operations: OperationLog[];
  loading: boolean;
  error: string | null;
  selectedConfigId: number | null;
}

export type DatabaseAction =
  | { type: 'FETCH_CONFIGS_REQUEST' }
  | { type: 'FETCH_CONFIGS_SUCCESS'; payload: DatabaseConfig[] }
  | { type: 'FETCH_CONFIGS_FAILURE'; payload: string }
  | { type: 'FETCH_OPERATIONS_REQUEST' }
  | { type: 'FETCH_OPERATIONS_SUCCESS'; payload: OperationLog[] }
  | { type: 'FETCH_OPERATIONS_FAILURE'; payload: string }
  | { type: 'SELECT_CONFIG'; payload: number | null }
  | { type: 'ADD_OR_UPDATE_CONFIG'; payload: DatabaseConfig }
  | { type: 'DELETE_CONFIG'; payload: number }
  | { type: 'ADD_OPERATION'; payload: OperationLog }
  | { type: 'UPDATE_OPERATION'; payload: OperationLog };

export type AppDispatch = (action: DatabaseAction) => void;
