// Setup file for Jest
// This file runs before each test file is executed
import '@testing-library/jest-dom';
import { resetApiMocks } from './src/mocks/api';

// Mock the window.matchMedia function used by various components
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

// Mock the window.scrollTo function
window.scrollTo = jest.fn();

// Mock the ResizeObserver API
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

// Mock the IntersectionObserver API
class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver = IntersectionObserver;

// Mock the fetch API
global.fetch = jest.fn();

// Mock axios
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() }
      },
      defaults: {
        headers: {
          common: {},
          get: {},
          post: {},
          put: {},
          delete: {},
          patch: {}
        }
      }
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    },
    defaults: {
      headers: {
        common: {},
        get: {},
        post: {},
        put: {},
        delete: {},
        patch: {}
      }
    }
  }
}));

// Mock the localStorage API
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the sessionStorage API
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock the URL.createObjectURL and URL.revokeObjectURL functions
window.URL.createObjectURL = jest.fn();
window.URL.revokeObjectURL = jest.fn();

// Mock the Notification API
window.Notification = {
  requestPermission: jest.fn(() => Promise.resolve('granted')),
  permission: 'granted',
};

// Mock the requestAnimationFrame API
window.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

window.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock the console methods
const originalConsole = { ...console };
const mockConsole = {
  ...console,
  error: jest.fn((...args) => {
    // Filter out specific error messages
    if (typeof args[0] === 'string' && (
      args[0].includes('React does not recognize') ||
      args[0].includes('Invalid value for prop') ||
      args[0].includes('Unknown event handler property')
    )) {
      return;
    }
    originalConsole.error(...args);
  }),
  warn: jest.fn((...args) => {
    // Filter out specific warning messages
    if (typeof args[0] === 'string' && 
        args[0].includes('componentWillReceiveProps has been renamed')) {
      return;
    }
    originalConsole.warn(...args);
  })
};

global.console = mockConsole;

// Mock browser APIs
window.alert = jest.fn();
window.confirm = jest.fn().mockReturnValue(true);
window.prompt = jest.fn().mockReturnValue('test');
window.open = jest.fn();

// Mock the navigator.clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
    readText: jest.fn(),
  },
  writable: true,
});

// Mock react-router-dom
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'test',
  }),
}));

export { mockNavigate };

// Setup and teardown
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset API mocks
  resetApiMocks();
});

afterEach(() => {
  // Restore the original console methods
  global.console = originalConsole;
});
