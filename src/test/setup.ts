import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Suppress act() warnings from happy-dom (it doesn't fully support act())
// These warnings are harmless - the tests still work correctly
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    const fullMessage = args.map(arg => String(arg)).join(' ');
    if (
      message.includes('not configured to support act') ||
      message.includes('An update to') && message.includes('inside a test was not wrapped in act') ||
      fullMessage.includes('not configured to support act') ||
      fullMessage.includes('An update to') && fullMessage.includes('inside a test was not wrapped in act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
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

// Mock navigator.share
Object.defineProperty(navigator, 'share', {
  writable: true,
  value: undefined,
});

// Mock navigator.clipboard (configurable to allow @testing-library/user-event to override)
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  configurable: true,
  value: {
    writeText: async () => {
      // Mock implementation
    },
  },
});

// Mock Supabase auth
vi.mock('../utils/supabase/client', async () => {
  const actual = await vi.importActual('../utils/supabase/client');
  return {
    ...actual,
    supabase: {
      auth: {
        // Resolve asynchronously using setTimeout to allow React to properly batch state updates
        // This ensures state updates happen within React's expected lifecycle
        getSession: vi.fn(() => 
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                data: { session: null },
                error: null,
              });
            }, 0);
          })
        ),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        updateUser: vi.fn(() => Promise.resolve({
          data: { user: { id: 'test-user', email: 'test@example.com', user_metadata: {} } },
          error: null,
        })),
        signOut: vi.fn(),
      },
    },
  };
});

