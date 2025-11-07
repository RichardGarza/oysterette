/**
 * Favorites Storage Service
 *
 * Local favorites management with backend synchronization.
 *
 * Features:
 * - Stores favorite oyster IDs locally (AsyncStorage)
 * - Works offline (immediate local updates)
 * - Syncs with backend when logged in
 * - Merges local and server favorites on login
 * - Cross-device favorites synchronization
 * - Graceful fallback if sync fails
 *
 * Storage Key:
 * - @oysterette_favorites: JSON array of oyster UUID strings
 *
 * Core Functions:
 * - getFavorites: Returns array of oyster IDs
 * - addFavorite: Adds ID to local list
 * - removeFavorite: Removes ID from local list
 * - toggleFavorite: Adds or removes, syncs with backend if logged in
 * - isFavorite: Checks if oyster is in favorites
 * - clearFavorites: Removes all favorites
 *
 * Synchronization:
 * - syncWithBackend: Two-way sync (called on login/register)
 *   1. Sends local favorites to backend via POST /api/favorites/sync
 *   2. Backend calculates diff and merges
 *   3. Receives merged list from backend
 *   4. Updates local storage with merged list
 * - loadFromBackend: Fetches and merges (alternative to sync)
 *   1. Gets backend favorites via GET /api/favorites
 *   2. Merges with local favorites (union)
 *   3. Saves merged list locally
 *   4. Syncs merged list back if new ones added
 *
 * Toggle Flow (with sync):
 * 1. Updates local storage immediately (optimistic)
 * 2. Checks if user is logged in (authStorage.getToken())
 * 3. If logged in: Calls favoritesApi.addFavorite() or removeFavorite()
 * 4. If sync fails: Logs error but keeps local change
 * 5. Returns new favorite state (boolean)
 * 6. Triggers haptic feedback in UI
 *
 * Offline Support:
 * - All operations work without network
 * - Local changes persist in AsyncStorage
 * - Sync happens automatically on next login
 * - No data loss from offline favoriting
 *
 * Cross-Device Sync:
 * - Device A: Favorites stored locally and synced to backend
 * - Device B: Login triggers syncWithBackend()
 * - Device B: Receives Device A's favorites
 * - Device B: Merges with local favorites
 * - Backend: Now has favorites from both devices
 *
 * Error Handling:
 * - Sync errors logged but not thrown
 * - Local storage errors return empty array
 * - Backend sync failures don't break app
 * - "Not logged in" silently skips sync
 *
 * Logging:
 * - 📥 Syncing X local favorites with backend
 * - 📤 Received X favorites from backend
 * - ✅ Favorites synced successfully
 * - ❌ Errors with details
 *
 * Used By:
 * - OysterListScreen: Displays favorite hearts
 * - OysterDetailScreen: Toggles favorite status
 * - HomeScreen: Calls syncWithBackend on app start
 * - LoginScreen: Calls syncWithBackend after successful login
 * - RegisterScreen: Calls syncWithBackend after registration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { favoritesApi } from './api';
import { authStorage } from './auth';

const FAVORITES_KEY = '@oysterette_favorites';

export const favoritesStorage = {
  // Get all favorite oyster IDs
  async getFavorites(): Promise<string[]> {
    try {
      const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  },

  // Add oyster to favorites
  async addFavorite(oysterId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      if (!favorites.includes(oysterId)) {
        favorites.push(oysterId);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  },

  // Remove oyster from favorites
  async removeFavorite(oysterId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const updated = favorites.filter(id => id !== oysterId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  },

  // Toggle favorite status
  async toggleFavorite(oysterId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const isFavorite = favorites.includes(oysterId);

      if (isFavorite) {
        await this.removeFavorite(oysterId);
        // Sync with backend if user is logged in
        const token = await authStorage.getToken();
        if (token) {
          try {
            await favoritesApi.removeFavorite(oysterId);
          } catch (error) {
            console.log('Could not sync favorite removal with backend:', error);
          }
        }
        return false;
      } else {
        await this.addFavorite(oysterId);
        // Sync with backend if user is logged in
        const token = await authStorage.getToken();
        if (token) {
          try {
            await favoritesApi.addFavorite(oysterId);
          } catch (error) {
            console.log('Could not sync favorite addition with backend:', error);
          }
        }
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  },

  // Check if oyster is favorited
  async isFavorite(oysterId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.includes(oysterId);
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  },

  // Clear all favorites
  async clearFavorites(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FAVORITES_KEY);
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  },

  // Sync favorites with backend (call on login)
  // IMPORTANT: On login, we LOAD from backend first (backend is source of truth)
  // Then we MERGE with local favorites and sync back
  async syncWithBackend(): Promise<void> {
    try {
      const token = await authStorage.getToken();
      if (!token) {
        console.log('Not logged in, skipping favorites sync');
        return;
      }

      // Get backend favorites FIRST (backend is source of truth after login)
      const backendFavorites = await favoritesApi.getFavorites();
      console.log(`📤 Received ${backendFavorites.length} favorites from backend`);

      // Get local favorites
      const localFavorites = await this.getFavorites();
      console.log(`📱 Found ${localFavorites.length} local favorites`);

      // Merge: Union of backend and local (never delete, only add)
      const merged = Array.from(new Set([...backendFavorites, ...localFavorites]));
      console.log(`🔄 Merged to ${merged.length} total favorites`);

      // Update local storage with merged favorites
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(merged));

      // If we have new favorites from local, sync them back to backend
      if (merged.length > backendFavorites.length) {
        console.log(`📥 Syncing ${merged.length - backendFavorites.length} new favorites to backend...`);
        await favoritesApi.syncFavorites(merged);
      }

      console.log('✅ Favorites synced successfully');
    } catch (error) {
      console.error('Error syncing favorites with backend:', error);
      // Don't throw - sync is optional
    }
  },

  // Load favorites from backend (call on login)
  async loadFromBackend(): Promise<void> {
    try {
      const token = await authStorage.getToken();
      if (!token) {
        console.log('Not logged in, skipping favorites load');
        return;
      }

      const backendFavorites = await favoritesApi.getFavorites();
      console.log(`📥 Loaded ${backendFavorites.length} favorites from backend`);

      // Merge with local favorites (union)
      const localFavorites = await this.getFavorites();
      const merged = Array.from(new Set([...localFavorites, ...backendFavorites]));

      // Save merged list locally
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(merged));

      // Sync back to server if we merged new ones
      if (merged.length > backendFavorites.length) {
        await favoritesApi.syncFavorites(merged);
        console.log('✅ Synced merged favorites back to backend');
      }
    } catch (error) {
      console.error('Error loading favorites from backend:', error);
      // Don't throw - sync is optional
    }
  },
};
