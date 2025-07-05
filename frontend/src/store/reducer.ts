import { AppState, DatabaseAction } from './types';

export const initialState: AppState = {
  configs: [],
  operations: [],
  loading: false,
  error: null,
  selectedConfigId: null,
};

export function databaseReducer(state: AppState, action: DatabaseAction): AppState {
  switch (action.type) {
    case 'FETCH_CONFIGS_REQUEST':
      return { ...state, loading: true, error: null };
      
    case 'FETCH_CONFIGS_SUCCESS':
      return { ...state, loading: false, configs: action.payload };
      
    case 'FETCH_CONFIGS_FAILURE':
      return { ...state, loading: false, error: action.payload };
      
    case 'FETCH_OPERATIONS_REQUEST':
      return { ...state, loading: true, error: null };
      
    case 'FETCH_OPERATIONS_SUCCESS':
      return { ...state, loading: false, operations: action.payload };
      
    case 'FETCH_OPERATIONS_FAILURE':
      return { ...state, loading: false, error: action.payload };
      
    case 'SELECT_CONFIG':
      return { ...state, selectedConfigId: action.payload };
      
    case 'ADD_OR_UPDATE_CONFIG': {
      const existingIndex = state.configs.findIndex(c => c.id === action.payload.id);
      if (existingIndex >= 0) {
        const newConfigs = [...state.configs];
        newConfigs[existingIndex] = action.payload;
        return { ...state, configs: newConfigs };
      }
      return { ...state, configs: [...state.configs, action.payload] };
    }
      
    case 'DELETE_CONFIG':
      return {
        ...state,
        configs: state.configs.filter(config => config.id !== action.payload),
        selectedConfigId: state.selectedConfigId === action.payload ? null : state.selectedConfigId,
      };
      
    case 'ADD_OPERATION':
      return {
        ...state,
        operations: [action.payload, ...state.operations],
      };
      
    case 'UPDATE_OPERATION': {
      const index = state.operations.findIndex(op => op.id === action.payload.id);
      if (index === -1) return state;
      
      const newOperations = [...state.operations];
      newOperations[index] = action.payload;
      return { ...state, operations: newOperations };
    }
      
    default:
      return state;
  }
}
