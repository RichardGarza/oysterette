/**
 * API Service
 *
 * Centralized HTTP client for all backend API communication.
 *
 * Features:
 * - Axios instance with automatic JWT token injection
 * - Environment-aware URL configuration (production/development)
 * - Request/response interceptors for auth and error handling
 * - Organized API namespaces: auth, oyster, review, vote, user, favorite
 * - 10-second timeout for all requests
 * - Auto-retry disabled (manual retry in UI)
 * - Extensive console logging for debugging
 *
 * API URL Configuration:
 * - Production (default): https://oysterette-production.up.railway.app/api
 * - iOS Simulator: http://localhost:3000/api
 * - Android Emulator: http://10.0.2.2:3000/api
 * - Physical Device: http://192.168.0.120:3000/api
 *
 * Request Interceptor:
 * - Loads JWT token from authStorage
 * - Creates Authorization header if token exists
 * - Critical fix: Ensures headers object exists before setting
 * - Logs token presence and request details
 *
 * Response Interceptor:
 * - Handles 401 Unauthorized responses
 * - Auto-clears auth storage on 401
 * - Forces user to re-login
 * - Prevents stale token issues
 *
 * API Namespaces:
 * 1. authApi: register, login, googleAuth
 * 2. oysterApi: getAll, getById, create, update (admin)
 * 3. reviewApi: getAll, create, update, delete, checkExisting
 * 4. voteApi: vote, removeVote, getUserVotes, getUserCredibility
 * 5. userApi: getProfile, getMyReviews, updateProfile, changePassword, deleteAccount, updatePrivacySettings
 * 6. favoriteApi: getAll, add, remove, sync
 *
 * Error Handling:
 * - All errors thrown with response data
 * - UI screens parse error.response.data.error
 * - Network errors (no response) shown as generic failures
 * - Validation errors include field-specific details
 *
 * Used By:
 * - All screens that interact with backend
 * - authStorage for auto-login
 * - favoritesStorage for sync
 */

import axios, { AxiosInstance, AxiosHeaders } from 'axios';
import { Platform } from 'react-native';
import {
  Oyster,
  Review,
  User,
  UserTopOyster,
  AuthResponse,
  ApiResponse,
  ReviewRating,
} from '../types/Oyster';
import { authStorage } from './auth';

// API URL Configuration
// Choose the appropriate URL for your testing environment:

// Production API (Railway)
const PRODUCTION_URL = 'https://oysterette-production.up.railway.app/api';

// Development URLs (for local testing)
const IOS_SIMULATOR_URL = 'http://localhost:3000/api';
const ANDROID_EMULATOR_URL = 'http://10.0.2.2:3000/api';
const PHYSICAL_DEVICE_URL = 'http://192.168.0.120:3000/api';

// Automatically select based on environment
const getApiUrl = (): string => {
  // Use production by default for all builds
  // To test locally, uncomment one of the lines below:
  // return IOS_SIMULATOR_URL;
  // return ANDROID_EMULATOR_URL;
  // return PHYSICAL_DEVICE_URL;

  return PRODUCTION_URL;
};

const API_URL = getApiUrl();

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await authStorage.getToken();
    console.log('🔑 [API Interceptor] Token from storage:', token ? `${token.substring(0, 20)}...` : 'NULL');
    console.log('🔑 [API Interceptor] Request URL:', config.url);
    console.log('🔑 [API Interceptor] Headers before:', JSON.stringify(config.headers));

    if (token) {
      // Ensure headers object exists (critical fix!)
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ [API Interceptor] Authorization header set');
      console.log('🔑 [API Interceptor] Headers after:', JSON.stringify(config.headers));
    } else {
      console.log('❌ [API Interceptor] No token available');
    }
    return config;
  },
  (error) => {
    console.error('❌ [API Interceptor] Request error:', error);
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await authStorage.clearAuth();
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  // Register new user
  register: async (email: string, name: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      email,
      name,
      password,
    });
    if (!response.data.data) throw new Error('Registration failed');

    // Save token and user
    await authStorage.saveToken(response.data.data.token);
    await authStorage.saveUser(response.data.data.user);

    return response.data.data;
  },

  // Login user
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    if (!response.data.data) throw new Error('Login failed');

    // Save token and user
    await authStorage.saveToken(response.data.data.token);
    await authStorage.saveUser(response.data.data.user);

    return response.data.data;
  },

  // Google OAuth login
  googleAuth: async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/google', {
      idToken,
    });
    if (!response.data.data) throw new Error('Google authentication failed');

    // Save token and user
    await authStorage.saveToken(response.data.data.token);
    await authStorage.saveUser(response.data.data.user);

    return response.data.data;
  },

  // Apple Sign In
  appleAuth: async (idToken: string, user?: any): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/apple', {
      idToken,
      user,
    });
    if (!response.data.data) throw new Error('Apple authentication failed');

    // Save token and user
    await authStorage.saveToken(response.data.data.token);
    await authStorage.saveUser(response.data.data.user);

    return response.data.data;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    if (!response.data.data) throw new Error('Failed to get profile');
    return response.data.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await authStorage.clearAuth();
  },
};

// Oyster API
export const oysterApi = {
  // Get all oysters with optional filtering and sorting
  getAll: async (params?: {
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    sweetness?: 'low' | 'high';
    size?: 'low' | 'high';
    body?: 'low' | 'high';
    flavorfulness?: 'low' | 'high';
    creaminess?: 'low' | 'high';
  }): Promise<Oyster[]> => {
    const response = await api.get<ApiResponse<Oyster[]>>('/oysters', { params });
    return response.data.data || [];
  },

  // Get single oyster by ID
  getById: async (id: string): Promise<Oyster | null> => {
    const response = await api.get<ApiResponse<Oyster>>(`/oysters/${id}`);
    return response.data.data || null;
  },

  // Search oysters
  search: async (query: string): Promise<Oyster[]> => {
    const response = await api.get<ApiResponse<Oyster[]>>('/oysters/search', {
      params: { query },
    });
    return response.data.data || [];
  },

  // Get personalized recommendations (requires auth)
  getRecommendations: async (limit?: number): Promise<Oyster[]> => {
    const response = await api.get<ApiResponse<Oyster[]>>('/recommendations', {
      params: { limit: limit || 10 },
    });
    return response.data.data || [];
  },

  // Create new oyster (requires auth)
  create: async (oyster: {
    name: string;
    species: string;
    origin: string;
    standoutNotes?: string;
    size?: number;
    body?: number;
    sweetBrininess?: number;
    flavorfulness?: number;
    creaminess?: number;
  }): Promise<Oyster | null> => {
    const response = await api.post<ApiResponse<Oyster>>('/oysters', oyster);
    return response.data.data || null;
  },

  // Update oyster (requires auth)
  update: async (id: string, oyster: Partial<Oyster>): Promise<Oyster | null> => {
    const response = await api.put<ApiResponse<Oyster>>(`/oysters/${id}`, oyster);
    return response.data.data || null;
  },

  // Delete oyster (requires auth)
  delete: async (id: string): Promise<boolean> => {
    const response = await api.delete<ApiResponse<{}>>(`/oysters/${id}`);
    return response.data.success;
  },
};

// Review API
export const reviewApi = {
  // Get reviews for an oyster
  getOysterReviews: async (oysterId: string): Promise<Review[]> => {
    const response = await api.get<ApiResponse<Review[]>>(`/reviews/oyster/${oysterId}`);
    return response.data.data || [];
  },

  // Get current user's reviews
  getUserReviews: async (): Promise<Review[]> => {
    const response = await api.get<ApiResponse<Review[]>>('/reviews/user');
    return response.data.data || [];
  },

  // Create a review
  create: async (review: {
    oysterId: string;
    rating: ReviewRating;
    size?: number;
    body?: number;
    sweetBrininess?: number;
    flavorfulness?: number;
    creaminess?: number;
    notes?: string;
    origin?: string;
    species?: string;
    photoUrls?: string[];
  }): Promise<Review | null> => {
    const response = await api.post<ApiResponse<Review>>('/reviews', review);
    return response.data.data || null;
  },

  // Update a review
  update: async (reviewId: string, review: Partial<Review>): Promise<Review | null> => {
    const response = await api.put<ApiResponse<Review>>(`/reviews/${reviewId}`, review);
    return response.data.data || null;
  },

  // Delete a review
  delete: async (reviewId: string): Promise<boolean> => {
    const response = await api.delete<ApiResponse<{}>>(`/reviews/${reviewId}`);
    return response.data.success;
  },

  // Check if user has already reviewed an oyster
  checkExisting: async (oysterId: string): Promise<Review | null> => {
    const response = await api.get<ApiResponse<Review | null>>(`/reviews/check/${oysterId}`);
    return response.data.data || null;
  },
};

// Vote API
export const voteApi = {
  // Vote on a review (agree/disagree)
  vote: async (reviewId: string, isAgree: boolean): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/reviews/${reviewId}/vote`, {
      isAgree,
    });
    return response.data;
  },

  // Remove vote from a review
  removeVote: async (reviewId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/reviews/${reviewId}/vote`);
    return response.data;
  },

  // Get user's votes for multiple reviews
  getUserVotes: async (reviewIds: string[]): Promise<Record<string, boolean | null>> => {
    const response = await api.get<{ votes: Record<string, boolean | null> }>(
      `/reviews/votes?reviewIds=${reviewIds.join(',')}`
    );
    return response.data.votes;
  },

  // Get user credibility info
  getUserCredibility: async (userId: string): Promise<{
    credibilityScore: number;
    totalAgrees: number;
    totalDisagrees: number;
    reviewCount: number;
    badge: { level: string; color: string; icon: string };
  }> => {
    const response = await api.get(`/users/${userId}/credibility`);
    return response.data;
  },
};

// User API
export const userApi = {
  // Search users
  searchUsers: async (query: string): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data.data || [];
  },


  // Get user's top oysters
  getTopOysters: async (): Promise<UserTopOyster[]> => {
    const response = await api.get<ApiResponse<UserTopOyster[]>>('/users/top-oysters');
    return response.data.data || [];
  },

  // Add oyster to top list
  addTopOyster: async (oysterId: string, rank?: number): Promise<UserTopOyster | null> => {
    const response = await api.post<ApiResponse<UserTopOyster>>('/users/top-oysters', {
      oysterId,
      rank,
    });
    return response.data.data || null;
  },

  // Remove oyster from top list
  removeTopOyster: async (oysterId: string): Promise<boolean> => {
    const response = await api.delete<ApiResponse<{}>>(`/users/top-oysters/${oysterId}`);
    return response.data.success;
  },

  // Update user preferences
  updatePreferences: async (preferences: any): Promise<User | null> => {
    const response = await api.put<ApiResponse<User>>('/users/preferences', { preferences });
    return response.data.data || null;
  },

  // Update user profile
  updateProfile: async (name?: string, email?: string, profilePhotoUrl?: string): Promise<User | null> => {
    const response = await api.put<ApiResponse<User>>('/users/profile', { name, email, profilePhotoUrl });
    return response.data.data || null;
  },

  // Get user profile with statistics
  getProfile: async (): Promise<{
    user: User;
    stats: {
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
    };
  }> => {
    const response = await api.get<ApiResponse<any>>('/users/profile');
    return response.data.data;
  },

  // Get user's review history with pagination
  getMyReviews: async (params?: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'rating';
  }): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    pages: number;
  }> => {
    const response = await api.get<ApiResponse<any>>('/users/me/reviews', { params });
    return response.data.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.put<ApiResponse<{ message: string }>>('/users/password', {
      currentPassword,
      newPassword,
    });
    return response.data.data!;
  },

  // Delete account
  deleteAccount: async (password?: string, confirmText?: string): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<{ message: string }>>('/users/account', {
      data: { password, confirmText },
    });
    return response.data.data!;
  },

  // Update privacy settings
  updatePrivacySettings: async (settings: {
    profileVisibility?: 'public' | 'friends' | 'private';
    showReviewHistory?: boolean;
    showFavorites?: boolean;
    showStatistics?: boolean;
  }): Promise<{
    id: string;
    profileVisibility: string;
    showReviewHistory: boolean;
    showFavorites: boolean;
    showStatistics: boolean;
  }> => {
    const response = await api.put<ApiResponse<any>>('/users/privacy', settings);
    return response.data.data;
  },

  // Set baseline flavor profile
  setFlavorProfile: async (profile: {
    size: number;
    body: number;
    sweetBrininess: number;
    flavorfulness: number;
    creaminess: number;
  }): Promise<{ message: string }> => {
    const response = await api.put<ApiResponse<{ message: string }>>('/users/flavor-profile', profile);
    return response.data.data!;
  },
};

// Favorites API
export const favoritesApi = {
  // Get user's favorite oyster IDs
  getFavorites: async (): Promise<string[]> => {
    const response = await api.get<{ favorites: string[] }>('/favorites');
    return response.data.favorites || [];
  },

  // Add oyster to favorites
  addFavorite: async (oysterId: string): Promise<void> => {
    await api.post(`/favorites/${oysterId}`);
  },

  // Remove oyster from favorites
  removeFavorite: async (oysterId: string): Promise<void> => {
    await api.delete(`/favorites/${oysterId}`);
  },

  // Sync favorites (send local favorites to server, get back merged list)
  syncFavorites: async (favorites: string[]): Promise<void> => {
    await api.post('/favorites/sync', { favorites });
  },
};

// Recommendation API
export const recommendationApi = {
  // Get personalized recommendations (attribute-based)
  getRecommendations: async (limit: number = 10): Promise<Oyster[]> => {
    const response = await api.get<ApiResponse<Oyster[]>>(`/recommendations?limit=${limit}`);
    return response.data.data || [];
  },

  // Get collaborative filtering recommendations
  getCollaborative: async (limit: number = 10): Promise<Oyster[]> => {
    const response = await api.get<ApiResponse<Oyster[]>>(`/recommendations/collaborative?limit=${limit}`);
    return response.data.data || [];
  },

  // Get hybrid recommendations (60% attribute + 40% collaborative)
  getHybrid: async (limit: number = 10): Promise<Oyster[]> => {
    const response = await api.get<ApiResponse<Oyster[]>>(`/recommendations/hybrid?limit=${limit}`);
    return response.data.data || [];
  },
};

// Upload API
export const uploadApi = {
  // Upload profile photo
  uploadProfilePhoto: async (uri: string): Promise<string> => {
    const formData = new FormData();
    formData.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    const response = await api.post<ApiResponse<{ url: string }>>(
      '/upload/image?folder=profiles',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.data?.url) {
      throw new Error('Upload failed - no URL returned');
    }

    return response.data.data.url;
  },

  // Upload review photo
  uploadReviewPhoto: async (uri: string): Promise<string> => {
    const formData = new FormData();
    formData.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'review.jpg',
    } as any);

    const response = await api.post<ApiResponse<{ url: string }>>(
      '/upload/image?folder=reviews',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.data?.url) {
      throw new Error('Upload failed - no URL returned');
    }

    return response.data.data.url;
  },
};

export const friendApi = {
  // Send friend request
  sendRequest: async (receiverId: string): Promise<any> => {
    const response = await api.post<ApiResponse<any>>('/friends/request', { receiverId });
    return response.data.data;
  },

  // Accept friend request
  acceptRequest: async (friendshipId: string): Promise<any> => {
    const response = await api.put<ApiResponse<any>>(`/friends/accept/${friendshipId}`);
    return response.data.data;
  },

  // Reject friend request
  rejectRequest: async (friendshipId: string): Promise<void> => {
    await api.put<ApiResponse<any>>(`/friends/reject/${friendshipId}`);
  },

  // Get friends list
  getFriends: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/friends');
    return response.data.data || [];
  },

  // Get pending requests (sent and received)
  getPendingRequests: async (): Promise<{ sent: any[]; received: any[] }> => {
    const response = await api.get<ApiResponse<{ sent: any[]; received: any[] }>>('/friends/pending');
    return response.data.data || { sent: [], received: [] };
  },

  // Remove friend
  removeFriend: async (friendshipId: string): Promise<void> => {
    await api.delete<ApiResponse<any>>(`/friends/${friendshipId}`);
  },

  // Get friend activity feed
  getActivity: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/friends/activity');
    return response.data.data || [];
  },
};

export default api;
