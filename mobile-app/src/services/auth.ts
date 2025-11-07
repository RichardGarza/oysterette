/**
 * Auth Storage Service
 *
 * Persistent storage for JWT token and user data using AsyncStorage.
 *
 * Features:
 * - Stores JWT token for API authentication
 * - Stores full user object for offline access
 * - Automatic logging for debugging
 * - Error handling with fallbacks
 * - Namespaced keys to avoid conflicts
 *
 * Storage Keys:
 * - @oysterette_token: JWT authentication token
 * - @oysterette_user: JSON stringified user object
 *
 * Token Management:
 * - saveToken: Saves JWT token, logs first 20 chars
 * - getToken: Retrieves token, returns null if not found
 * - removeToken: Deletes token from storage
 *
 * User Management:
 * - saveUser: Saves user object as JSON string
 * - getUser: Retrieves and parses user object
 * - removeUser: Deletes user from storage
 *
 * Auth Lifecycle:
 * 1. Login/Register: saveToken() + saveUser() called by authApi
 * 2. App Start: getToken() + getUser() called by HomeScreen
 * 3. Auto-Login: getToken() used by api interceptor for all requests
 * 4. Logout: clearAuth() called to remove both token and user
 * 5. 401 Error: clearAuth() called automatically by api interceptor
 *
 * User Object Fields (from backend):
 * - id: UUID string
 * - email: User's email address
 * - name: Display name
 * - profileVisibility: 'public' | 'friends' | 'private'
 * - showReviewHistory: boolean
 * - showFavorites: boolean
 * - showStatistics: boolean
 * - themePreference: 'light' | 'dark' | 'system'
 * - credibilityScore: number (voting reputation)
 * - createdAt: ISO date string
 *
 * clearAuth():
 * - Called on logout button press
 * - Called automatically on 401 unauthorized
 * - Removes both token and user data
 * - Ensures clean slate for re-login
 *
 * Error Handling:
 * - All errors caught and logged
 * - Never throws errors (returns null on failure)
 * - Graceful degradation for storage issues
 *
 * Logging:
 * - 💾 Token saved (first 20 chars shown)
 * - 🔍 Token retrieved (first 20 chars shown)
 * - ❌ Errors with full details
 *
 * Used By:
 * - authApi: Saves token and user after auth
 * - api interceptor: Gets token for Authorization header
 * - HomeScreen: Gets user for auth check and theme load
 * - SettingsScreen: Gets user for display
 * - ProfileScreen: Gets user for profile data
 * - All auth-requiring screens: Checks getToken() for auth state
 */

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
