import { Config } from '../../types';

export interface ConfigTableProps {
  configs: Config[];
  operationStatus: Record<number, 'idle' | 'loading' | 'success' | 'error'>;
  onDump: (id: number) => void;
  onRestore: (id: number) => void;
  onViewOperations: (id: number) => void;
  onDelete: (id: number) => void;
}
