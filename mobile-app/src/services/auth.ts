/**
 * Auth Storage Service
 *
 * JWT token lives in SecureStore (device keychain); non-sensitive user data
 * stays in AsyncStorage. Falls back to AsyncStorage on binaries that predate
 * the SecureStore native module (OTA-updated older builds).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types/Oyster';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  TOKEN: '@oysterette_token', // legacy AsyncStorage key, kept for migration/fallback
  USER: '@oysterette_user',
  BADGE_LEVEL: '@oysterette_badge_level',
} as const;

// SecureStore keys may only contain [A-Za-z0-9._-]
const SECURE_TOKEN_KEY = 'oysterette_token';

// ============================================================================
// STORAGE INTERFACE
// ============================================================================

export const authStorage = {
  /**
   * Save JWT authentication token
   */
  async saveToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token);
      // Drop any legacy plaintext copy
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      if (__DEV__) {
        console.log('💾 [AuthStorage] Token saved');
      }
    } catch {
      // SecureStore native module unavailable (older binary via OTA)
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
      } catch (error) {
        if (__DEV__) {
          console.error('❌ [AuthStorage] Error saving token:', error);
        }
        throw error;
      }
    }
  },

  /**
   * Retrieve JWT authentication token
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
      if (token) {
        return token;
      }
    } catch {
      // SecureStore unavailable — fall through to AsyncStorage
    }
    try {
      const legacyToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (legacyToken) {
        // Migrate existing sessions into the keychain
        try {
          await SecureStore.setItemAsync(SECURE_TOKEN_KEY, legacyToken);
          await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
        } catch {
          // Keep using AsyncStorage on binaries without SecureStore
        }
      }
      return legacyToken;
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [AuthStorage] Error getting token:', error);
      }
      return null;
    }
  },

  /**
   * Remove JWT authentication token
   */
  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
    } catch {
      // SecureStore unavailable — legacy key removal below still runs
    }
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      if (__DEV__) {
        console.log('🗑️ [AuthStorage] Token removed');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [AuthStorage] Error removing token:', error);
      }
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
    ]);
    if (__DEV__) {
      console.log('🧹 [AuthStorage] Auth cleared');
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
