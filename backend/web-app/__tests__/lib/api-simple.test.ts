/**
 * API Client Basic Structure Tests
 * Tests that API modules export the expected functions
 */

import * as api from '../../lib/api';

describe('API Client Structure', () => {
  it('should export authApi with required methods', () => {
    expect(api.authApi).toBeDefined();
    expect(typeof api.authApi.register).toBe('function');
    expect(typeof api.authApi.login).toBe('function');
    expect(typeof api.authApi.googleAuth).toBe('function');
    expect(typeof api.authApi.getProfile).toBe('function');
  });

  it('should export oysterApi with required methods', () => {
    expect(api.oysterApi).toBeDefined();
    expect(typeof api.oysterApi.getAll).toBe('function');
    expect(typeof api.oysterApi.getById).toBe('function');
    expect(typeof api.oysterApi.search).toBe('function');
  });

  it('should export reviewApi with required methods', () => {
    expect(api.reviewApi).toBeDefined();
    expect(typeof api.reviewApi.getOysterReviews).toBe('function');
  });

  it('should export favoriteApi with required methods', () => {
    expect(api.favoriteApi).toBeDefined();
    expect(typeof api.favoriteApi.add).toBe('function');
    expect(typeof api.favoriteApi.remove).toBe('function');
    expect(typeof api.favoriteApi.getAll).toBe('function');
  });

  it('should export userApi with required methods', () => {
    expect(api.userApi).toBeDefined();
    expect(typeof api.userApi.getPublicProfile).toBe('function');
  });
});
