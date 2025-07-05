import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// Export mock API utilities
export * from './utils';

// Export mock data
export * from './data';
