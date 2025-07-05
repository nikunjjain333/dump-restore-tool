import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DatabaseProvider } from './context/DatabaseContext';

// Create a custom theme for testing
const theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    white: '#fff',
    black: '#000',
  },
  breakpoints: {
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
  },
  spacing: (factor: number) => `${0.25 * factor}rem`,
};

// Create a custom render function that includes all necessary providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  // Create a new QueryClient for each test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <DatabaseProvider>
          <Router>
            {children}
          </Router>
        </DatabaseProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Custom render method with all providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from RTL
// This allows us to import { render, screen } from '../../test-utils';
export * from '@testing-library/react';

// Override the render method
export { customRender as render };

// Helper function to wait for loading to complete
export const waitForLoadingToFinish = () =>
  new Promise<void>((resolve) => {
    // Wait for any pending promises to resolve
    setImmediate(() => {
      // Check if there are any loading indicators
      const loadingElements = document.querySelectorAll('[role="progressbar"]');
      if (loadingElements.length === 0) {
        resolve();
        return;
      }

      // If there are loading indicators, wait a bit and check again
      setTimeout(() => {
        resolve();
      }, 400);
    });
  });

// Helper function to mock the IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor() {}
  
  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}

// Mock the IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock the ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock the console.error to make test output cleaner
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress specific error messages in tests
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    // Ignore specific error messages
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('React does not recognize') ||
        args[0].includes('Invalid value for prop') ||
        args[0].includes('Unknown event handler property'))
    ) {
      return;
    }
    originalError(...args);
  });

  // Suppress specific warning messages in tests
  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    // Ignore specific warning messages
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return;
    }
    originalWarn(...args);
  });
});

afterAll(() => {
  // Restore original console methods
  jest.restoreAllMocks();
});

// Mock the useNavigate hook
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

export { mockNavigate };
