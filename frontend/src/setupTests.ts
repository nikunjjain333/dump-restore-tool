// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill for TextEncoder and TextDecoder
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
import { configure } from '@testing-library/react';

// Mock window.matchMedia
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

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Configure test-id attribute for testing library
configure({ testIdAttribute: 'data-testid' });

// Mock localStorage
interface StorageMock {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: any) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: any) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  } as StorageMock;
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: any) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  } as StorageMock;
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock URL.createObjectURL and URL.revokeObjectURL
window.URL.createObjectURL = jest.fn();
window.URL.revokeObjectURL = jest.fn();

// Type definition for NotificationAction
interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Mock the Notification API
class MockNotification implements Notification {
  static permission: NotificationPermission = 'granted';
  static requestPermission = jest.fn(() => Promise.resolve('granted'));
  static readonly maxActions: number = 0;
  
  // Notification interface implementation
  readonly title: string;
  readonly dir: NotificationDirection = 'auto';
  readonly lang: string = '';
  readonly body: string = '';
  readonly tag: string = '';
  readonly icon: string = '';
  readonly badge: string = '';
  readonly image: string = '';
  readonly timestamp: number = Date.now();
  readonly renotify: boolean = false;
  readonly silent: boolean = false;
  readonly requireInteraction: boolean = false;
  readonly data: any = null;
  readonly actions: NotificationAction[] = [];
  readonly vibrate: number[] = [];
  
  // Event handlers
  onclick: ((this: Notification, ev: Event) => any) | null = null;
  onclose: ((this: Notification, ev: Event) => any) | null = null;
  onerror: ((this: Notification, ev: Event) => any) | null = null;
  onshow: ((this: Notification, ev: Event) => any) | null = null;
  
  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    if (options) {
      Object.assign(this, options);
    }
  }
  
  // Required methods
  close = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
}

// @ts-ignore - We're intentionally mocking the Notification API
window.Notification = MockNotification;

// Mock the requestAnimationFrame API
window.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

window.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock the navigator.clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
    readText: jest.fn(),
  },
  writable: true,
});

// Mock browser APIs
window.alert = jest.fn();
window.confirm = jest.fn().mockReturnValue(true);
window.prompt = jest.fn().mockReturnValue('test');
window.open = jest.fn();

// Mock ResizeObserver
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = window.ResizeObserver || ResizeObserverStub;

// Mock IntersectionObserver
class IntersectionObserverStub implements IntersectionObserver {
  readonly root: Element | Document | null = null;
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

window.IntersectionObserver = IntersectionObserverStub;

// Mock fetch
global.fetch = jest.fn();

// Add a test utility for checking if an element is visible
const isElementVisible = (element: HTMLElement): boolean => {
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
};

// Add custom matchers
expect.extend({
  toBeVisible(element: HTMLElement) {
    const isVisible = isElementVisible(element);
    return {
      pass: isVisible,
      message: () => `Expected element ${isVisible ? 'not ' : ''}to be visible`,
    };
  },
  toHaveTextContent(element: HTMLElement, text: string) {
    const hasText = element.textContent?.includes(text) || false;
    return {
      pass: hasText,
      message: () => 
        `Expected element ${hasText ? 'not ' : ''}to have text content: ${text}\n` +
        `Actual content: ${element.textContent}`,
    };
  },
});

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
});

afterEach(() => {
  // Restore the original console methods
  global.console = originalConsole;
});
