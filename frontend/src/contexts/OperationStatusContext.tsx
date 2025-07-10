import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type OperationStatus = 'idle' | 'running' | 'success' | 'error';

interface OperationStatusContextType {
  operationStatus: Record<number, OperationStatus>;
  setOperationStatus: (configId: number, status: OperationStatus) => void;
  clearOperationStatus: (configId: number) => void;
  clearAllOperationStatus: () => void;
  isRunning: (configId: number) => boolean;
}

const OperationStatusContext = createContext<OperationStatusContextType | undefined>(undefined);

interface OperationStatusProviderProps {
  children: ReactNode;
}

export const OperationStatusProvider: React.FC<OperationStatusProviderProps> = ({ children }) => {
  const [operationStatus, setOperationStatusState] = useState<Record<number, OperationStatus>>({});

  const setOperationStatus = useCallback((configId: number, status: OperationStatus) => {
    setOperationStatusState(prev => ({
      ...prev,
      [configId]: status
    }));
  }, []);

  const clearOperationStatus = useCallback((configId: number) => {
    setOperationStatusState(prev => {
      const newState = { ...prev };
      delete newState[configId];
      return newState;
    });
  }, []);

  const clearAllOperationStatus = useCallback(() => {
    setOperationStatusState({});
  }, []);

  const isRunning = useCallback((configId: number) => {
    return operationStatus[configId] === 'running';
  }, [operationStatus]);

  const value: OperationStatusContextType = {
    operationStatus,
    setOperationStatus,
    clearOperationStatus,
    clearAllOperationStatus,
    isRunning
  };

  return (
    <OperationStatusContext.Provider value={value}>
      {children}
    </OperationStatusContext.Provider>
  );
};

export const useOperationStatus = (): OperationStatusContextType => {
  const context = useContext(OperationStatusContext);
  if (context === undefined) {
    throw new Error('useOperationStatus must be used within an OperationStatusProvider');
  }
  return context;
}; 