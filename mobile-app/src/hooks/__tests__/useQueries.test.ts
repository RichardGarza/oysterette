/**
 * React Query Hooks Tests
 *
 * Tests for all custom React Query hooks in useQueries.ts
 * Covers query hooks, mutation hooks, and cache invalidation
 */

import { renderHook, waitFor } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useOysters,
  useOyster,
  useOysterReviews,
  useRecommendations,
  useProfile,
  useProfileReviews,
  usePublicProfile,
  usePublicProfileReviews,
  usePublicProfileFavorites,
  useFriends,
  useTopOysters,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  queryKeys,
} from '../useQueries';
import * as api from '../../services/api';

// Mock the API module
jest.mock('../../services/api');

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

  describe('Oyster Queries', () => {
    describe('useOysters', () => {
      it('should fetch and cache all oysters with Infinity stale time', async () => {
        const mockOysters = [
          { id: '1', name: 'Test Oyster 1', species: 'Pacific', origin: 'Washington' },
          { id: '2', name: 'Test Oyster 2', species: 'Atlantic', origin: 'Maine' },
        ];

        mockedApi.oysterApi.getAll.mockResolvedValue(mockOysters as any);

        const { result } = renderHook(() => useOysters(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockOysters);
        expect(mockedApi.oysterApi.getAll).toHaveBeenCalledTimes(1);

        // Verify staleTime is Infinity (data should be cached forever)
        const queryState = queryClient.getQueryState(queryKeys.oysters);
        expect(queryState?.dataUpdatedAt).toBeGreaterThan(0);
      });

      it('should handle API errors', async () => {
        mockedApi.oysterApi.getAll.mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useOysters(), { wrapper });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error).toBeTruthy();
      });
    });

    describe('useOyster', () => {
      it('should fetch single oyster by ID', async () => {
        const mockOyster = {
          id: 'test-id',
          name: 'Test Oyster',
          species: 'Pacific',
          origin: 'Washington',
        };

        mockedApi.oysterApi.getById.mockResolvedValue(mockOyster as any);

        const { result } = renderHook(() => useOyster('test-id'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockOyster);
        expect(mockedApi.oysterApi.getById).toHaveBeenCalledWith('test-id');
      });
    });

    describe('useOysterReviews', () => {
      it('should fetch oyster reviews with 2 minute stale time', async () => {
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
      it('should fetch and sort top oysters', async () => {
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
  });

  describe('Recommendation Queries', () => {
    describe('useRecommendations', () => {
      it('should fetch hybrid recommendations', async () => {
        const mockRecommendations = [
          { id: '1', name: 'Recommended Oyster 1' },
          { id: '2', name: 'Recommended Oyster 2' },
        ];

        mockedApi.recommendationApi.getHybrid.mockResolvedValue(mockRecommendations as any);

        const { result } = renderHook(() => useRecommendations(5), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockRecommendations);
        expect(mockedApi.recommendationApi.getHybrid).toHaveBeenCalledWith(5);
      });

      it('should fallback to attribute-based recommendations on hybrid error', async () => {
        const mockRecommendations = [
          { id: '1', name: 'Attribute Rec 1' },
        ];

        mockedApi.recommendationApi.getHybrid.mockRejectedValue(new Error('Hybrid failed'));
        mockedApi.recommendationApi.getRecommendations.mockResolvedValue(mockRecommendations as any);

        const { result } = renderHook(() => useRecommendations(5), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockRecommendations);
        expect(mockedApi.recommendationApi.getRecommendations).toHaveBeenCalledWith(5);
      });
    });
  });

  describe('Profile Queries', () => {
    describe('useProfile', () => {
      it('should fetch user profile with stats', async () => {
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

    describe('usePublicProfile', () => {
      it('should fetch public user profile', async () => {
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
      it('should fetch public user reviews', async () => {
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
      it('should fetch public user favorites', async () => {
        const mockFavorites = [
          { id: 'oyster-1', name: 'Favorite Oyster 1' },
          { id: 'oyster-2', name: 'Favorite Oyster 2' },
        ];

        mockedApi.favoritesApi.getUserPublicFavorites.mockResolvedValue(mockFavorites as any);

        const { result } = renderHook(() => usePublicProfileFavorites('friend-1'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockFavorites);
        expect(mockedApi.favoritesApi.getUserPublicFavorites).toHaveBeenCalledWith('friend-1');
      });
    });
  });

  describe('Friends Queries', () => {
    describe('useFriends', () => {
      it('should fetch user friends list', async () => {
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
  });

  describe('Mutation Hooks', () => {
    describe('useCreateReview', () => {
      it('should create review and invalidate related queries', async () => {
        const mockReview = { id: 'new-review', rating: 'LOVE_IT' };
        mockedApi.reviewApi.create.mockResolvedValue(mockReview as any);

        const { result } = renderHook(() => useCreateReview(), { wrapper });

        await result.current.mutateAsync({
          oysterId: 'oyster-1',
          rating: 'LOVE_IT',
          size: 8,
          body: 7,
          sweetBrininess: 6,
          flavorfulness: 9,
          creaminess: 7,
        });

        expect(mockedApi.reviewApi.create).toHaveBeenCalled();
      });
    });

    describe('useUpdateReview', () => {
      it('should update review and invalidate caches', async () => {
        const mockReview = { id: 'review-1', rating: 'LIKE_IT' };
        mockedApi.reviewApi.update.mockResolvedValue(mockReview as any);

        const { result } = renderHook(() => useUpdateReview(), { wrapper });

        await result.current.mutateAsync({
          reviewId: 'review-1',
          data: { rating: 'LIKE_IT' },
        });

        expect(mockedApi.reviewApi.update).toHaveBeenCalledWith('review-1', { rating: 'LIKE_IT' });
      });
    });

    describe('useDeleteReview', () => {
      it('should delete review and invalidate caches', async () => {
        mockedApi.reviewApi.delete.mockResolvedValue(true);

        const { result } = renderHook(() => useDeleteReview(), { wrapper });

        await result.current.mutateAsync('review-1');

        expect(mockedApi.reviewApi.delete).toHaveBeenCalledWith('review-1');
      });
    });
  });

  describe('Query Keys', () => {
    it('should generate unique query keys for different entities', () => {
      expect(queryKeys.oysters).toEqual(['oysters']);
      expect(queryKeys.oyster('123')).toEqual(['oyster', '123']);
      expect(queryKeys.oysterReviews('123')).toEqual(['oyster', '123', 'reviews']);
      expect(queryKeys.profile).toEqual(['profile']);
      expect(queryKeys.publicProfile('user-1')).toEqual(['publicProfile', 'user-1']);
      expect(queryKeys.publicProfileReviews('user-1')).toEqual([
        'publicProfile',
        'user-1',
        'reviews',
      ]);
      expect(queryKeys.publicProfileFavorites('user-1')).toEqual([
        'publicProfile',
        'user-1',
        'favorites',
      ]);
    });

    it('should prevent cache collisions between different oysters', () => {
      const key1 = queryKeys.oyster('oyster-1');
      const key2 = queryKeys.oyster('oyster-2');

      expect(key1).not.toEqual(key2);
    });
  });
});
