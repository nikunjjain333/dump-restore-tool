import { DatabaseConfig } from '../../context/DatabaseContext';

export interface ActionButtonsProps {
  config: Pick<DatabaseConfig, 'id' | 'operation'>;
  operationStatus: 'idle' | 'loading' | 'success' | 'error';
  onDump: (id: number) => void;
  onRestore: (id: number) => void;
  onViewOperations: (id: number) => void;
  onDelete: (id: number) => void;
}
