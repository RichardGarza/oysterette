/**
 * Temporary Reviews Storage Service
 *
 * Manages reviews that are pending user authentication.
 * Reviews are stored locally in AsyncStorage until the user
 * decides to either:
 * 1. Log in and link the review to their account
 * 2. Submit anonymously without logging in
 * 3. Discard the review
 *
 * Used by:
 * - AddReviewScreen: Store reviews when user is not logged in
 * - LoginScreen/RegisterScreen: Submit pending reviews after auth
 *
 * Storage Format:
 * {
 *   [reviewId]: {
 *     oysterId: string;
 *     oysterName: string;
 *     rating: ReviewRating;
 *     size: number;
 *     body: number;
 *     sweetBrininess: number;
 *     flavorfulness: number;
 *     creaminess: number;
 *     notes?: string;
 *     origin?: string;
 *     species?: string;
 *     photoUrls?: string[];
 *     createdAt: string;
 *   }
 * }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReviewRating } from '../types/Oyster';

const TEMP_REVIEWS_KEY = '@oysterette_temp_reviews';

export interface TempReview {
  id: string; // Temporary local ID
  oysterId: string;
  oysterName: string;
  rating: ReviewRating;
  size: number;
  body: number;
  sweetBrininess: number;
  flavorfulness: number;
  creaminess: number;
  notes?: string;
  origin?: string;
  species?: string;
  photoUrls?: string[];
  createdAt: string;
}

export const tempReviewsStorage = {
  /**
   * Store a review temporarily until user logs in
   */
  store: async (review: Omit<TempReview, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const reviews = await tempReviewsStorage.getAll();
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const tempReview: TempReview = {
        ...review,
        id: tempId,
        createdAt: new Date().toISOString(),
      };

      reviews[tempId] = tempReview;
      await AsyncStorage.setItem(TEMP_REVIEWS_KEY, JSON.stringify(reviews));

      console.log('📝 [TempReviews] Stored review:', tempId);
      return tempId;
    } catch (error) {
      console.error('❌ [TempReviews] Failed to store review:', error);
      throw error;
    }
  },

  /**
   * Get all temporary reviews
   */
  getAll: async (): Promise<Record<string, TempReview>> => {
    try {
      const data = await AsyncStorage.getItem(TEMP_REVIEWS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ [TempReviews] Failed to get reviews:', error);
      return {};
    }
  },

  /**
   * Get a single temporary review by ID
   */
  getById: async (id: string): Promise<TempReview | null> => {
    try {
      const reviews = await tempReviewsStorage.getAll();
      return reviews[id] || null;
    } catch (error) {
      console.error('❌ [TempReviews] Failed to get review:', error);
      return null;
    }
  },

  /**
   * Remove a temporary review (after successful submission or cancellation)
   */
  remove: async (id: string): Promise<void> => {
    try {
      const reviews = await tempReviewsStorage.getAll();
      delete reviews[id];
      await AsyncStorage.setItem(TEMP_REVIEWS_KEY, JSON.stringify(reviews));
      console.log('🗑️ [TempReviews] Removed review:', id);
    } catch (error) {
      console.error('❌ [TempReviews] Failed to remove review:', error);
      throw error;
    }
  },

  /**
   * Clear all temporary reviews (e.g., after batch submission)
   */
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(TEMP_REVIEWS_KEY);
      console.log('🗑️ [TempReviews] Cleared all reviews');
    } catch (error) {
      console.error('❌ [TempReviews] Failed to clear reviews:', error);
      throw error;
    }
  },

  /**
   * Get count of pending reviews
   */
  getCount: async (): Promise<number> => {
    try {
      const reviews = await tempReviewsStorage.getAll();
      return Object.keys(reviews).length;
    } catch (error) {
      console.error('❌ [TempReviews] Failed to get count:', error);
      return 0;
    }
  },
};
