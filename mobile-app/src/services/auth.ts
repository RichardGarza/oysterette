/**
 * Auth Storage Service
 *
 * Persistent storage for JWT token and user data using AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/Oyster';
import { profileCache } from './profileCache';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  TOKEN: '@oysterette_token',
  USER: '@oysterette_user',
  BADGE_LEVEL: '@oysterette_badge_level',
} as const;

// ============================================================================
// STORAGE INTERFACE
// ============================================================================

export const authStorage = {
  /**
   * Save JWT authentication token
   */
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
      if (__DEV__) {
        console.log('💾 [AuthStorage] Token saved:', token.substring(0, 20) + '...');
      }
    } catch (error) {
      console.error('❌ [AuthStorage] Error saving token:', error);
      throw error;
    }
  },

  /**
   * Retrieve JWT authentication token
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (__DEV__) {
        console.log('🔍 [AuthStorage] Token retrieved:', token ? token.substring(0, 20) + '...' : 'NULL');
      }
      return token;
    } catch (error) {
      console.error('❌ [AuthStorage] Error getting token:', error);
      return null;
    }
  },

  /**
   * Remove JWT authentication token
   */
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      if (__DEV__) {
        console.log('🗑️ [AuthStorage] Token removed');
      }
    } catch (error) {
      console.error('❌ [AuthStorage] Error removing token:', error);
    }
  },

  /**
   * Save user data
   */
  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      if (__DEV__) {
        console.log('💾 [AuthStorage] User saved:', user.email);
      }
    } catch (error) {
      console.error('❌ [AuthStorage] Error saving user:', error);
      throw error;
    }
  },

  /**
   * Retrieve user data
   */
  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (!userData) {
        return null;
      }
      const user = JSON.parse(userData) as User;
      if (__DEV__) {
        console.log('🔍 [AuthStorage] User retrieved:', user.email);
      }
      return user;
    } catch (error) {
      console.error('❌ [AuthStorage] Error getting user:', error);
      return null;
    }
  },

  /**
   * Remove user data
   */
  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      if (__DEV__) {
        console.log('🗑️ [AuthStorage] User removed');
      }
    } catch (error) {
      console.error('❌ [AuthStorage] Error removing user:', error);
    }
  },

  /**
   * Clear all authentication data
   * Called on logout or 401 unauthorized
   */
  async clearAuth(): Promise<void> {
    await Promise.all([
      this.removeToken(),
      this.removeUser(),
      AsyncStorage.removeItem(STORAGE_KEYS.BADGE_LEVEL),
      profileCache.clearCache(), // Also clear profile cache on logout
    ]);
    if (__DEV__) {
      console.log('🧹 [AuthStorage] Auth and profile cache cleared');
    }
  },

  /**
   * Save badge level
   */
  async saveBadgeLevel(badgeLevel: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BADGE_LEVEL, badgeLevel);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [AuthStorage] Error saving badge level:', error);
      }
    }
  },

  /**
   * Get badge level
   */
  async getBadgeLevel(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.BADGE_LEVEL);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [AuthStorage] Error getting badge level:', error);
      }
      return null;
    }
  },
};
