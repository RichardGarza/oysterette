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
  async syncWithBackend(): Promise<void> {
    try {
      const token = await authStorage.getToken();
      if (!token) {
        console.log('Not logged in, skipping favorites sync');
        return;
      }

      // Get local favorites
      const localFavorites = await this.getFavorites();
      console.log(`📥 Syncing ${localFavorites.length} local favorites with backend...`);

      // Send local favorites to backend for syncing
      await favoritesApi.syncFavorites(localFavorites);

      // Get updated favorites from backend
      const backendFavorites = await favoritesApi.getFavorites();
      console.log(`📤 Received ${backendFavorites.length} favorites from backend`);

      // Update local storage with merged favorites
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(backendFavorites));
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
