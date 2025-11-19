/**
 * Profile Cache Service
 *
 * Persistent storage for profile data using AsyncStorage to improve load times.
 * Caches profile info, stats, reviews, and XP data for offline-first experience.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Review } from '../types/Oyster';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  PROFILE_DATA: '@oysterette_profile_data',
  REVIEWS: '@oysterette_profile_reviews',
  XP_DATA: '@oysterette_profile_xp',
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface ProfileStats {
  totalReviews: number;
  totalFavorites: number;
  totalVotesGiven: number;
  totalVotesReceived: number;
  avgRatingGiven: number;
  credibilityScore: number;
  badgeLevel: 'Novice' | 'Trusted' | 'Expert';
  memberSince: string;
  reviewStreak: number;
  mostReviewedSpecies?: string;
  mostReviewedOrigin?: string;
}

interface ProfileData {
  user: User;
  stats: ProfileStats;
}

interface XPData {
  xp: number;
  level: number;
  xpToNextLevel: number;
  achievements: any[];
}

// ============================================================================
// STORAGE INTERFACE
// ============================================================================

export const profileCache = {
  /**
   * Save profile data to cache
   */
  async saveProfileData(data: ProfileData): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_DATA, JSON.stringify(data));
      if (__DEV__) {
        console.log('💾 [ProfileCache] Profile data saved');
      }
    } catch (error) {
      console.error('❌ [ProfileCache] Error saving profile data:', error);
    }
  },

  /**
   * Retrieve cached profile data
   */
  async getProfileData(): Promise<ProfileData | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_DATA);
      if (data) {
        if (__DEV__) {
          console.log('🔍 [ProfileCache] Profile data retrieved from cache');
        }
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('❌ [ProfileCache] Error getting profile data:', error);
      return null;
    }
  },

  /**
   * Save reviews to cache
   */
  async saveReviews(reviews: Review[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
      if (__DEV__) {
        console.log('💾 [ProfileCache] Reviews saved');
      }
    } catch (error) {
      console.error('❌ [ProfileCache] Error saving reviews:', error);
    }
  },

  /**
   * Retrieve cached reviews
   */
  async getReviews(): Promise<Review[] | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (data) {
        if (__DEV__) {
          console.log('🔍 [ProfileCache] Reviews retrieved from cache');
        }
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('❌ [ProfileCache] Error getting reviews:', error);
      return null;
    }
  },

  /**
   * Save XP data to cache
   */
  async saveXPData(data: XPData): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.XP_DATA, JSON.stringify(data));
      if (__DEV__) {
        console.log('💾 [ProfileCache] XP data saved');
      }
    } catch (error) {
      console.error('❌ [ProfileCache] Error saving XP data:', error);
    }
  },

  /**
   * Retrieve cached XP data
   */
  async getXPData(): Promise<XPData | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.XP_DATA);
      if (data) {
        if (__DEV__) {
          console.log('🔍 [ProfileCache] XP data retrieved from cache');
        }
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('❌ [ProfileCache] Error getting XP data:', error);
      return null;
    }
  },

  /**
   * Clear all cached profile data
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PROFILE_DATA,
        STORAGE_KEYS.REVIEWS,
        STORAGE_KEYS.XP_DATA,
      ]);
      if (__DEV__) {
        console.log('🗑️ [ProfileCache] All profile cache cleared');
      }
    } catch (error) {
      console.error('❌ [ProfileCache] Error clearing cache:', error);
    }
  },
};
