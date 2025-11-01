import AsyncStorage from '@react-native-async-storage/async-storage';

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
        return false;
      } else {
        await this.addFavorite(oysterId);
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
};
