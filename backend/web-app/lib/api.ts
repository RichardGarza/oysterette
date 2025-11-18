/**
 * API Client for Oysterette Web App
 * 
 * Centralized HTTP client with JWT authentication
 * Uses same backend API as mobile app
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Oyster, Review, User, AuthResponse, ApiResponse, ReviewRating } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://oysterette-production.up.railway.app/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (email: string, name: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      email,
      name,
      password,
    });
    if (!response.data.data) throw new Error('Registration failed');
    return response.data.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    if (!response.data.data) throw new Error('Login failed');
    return response.data.data;
  },

  googleAuth: async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/google', {
      idToken,
    });
    if (!response.data.data) throw new Error('Google authentication failed');
    return response.data.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    if (!response.data.data) throw new Error('Failed to get profile');
    return response.data.data;
  },
};

// Oyster API
export const oysterApi = {
  getAll: async (params?: {
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    sweetness?: 'low' | 'high';
    size?: 'low' | 'high';
    body?: 'low' | 'high';
  }): Promise<Oyster[]> => {
    const response = await api.get<ApiResponse<Oyster[]>>('/oysters', { params });
    return response.data.data || [];
  },

  getById: async (id: string): Promise<Oyster | null> => {
    const response = await api.get<ApiResponse<Oyster>>(`/oysters/${id}`);
    return response.data.data || null;
  },

  search: async (query: string): Promise<Oyster[]> => {
    const response = await api.get<ApiResponse<Oyster[]>>('/oysters/search', {
      params: { query },
    });
    return response.data.data || [];
  },

  create: async (oyster: {
    name: string;
    species?: string;
    origin?: string;
    standoutNotes?: string;
    size: number;
    body: number;
    sweetBrininess: number;
    flavorfulness: number;
    creaminess: number;
  }): Promise<Oyster> => {
    const response = await api.post<ApiResponse<Oyster>>('/oysters', oyster);
    if (!response.data.data) throw new Error('Failed to create oyster');
    return response.data.data;
  },
};

// Review API
export const reviewApi = {
  getOysterReviews: async (oysterId: string): Promise<Review[]> => {
    const response = await api.get<ApiResponse<Review[]>>(`/reviews/oyster/${oysterId}`);
    return response.data.data || [];
  },

  getMyReviews: async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
  }): Promise<{ reviews: Review[]; total: number; page: number; limit: number }> => {
    const response = await api.get<ApiResponse<any>>('/reviews/user', { params });
    return response.data.data || { reviews: [], total: 0, page: 1, limit: 20 };
  },

  checkExisting: async (oysterId: string): Promise<Review | null> => {
    const response = await api.get<ApiResponse<Review>>(`/reviews/check/${oysterId}`);
    return response.data.data || null;
  },

  create: async (review: {
    oysterId: string;
    rating: ReviewRating;
    size: number;
    body: number;
    sweetBrininess: number;
    flavorfulness: number;
    creaminess: number;
    notes?: string;
  }): Promise<Review | null> => {
    const response = await api.post<ApiResponse<Review>>('/reviews', review);
    return response.data.data || null;
  },

  update: async (reviewId: string, review: Partial<Review>): Promise<Review | null> => {
    const response = await api.put<ApiResponse<Review>>(`/reviews/${reviewId}`, review);
    return response.data.data || null;
  },

  delete: async (reviewId: string): Promise<boolean> => {
    const response = await api.delete<ApiResponse<{}>>(`/reviews/${reviewId}`);
    return response.data.success;
  },
};

// Vote API
export const voteApi = {
  vote: async (reviewId: string, isAgree: boolean): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/reviews/${reviewId}/vote`, {
      isAgree,
    });
    return response.data;
  },

  removeVote: async (reviewId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/reviews/${reviewId}/vote`);
    return response.data;
  },
};

// User API
export const userApi = {
  getProfile: async (): Promise<{
    user: User;
    stats: {
      totalReviews: number;
      totalFavorites: number;
      avgRatingGiven: number;
      credibilityScore: number;
      badgeLevel: 'Novice' | 'Trusted' | 'Expert';
      reviewStreak: number;
      mostReviewedSpecies?: string;
      mostReviewedOrigin?: string;
      memberSince: string;
      totalVotesGiven: number;
      totalVotesReceived: number;
    };
  }> => {
    const response = await api.get<ApiResponse<any>>('/users/profile');
    if (!response.data.data) throw new Error('Failed to get profile');
    return response.data.data;
  },

  updateProfile: async (name?: string, email?: string, profilePhotoUrl?: string): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/users/profile', {
      name,
      email,
      profilePhotoUrl,
    });
    if (!response.data.data) throw new Error('Failed to update profile');
    return response.data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>('/users/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  getMyReviews: async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
  }): Promise<{ reviews: Review[]; total: number; page: number; limit: number }> => {
    const response = await api.get<ApiResponse<any>>('/users/me/reviews', { params });
    return response.data.data || { reviews: [], total: 0, page: 1, limit: 20 };
  },

  updatePrivacySettings: async (settings: {
    profileVisibility?: 'public' | 'friends' | 'private';
    showReviewHistory?: boolean;
    showFavorites?: boolean;
    showStatistics?: boolean;
  }): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>('/users/privacy', settings);
    return response.data;
  },

  setUsername: async (username: string): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>('/users/username', { username });
    return response.data;
  },

  searchUsers: async (query: string) => {
    try {
      const response = await api.get('/users/search', { params: { q: query } });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to search users');
    }
  },
};

// Favorites API
export const favoriteApi = {
  getAll: async (): Promise<string[]> => {
    const response = await api.get<{ favorites: string[] }>('/favorites');
    return response.data.favorites || [];
  },

  add: async (oysterId: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/favorites/${oysterId}`);
    return response.data;
  },

  remove: async (oysterId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/favorites/${oysterId}`);
    return response.data;
  },
};

// Recommendations API
export const recommendationApi = {
  getRecommendations: async (limit = 5): Promise<Oyster[]> => {
    const response = await api.get<ApiResponse<Oyster[]>>('/recommendations', {
      params: { limit },
    });
    return response.data.data || [];
  },

  getHybrid: async (limit = 5): Promise<Oyster[]> => {
    const response = await api.get<ApiResponse<Oyster[]>>('/recommendations/hybrid', {
      params: { limit },
    });
    return response.data.data || [];
  },
};

// XP API
export const xpApi = {
  getStats: async (): Promise<{
    xp: number;
    level: number;
    xpToNextLevel: number;
    achievements: any[];
  }> => {
    const response = await api.get<ApiResponse<any>>('/xp/stats');
    return response.data.data || { xp: 0, level: 1, xpToNextLevel: 100, achievements: [] };
  },
};

// Upload API
export const uploadApi = {
  uploadProfilePhoto: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<{ url: string }>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  },
};

export const friendApi = {
  getFriends: async () => {
    try {
      const response = await api.get('/friends');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load friends');
    }
  },

  getPendingRequests: async () => {
    try {
      const response = await api.get('/friends/pending');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load pending requests');
    }
  },

  sendRequest: async (receiverId: string) => {
    try {
      const response = await api.post('/friends/request', { receiverId });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send friend request');
    }
  },

  acceptRequest: async (friendshipId: string) => {
    try {
      const response = await api.put(`/friends/accept/${friendshipId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to accept request');
    }
  },

  rejectRequest: async (friendshipId: string) => {
    try {
      const response = await api.put(`/friends/reject/${friendshipId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to reject request');
    }
  },

  removeFriend: async (friendshipId: string) => {
    try {
      const response = await api.delete(`/friends/${friendshipId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to remove friend');
    }
  },

  getActivity: async () => {
    try {
      const response = await api.get('/friends/activity');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load activity');
    }
  },

  getPairedRecommendations: async (friendId: string) => {
    try {
      const response = await api.get(`/friends/paired/${friendId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load paired recommendations');
    }
  },
};

export default api;

