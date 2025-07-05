import { Config } from '../../types';

export interface ActionButtonsProps {
  config: Pick<Config, 'id' | 'operation'>;
  operationStatus: 'idle' | 'loading' | 'success' | 'error';
  onDump: (id: number) => void;
  onRestore: (id: number) => void;
  onViewOperations: (id: number) => void;
  onDelete: (id: number) => void;
}
