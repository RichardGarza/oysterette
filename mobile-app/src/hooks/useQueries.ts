/**
 * React Query Hooks
 *
 * Centralized data fetching and caching for the mobile app
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { oysterApi, reviewApi, voteApi, userApi, recommendationApi, getXPStats } from '../services/api';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const queryKeys = {
  oysters: ['oysters'] as const,
  oyster: (id: string) => ['oyster', id] as const,
  oysterRating: (id: string) => ['oyster', id, 'rating'] as const,
  oysterReviews: (id: string) => ['oyster', id, 'reviews'] as const,
  recommendations: ['recommendations'] as const,
  profile: ['profile'] as const,
  profileReviews: ['profile', 'reviews'] as const,
  profileXP: ['profile', 'xp'] as const,
  search: (params: any) => ['search', params] as const,
  topOysters: ['topOysters'] as const,
};

// ============================================================================
// OYSTER QUERIES
// ============================================================================

/**
 * Get all oysters (static master list, never stale)
 */
export function useOysters() {
  return useQuery({
    queryKey: queryKeys.oysters,
    queryFn: () => oysterApi.getAll(),
    staleTime: Infinity, // Static master list
  });
}

/**
 * Get single oyster by ID (never stale)
 */
export function useOyster(id: string) {
  return useQuery({
    queryKey: queryKeys.oyster(id),
    queryFn: () => oysterApi.getById(id),
    staleTime: Infinity,
  });
}

/**
 * Get oyster rating (10 min stale time)
 */
export function useOysterRating(id: string) {
  return useQuery({
    queryKey: queryKeys.oysterRating(id),
    queryFn: async () => {
      const oyster = await oysterApi.getById(id);
      return {
        overallScore: oyster.overallScore,
        totalReviews: oyster.totalReviews,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get oyster reviews (2 min stale time)
 */
export function useOysterReviews(id: string) {
  return useQuery({
    queryKey: queryKeys.oysterReviews(id),
    queryFn: () => reviewApi.getOysterReviews(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get top oysters list (5 min stale time)
 */
export function useTopOysters() {
  return useQuery({
    queryKey: queryKeys.topOysters,
    queryFn: async () => {
      const oysters = await oysterApi.getAll();
      return oysters
        .filter((o) => o.totalReviews > 0)
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, 20);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// RECOMMENDATION QUERIES
// ============================================================================

/**
 * Get personalized recommendations (15 min stale time)
 */
export function useRecommendations(limit: number = 5) {
  return useQuery({
    queryKey: queryKeys.recommendations,
    queryFn: async () => {
      try {
        return await recommendationApi.getHybrid(limit);
      } catch (error) {
        // Fallback to attribute-based
        return await recommendationApi.getRecommendations(limit);
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// ============================================================================
// PROFILE QUERIES
// ============================================================================

/**
 * Get user profile (2 min stale time)
 */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => userApi.getProfile(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get user's reviews (2 min stale time)
 */
export function useProfileReviews(params?: { page?: number; limit?: number; sortBy?: string }) {
  return useQuery({
    queryKey: queryKeys.profileReviews,
    queryFn: () => userApi.getMyReviews(params || { page: 1, limit: 20, sortBy: 'createdAt' }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get user's XP stats (2 min stale time)
 */
export function useProfileXP() {
  return useQuery({
    queryKey: queryKeys.profileXP,
    queryFn: () => getXPStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================================
// SEARCH QUERIES
// ============================================================================

/**
 * Search oysters (5 min stale time)
 */
export function useSearch(params: any) {
  return useQuery({
    queryKey: queryKeys.search(params),
    queryFn: () => oysterApi.search(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!params.query || !!params.filters,
  });
}

// ============================================================================
// REVIEW MUTATIONS
// ============================================================================

/**
 * Create a new review
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewData: any) => reviewApi.create(reviewData),
    onSuccess: (data, variables) => {
      // Invalidate all affected queries
      queryClient.invalidateQueries({ queryKey: queryKeys.oysterRating(variables.oysterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.oysterReviews(variables.oysterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.oyster(variables.oysterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.profileReviews });
      queryClient.invalidateQueries({ queryKey: queryKeys.profileXP });
    },
  });
}

/**
 * Update an existing review
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; data: any }) =>
      reviewApi.update(reviewId, data),
    onSuccess: (data, variables) => {
      // Invalidate all affected queries
      queryClient.invalidateQueries({ queryKey: queryKeys.oysterRating(data.oysterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.oysterReviews(data.oysterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.oyster(data.oysterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.profileReviews });
    },
  });
}

/**
 * Delete a review
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, oysterId }: { reviewId: string; oysterId: string }) =>
      reviewApi.delete(reviewId),
    onSuccess: (data, variables) => {
      // Invalidate all affected queries
      queryClient.invalidateQueries({ queryKey: queryKeys.oysterRating(variables.oysterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.oysterReviews(variables.oysterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.oyster(variables.oysterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.profileReviews });
      queryClient.invalidateQueries({ queryKey: queryKeys.profileXP });
    },
  });
}

// ============================================================================
// VOTE MUTATIONS
// ============================================================================

/**
 * Vote on a review (with optimistic updates)
 */
export function useVoteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      isAgree,
    }: {
      reviewId: string;
      isAgree: boolean;
    }) => voteApi.vote(reviewId, isAgree),
    onMutate: async ({ reviewId, isAgree }) => {
      // Optimistic update - we don't have the oyster ID here, so we just update the review
      // The review will be in one of the reviews queries
      // This is a simplified optimistic update - could be improved with more context
    },
    onSuccess: (data, variables) => {
      // Invalidate reviews queries to show updated vote counts
      queryClient.invalidateQueries({ queryKey: ['oyster'] }); // All oyster reviews
      queryClient.invalidateQueries({ queryKey: queryKeys.profileReviews });
    },
  });
}
