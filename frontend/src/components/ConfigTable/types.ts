import { DatabaseConfig } from '../../context/DatabaseContext';

export interface ConfigTableProps {
  configs: DatabaseConfig[];
  operationStatus: Record<number, 'idle' | 'loading' | 'success' | 'error'>;
  onDump: (id: number) => void;
  onRestore: (id: number) => void;
  onViewOperations: (id: number) => void;
  onDelete: (id: number) => void;
}
