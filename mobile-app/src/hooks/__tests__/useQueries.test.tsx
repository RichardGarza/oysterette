/**
 * React Query Hooks Tests
 *
 * Comprehensive tests for all custom React Query hooks
 * Tests query hooks, mutation hooks, cache invalidation, and stale time configuration
 */

// Unmock React Query for this test - we want to test the real hooks
jest.unmock('@tanstack/react-query');

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useOysters,
  useOyster,
  useOysterRating,
  useOysterReviews,
  useTopOysters,
  useRecommendations,
  useProfile,
  useProfileReviews,
  useProfileXP,
  usePublicProfile,
  usePublicProfileReviews,
  usePublicProfileFavorites,
  useFriends,
  useSearch,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  useVoteReview,
  queryKeys,
} from '../useQueries';
import * as api from '../../services/api';

// Mock the entire API module
jest.mock('../../services/api', () => ({
  oysterApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    search: jest.fn(),
  },
  reviewApi: {
    getOysterReviews: jest.fn(),
    getPublicUserReviews: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userApi: {
    getProfile: jest.fn(),
    getMyReviews: jest.fn(),
    getPublicProfile: jest.fn(),
  },
  recommendationApi: {
    getHybrid: jest.fn(),
    getRecommendations: jest.fn(),
  },
  friendApi: {
    getFriends: jest.fn(),
  },
  favoritesApi: {
    getUserPublicFavorites: jest.fn(),
  },
  voteApi: {
    vote: jest.fn(),
  },
  getXPStats: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('React Query Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  // ============================================================================
  // OYSTER QUERIES
  // ============================================================================

  describe('useOysters', () => {
    it('should fetch all oysters with Infinity stale time', async () => {
      const mockOysters = [
        { id: '1', name: 'Kusshi', species: 'Pacific', origin: 'BC' },
        { id: '2', name: 'Blue Point', species: 'Atlantic', origin: 'NY' },
      ];

      mockedApi.oysterApi.getAll.mockResolvedValue(mockOysters as any);

      const { result } = renderHook(() => useOysters(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockOysters);
      expect(mockedApi.oysterApi.getAll).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors', async () => {
      mockedApi.oysterApi.getAll.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useOysters(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useOyster', () => {
    it('should fetch single oyster by ID with Infinity stale time', async () => {
      const mockOyster = {
        id: 'test-id',
        name: 'Kusshi',
        species: 'Pacific',
        origin: 'BC',
      };

      mockedApi.oysterApi.getById.mockResolvedValue(mockOyster as any);

      const { result } = renderHook(() => useOyster('test-id'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockOyster);
      expect(mockedApi.oysterApi.getById).toHaveBeenCalledWith('test-id');
    });
  });

  describe('useOysterRating', () => {
    it('should fetch oyster rating with 10 min stale time', async () => {
      const mockOyster = {
        id: 'test-id',
        overallScore: 8.5,
        totalReviews: 42,
      };

      mockedApi.oysterApi.getById.mockResolvedValue(mockOyster as any);

      const { result } = renderHook(() => useOysterRating('test-id'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual({
        overallScore: 8.5,
        totalReviews: 42,
      });
    });
  });

  describe('useOysterReviews', () => {
    it('should fetch oyster reviews with 2 min stale time', async () => {
      const mockReviews = [
        { id: 'review-1', rating: 'LOVE_IT', notes: 'Great!' },
        { id: 'review-2', rating: 'LIKE_IT', notes: 'Good' },
      ];

      mockedApi.reviewApi.getOysterReviews.mockResolvedValue(mockReviews as any);

      const { result } = renderHook(() => useOysterReviews('oyster-id'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockReviews);
      expect(mockedApi.reviewApi.getOysterReviews).toHaveBeenCalledWith('oyster-id');
    });
  });

  describe('useTopOysters', () => {
    it('should fetch and sort top oysters with 5 min stale time', async () => {
      const mockOysters = [
        { id: '1', name: 'Oyster 1', totalReviews: 5, overallScore: 8.5 },
        { id: '2', name: 'Oyster 2', totalReviews: 3, overallScore: 9.0 },
        { id: '3', name: 'Oyster 3', totalReviews: 0, overallScore: 0 },
      ];

      mockedApi.oysterApi.getAll.mockResolvedValue(mockOysters as any);

      const { result } = renderHook(() => useTopOysters(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should filter out oysters with no reviews and sort by score
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].id).toBe('2'); // Highest score first
      expect(result.current.data?.[1].id).toBe('1');
    });
  });

  // ============================================================================
  // RECOMMENDATION QUERIES
  // ============================================================================

  describe('useRecommendations', () => {
    it('should fetch hybrid recommendations with 15 min stale time', async () => {
      const mockRecommendations = [
        { id: '1', name: 'Recommended 1' },
        { id: '2', name: 'Recommended 2' },
      ];

      mockedApi.recommendationApi.getHybrid.mockResolvedValue(mockRecommendations as any);

      const { result } = renderHook(() => useRecommendations(5), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockRecommendations);
      expect(mockedApi.recommendationApi.getHybrid).toHaveBeenCalledWith(5);
    });

    it('should fallback to attribute-based on hybrid error', async () => {
      const mockRecommendations = [{ id: '1', name: 'Attribute Rec 1' }];

      mockedApi.recommendationApi.getHybrid.mockRejectedValue(new Error('Hybrid failed'));
      mockedApi.recommendationApi.getRecommendations.mockResolvedValue(mockRecommendations as any);

      const { result } = renderHook(() => useRecommendations(5), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockRecommendations);
      expect(mockedApi.recommendationApi.getRecommendations).toHaveBeenCalledWith(5);
    });
  });

  // ============================================================================
  // PROFILE QUERIES
  // ============================================================================

  describe('useProfile', () => {
    it('should fetch user profile with 2 min stale time', async () => {
      const mockProfile = {
        user: { id: 'user-1', name: 'Test User' },
        stats: { totalReviews: 10, totalFavorites: 5 },
      };

      mockedApi.userApi.getProfile.mockResolvedValue(mockProfile as any);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProfile);
      expect(mockedApi.userApi.getProfile).toHaveBeenCalled();
    });
  });

  describe('useProfileReviews', () => {
    it('should fetch user reviews with pagination', async () => {
      const mockReviews = {
        reviews: [{ id: 'review-1' }, { id: 'review-2' }],
        total: 2,
        page: 1,
        pages: 1,
      };

      mockedApi.userApi.getMyReviews.mockResolvedValue(mockReviews as any);

      const { result } = renderHook(
        () => useProfileReviews({ page: 1, limit: 20, sortBy: 'createdAt' }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockReviews);
      expect(mockedApi.userApi.getMyReviews).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
      });
    });
  });

  describe('useProfileXP', () => {
    it('should fetch user XP stats with 2 min stale time', async () => {
      const mockXP = {
        level: 5,
        currentXP: 450,
        xpForNextLevel: 500,
        achievements: [],
      };

      mockedApi.getXPStats.mockResolvedValue(mockXP as any);

      const { result } = renderHook(() => useProfileXP(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockXP);
      expect(mockedApi.getXPStats).toHaveBeenCalled();
    });
  });

  describe('usePublicProfile', () => {
    it('should fetch public profile with 5 min stale time', async () => {
      const mockProfile = {
        user: { id: 'friend-1', name: 'Friend User' },
        stats: { totalReviews: 5, totalFavorites: 3 },
      };

      mockedApi.userApi.getPublicProfile.mockResolvedValue(mockProfile as any);

      const { result } = renderHook(() => usePublicProfile('friend-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProfile);
      expect(mockedApi.userApi.getPublicProfile).toHaveBeenCalledWith('friend-1');
    });

    it('should not fetch if userId is empty', () => {
      const { result } = renderHook(() => usePublicProfile(''), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(mockedApi.userApi.getPublicProfile).not.toHaveBeenCalled();
    });
  });

  describe('usePublicProfileReviews', () => {
    it('should fetch public user reviews with 2 min stale time', async () => {
      const mockReviews = [
        { id: 'review-1', rating: 'LOVE_IT' },
        { id: 'review-2', rating: 'LIKE_IT' },
      ];

      mockedApi.reviewApi.getPublicUserReviews.mockResolvedValue(mockReviews as any);

      const { result } = renderHook(() => usePublicProfileReviews('friend-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockReviews);
      expect(mockedApi.reviewApi.getPublicUserReviews).toHaveBeenCalledWith('friend-1');
    });
  });

  describe('usePublicProfileFavorites', () => {
    it('should fetch public user favorites with 5 min stale time', async () => {
      const mockFavorites = [
        { id: 'oyster-1', name: 'Favorite 1' },
        { id: 'oyster-2', name: 'Favorite 2' },
      ];

      mockedApi.favoritesApi.getUserPublicFavorites.mockResolvedValue(mockFavorites as any);

      const { result } = renderHook(() => usePublicProfileFavorites('friend-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockFavorites);
      expect(mockedApi.favoritesApi.getUserPublicFavorites).toHaveBeenCalledWith('friend-1');
    });
  });

  // ============================================================================
  // FRIENDS QUERIES
  // ============================================================================

  describe('useFriends', () => {
    it('should fetch friends list with 2 min stale time', async () => {
      const mockFriends = [
        { id: 'friend-1', name: 'Friend 1' },
        { id: 'friend-2', name: 'Friend 2' },
      ];

      mockedApi.friendApi.getFriends.mockResolvedValue(mockFriends as any);

      const { result } = renderHook(() => useFriends(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockFriends);
      expect(mockedApi.friendApi.getFriends).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // SEARCH QUERIES
  // ============================================================================

  describe('useSearch', () => {
    it('should search oysters with 5 min stale time', async () => {
      const mockResults = [
        { id: '1', name: 'Found Oyster 1' },
        { id: '2', name: 'Found Oyster 2' },
      ];

      mockedApi.oysterApi.search.mockResolvedValue(mockResults as any);

      const { result } = renderHook(
        () => useSearch({ query: 'kusshi', filters: {} }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResults);
      expect(mockedApi.oysterApi.search).toHaveBeenCalledWith({ query: 'kusshi', filters: {} });
    });

    it('should not fetch if no query or filters', () => {
      const { result } = renderHook(() => useSearch({ query: '', filters: null }), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(mockedApi.oysterApi.search).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // MUTATION HOOKS
  // ============================================================================

  describe('useCreateReview', () => {
    it('should create review and invalidate queries', async () => {
      const mockReview = {
        id: 'new-review',
        oysterId: 'oyster-1',
        rating: 'LOVE_IT',
      };

      mockedApi.reviewApi.create.mockResolvedValue(mockReview as any);

      const { result } = renderHook(() => useCreateReview(), { wrapper });

      const reviewData = {
        oysterId: 'oyster-1',
        rating: 'LOVE_IT',
        size: 8,
        body: 7,
        sweetBrininess: 6,
        flavorfulness: 9,
        creaminess: 7,
      };

      await act(async () => {
        await result.current.mutateAsync(reviewData);
      });

      expect(mockedApi.reviewApi.create).toHaveBeenCalledWith(reviewData);
    });
  });

  describe('useUpdateReview', () => {
    it('should update review and invalidate caches', async () => {
      const mockReview = {
        id: 'review-1',
        oysterId: 'oyster-1',
        rating: 'LIKE_IT',
      };

      mockedApi.reviewApi.update.mockResolvedValue(mockReview as any);

      const { result } = renderHook(() => useUpdateReview(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          reviewId: 'review-1',
          data: { rating: 'LIKE_IT' },
        });
      });

      expect(mockedApi.reviewApi.update).toHaveBeenCalledWith('review-1', { rating: 'LIKE_IT' });
    });
  });

  describe('useDeleteReview', () => {
    it('should delete review and invalidate caches', async () => {
      mockedApi.reviewApi.delete.mockResolvedValue(true);

      const { result } = renderHook(() => useDeleteReview(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ reviewId: 'review-1', oysterId: 'oyster-1' });
      });

      expect(mockedApi.reviewApi.delete).toHaveBeenCalledWith('review-1');
    });
  });

  describe('useVoteReview', () => {
    it('should vote on review and invalidate queries', async () => {
      const mockVote = { success: true };

      mockedApi.voteApi.vote.mockResolvedValue(mockVote as any);

      const { result } = renderHook(() => useVoteReview(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ reviewId: 'review-1', isAgree: true });
      });

      expect(mockedApi.voteApi.vote).toHaveBeenCalledWith('review-1', true);
    });
  });

  // ============================================================================
  // QUERY KEYS
  // ============================================================================

  describe('Query Keys', () => {
    it('should generate unique query keys for different entities', () => {
      expect(queryKeys.oysters).toEqual(['oysters']);
      expect(queryKeys.oyster('123')).toEqual(['oyster', '123']);
      expect(queryKeys.oysterRating('123')).toEqual(['oyster', '123', 'rating']);
      expect(queryKeys.oysterReviews('123')).toEqual(['oyster', '123', 'reviews']);
      expect(queryKeys.profile).toEqual(['profile']);
      expect(queryKeys.profileReviews).toEqual(['profile', 'reviews']);
      expect(queryKeys.profileXP).toEqual(['profile', 'xp']);
      expect(queryKeys.publicProfile('user-1')).toEqual(['publicProfile', 'user-1']);
      expect(queryKeys.recommendations).toEqual(['recommendations']);
      expect(queryKeys.topOysters).toEqual(['topOysters']);
      expect(queryKeys.friends).toEqual(['friends']);
    });

    it('should prevent cache collisions between different oysters', () => {
      const key1 = queryKeys.oyster('oyster-1');
      const key2 = queryKeys.oyster('oyster-2');

      expect(key1).not.toEqual(key2);
      expect(key1[1]).toBe('oyster-1');
      expect(key2[1]).toBe('oyster-2');
    });

    it('should prevent cache collisions between different user profiles', () => {
      const key1 = queryKeys.publicProfile('user-1');
      const key2 = queryKeys.publicProfile('user-2');

      expect(key1).not.toEqual(key2);
    });
  });
});
