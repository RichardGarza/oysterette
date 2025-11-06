import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@oysterette_token';
const USER_KEY = '@oysterette_user';

export const authStorage = {
  // Save auth token
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      console.log('💾 [AuthStorage] Token saved successfully:', token.substring(0, 20) + '...');
    } catch (error) {
      console.error('❌ [AuthStorage] Error saving token:', error);
    }
  },

  // Get auth token
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      console.log('🔍 [AuthStorage] Token retrieved:', token ? token.substring(0, 20) + '...' : 'NULL');
      return token;
    } catch (error) {
      console.error('❌ [AuthStorage] Error getting token:', error);
      return null;
    }
  },

  // Remove auth token
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  // Save user data
  async saveUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  // Get user data
  async getUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  // Remove user data
  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error removing user:', error);
    }
  },

  // Clear all auth data
  async clearAuth(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  },
};
