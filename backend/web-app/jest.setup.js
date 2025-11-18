import '@testing-library/jest-dom';

// Mock next/router for useRouter
jest.mock('next/router', () => require('next-router-mock'));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// MSW setup - only for browser/integration tests, skip in pure unit tests
// For unit tests, MSW is not needed; for integration, set up in test file
// if (typeof window !== 'undefined') {
//   const { worker } = require('../mocks/browser');
//   worker.start({
//     onUnhandledRequest: 'bypass',
//   });
// }
