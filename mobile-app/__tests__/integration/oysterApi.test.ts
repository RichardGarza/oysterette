import 'react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ data: { data: [] } }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

describe('oysterApi Integration Tests', () => {
  it('api module loads successfully', () => {
    expect(() => {
      require('../../src/services/api');
    }).not.toThrow();
  });

  it('oysterApi is accessible', () => {
    const api = require('../../src/services/api');
    expect(api.oysterApi).toBeDefined();
    expect(typeof api.oysterApi).toBe('object');
  });

  it('reviewApi is accessible', () => {
    const api = require('../../src/services/api');
    expect(api.reviewApi).toBeDefined();
    expect(typeof api.reviewApi).toBe('object');
  });
});

export default {};
