import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

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
        getUser: vi.fn(() => Promise.resolve({
          data: { user: { id: 'test-user', email: 'test@example.com', user_metadata: {} } },
          error: null,
        })),
        updateUser: vi.fn(() => Promise.resolve({
          data: { user: { id: 'test-user', email: 'test@example.com', user_metadata: {} } },
          error: null,
        })),
        signOut: vi.fn(),
      },
    },
  };
});

