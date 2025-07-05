import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { AppState, AppDispatch } from './types';
import { databaseReducer, initialState } from './reducer';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';
import type { DatabaseConfig, OperationLog } from '../context/DatabaseContext';

const DatabaseStateContext = createContext<AppState | undefined>(undefined);
const DatabaseDispatchContext = createContext<AppDispatch | undefined>(undefined);

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(databaseReducer, initialState);

  // Wrap dispatch in useCallback for stable identity
  const stableDispatch = useCallback(dispatch, [dispatch]);

  return (
    <DatabaseStateContext.Provider value={state}>
      <DatabaseDispatchContext.Provider value={stableDispatch}>
        {children}
      </DatabaseDispatchContext.Provider>
    </DatabaseStateContext.Provider>
  );
};

export const useDatabaseState = () => {
  const context = useContext(DatabaseStateContext);
  if (context === undefined) {
    throw new Error('useDatabaseState must be used within a DatabaseProvider');
  }
  return context;
};

export const useDatabaseDispatch = () => {
  const context = useContext(DatabaseDispatchContext);
  if (context === undefined) {
    throw new Error('useDatabaseDispatch must be used within a DatabaseProvider');
  }
  return context;
};

// Helper hook to combine state and dispatch
export const useDatabase = () => {
  return [useDatabaseState(), useDatabaseDispatch()] as const;
};

// Action creators
export const fetchConfigs = async (dispatch: AppDispatch) => {
  dispatch({ type: 'FETCH_CONFIGS_REQUEST' });
  try {
    const response = await axios.get(API_ENDPOINTS.CONFIGS);
    dispatch({ type: 'FETCH_CONFIGS_SUCCESS', payload: response.data });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    dispatch({ type: 'FETCH_CONFIGS_FAILURE', payload: errorMessage });
  }
};

export const fetchOperations = async (dispatch: AppDispatch, configId?: number) => {
  dispatch({ type: 'FETCH_OPERATIONS_REQUEST' });
  try {
    const url = configId ? API_ENDPOINTS.OPERATIONS(configId) : API_ENDPOINTS.OPERATIONS();
    const response = await axios.get(url);
    dispatch({ type: 'FETCH_OPERATIONS_SUCCESS', payload: response.data });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    dispatch({ type: 'FETCH_OPERATIONS_FAILURE', payload: errorMessage });
  }
};

export const saveConfig = async (dispatch: AppDispatch, config: Omit<DatabaseConfig, 'id'> & { id?: number }) => {
  try {
    let response;
    if (config.id) {
      response = await axios.put(API_ENDPOINTS.CONFIG(config.id), config);
    } else {
      response = await axios.post(API_ENDPOINTS.CONFIGS, config);
    }
    dispatch({ type: 'ADD_OR_UPDATE_CONFIG', payload: response.data });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteConfig = async (dispatch: AppDispatch, id: number) => {
  try {
    await axios.delete(API_ENDPOINTS.CONFIG(id));
    dispatch({ type: 'DELETE_CONFIG', payload: id });
  } catch (error) {
    throw error;
  }
};

export const executeDump = async (dispatch: AppDispatch, configId: number) => {
  try {
    const response = await axios.post(API_ENDPOINTS.DUMP(configId));
    dispatch({ type: 'ADD_OPERATION', payload: response.data });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const executeRestore = async (dispatch: AppDispatch, configId: number, filePath: string) => {
  try {
    const response = await axios.post(API_ENDPOINTS.RESTORE(configId), { file_path: filePath });
    dispatch({ type: 'ADD_OPERATION', payload: response.data });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const selectConfig = (dispatch: AppDispatch, id: number | null) => {
  dispatch({ type: 'SELECT_CONFIG', payload: id });
};
