/**
 * Temporary Reviews Storage Service
 *
 * Manages reviews pending user authentication.
 * Reviews are stored locally until user logs in or discards them.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReviewRating } from '../types/Oyster';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = '@oysterette_temp_reviews';

// ============================================================================
// TYPES
// ============================================================================

export interface TempReview {
  readonly id: string; // Temporary local ID
  readonly oysterId: string;
  readonly oysterName: string;
  readonly rating: ReviewRating;
  readonly size: number;
  readonly body: number;
  readonly sweetBrininess: number;
  readonly flavorfulness: number;
  readonly creaminess: number;
  readonly notes?: string;
  readonly origin?: string;
  readonly species?: string;
  readonly photoUrls?: string[];
  readonly createdAt: string;
}

// ============================================================================
// STORAGE INTERFACE
// ============================================================================

export const tempReviewsStorage = {
  /**
   * Store a review temporarily until user logs in
   */
  async store(review: Omit<TempReview, 'id' | 'createdAt'>): Promise<string> {
    try {
      const reviews = await this.getAll();
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const tempReview: TempReview = {
        ...review,
        id: tempId,
        createdAt: new Date().toISOString(),
      };

      reviews[tempId] = tempReview;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));

      if (__DEV__) {
        console.log('📝 [TempReviews] Stored review:', tempId);
      }
      return tempId;
    } catch (error) {
      console.error('❌ [TempReviews] Failed to store review:', error);
      throw error;
    }
  },

  /**
   * Get all temporary reviews
   */
  async getAll(): Promise<Record<string, TempReview>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ [TempReviews] Failed to get reviews:', error);
      return {};
    }
  },

  /**
   * Get a single temporary review by ID
   */
  async getById(id: string): Promise<TempReview | null> {
    try {
      const reviews = await this.getAll();
      return reviews[id] || null;
    } catch (error) {
      console.error('❌ [TempReviews] Failed to get review:', error);
      return null;
    }
  },

  /**
   * Remove a temporary review (after successful submission or cancellation)
   */
  async remove(id: string): Promise<void> {
    try {
      const reviews = await this.getAll();
      delete reviews[id];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
      if (__DEV__) {
        console.log('🗑️ [TempReviews] Removed review:', id);
      }
    } catch (error) {
      console.error('❌ [TempReviews] Failed to remove review:', error);
      throw error;
    }
  },

  /**
   * Clear all temporary reviews (e.g., after batch submission)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      if (__DEV__) {
        console.log('🗑️ [TempReviews] Cleared all reviews');
      }
    } catch (error) {
      console.error('❌ [TempReviews] Failed to clear reviews:', error);
      throw error;
    }
  },

  /**
   * Get count of pending reviews
   */
  async getCount(): Promise<number> {
    try {
      const reviews = await this.getAll();
      return Object.keys(reviews).length;
    } catch (error) {
      console.error('❌ [TempReviews] Failed to get count:', error);
      return 0;
    }
  },
};
