/**
 * Favorites Storage Service
 *
 * Local favorites management with backend synchronization.
 * Works offline with optimistic updates and syncs when logged in.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { favoritesApi } from './api';
import { authStorage } from './auth';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = '@oysterette_favorites';

// ============================================================================
// STORAGE INTERFACE
// ============================================================================

export const favoritesStorage = {
  /**
   * Get all favorite oyster IDs
   */
  async getFavorites(): Promise<string[]> {
    try {
      const favorites = await AsyncStorage.getItem(STORAGE_KEY);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('❌ [Favorites] Error getting favorites:', error);
      return [];
    }
  },

  /**
   * Add oyster to favorites (local only)
   */
  async addFavorite(oysterId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      if (!favorites.includes(oysterId)) {
        favorites.push(oysterId);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('❌ [Favorites] Error adding favorite:', error);
    }
  },

  /**
   * Remove oyster from favorites (local only)
   */
  async removeFavorite(oysterId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const updated = favorites.filter((id) => id !== oysterId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('❌ [Favorites] Error removing favorite:', error);
    }
  },

  /**
   * Toggle favorite status with backend sync
   * @returns New favorite state
   */
  async toggleFavorite(oysterId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const isFavorite = favorites.includes(oysterId);

      // Update local storage optimistically
      if (isFavorite) {
        await this.removeFavorite(oysterId);
      } else {
        await this.addFavorite(oysterId);
      }

      // Sync with backend if logged in
      const token = await authStorage.getToken();
      if (token) {
        try {
          if (isFavorite) {
            await favoritesApi.removeFavorite(oysterId);
          } else {
            await favoritesApi.addFavorite(oysterId);
          }
        } catch (error) {
          console.log('⚠️ [Favorites] Could not sync with backend:', error);
        }
      }

      return !isFavorite;
    } catch (error) {
      console.error('❌ [Favorites] Error toggling favorite:', error);
      return false;
    }
  },

  /**
   * Check if oyster is favorited
   */
  async isFavorite(oysterId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.includes(oysterId);
    } catch (error) {
      console.error('❌ [Favorites] Error checking favorite:', error);
      return false;
    }
  },

  /**
   * Clear all favorites
   */
  async clearFavorites(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      if (__DEV__) {
        console.log('🗑️ [Favorites] Cleared all favorites');
      }
    } catch (error) {
      console.error('❌ [Favorites] Error clearing favorites:', error);
    }
  },

  /**
   * Sync favorites with backend (call on login)
   * Merges local and backend favorites, never deletes
   */
  async syncWithBackend(): Promise<void> {
    try {
      const token = await authStorage.getToken();
      if (!token) {
        if (__DEV__) {
          console.log('⚠️ [Favorites] Not logged in, skipping sync');
        }
        return;
      }

      // Fetch backend favorites (source of truth)
      const backendFavorites = await favoritesApi.getFavorites();
      const localFavorites = await this.getFavorites();

      if (__DEV__) {
        console.log(`📤 [Favorites] Backend: ${backendFavorites.length}, Local: ${localFavorites.length}`);
      }

      // Merge (union of both sets)
      const merged = Array.from(new Set([...backendFavorites, ...localFavorites]));

      // Update local storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

      // Sync new favorites back to backend
      if (merged.length > backendFavorites.length) {
        const newCount = merged.length - backendFavorites.length;
        if (__DEV__) {
          console.log(`📥 [Favorites] Syncing ${newCount} new favorites to backend`);
        }
        await favoritesApi.syncFavorites(merged);
      }

      if (__DEV__) {
        console.log(`✅ [Favorites] Sync complete: ${merged.length} total`);
      }
    } catch (error) {
      console.error('❌ [Favorites] Error syncing with backend:', error);
      // Don't throw - sync is optional
    }
  },

  /**
   * Load favorites from backend (alternative to syncWithBackend)
   * @deprecated Use syncWithBackend instead
   */
  async loadFromBackend(): Promise<void> {
    await this.syncWithBackend();
  },
};
