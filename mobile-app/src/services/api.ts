import axios, { AxiosInstance } from 'axios';
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
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
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
  // Get all oysters
  getAll: async (): Promise<Oyster[]> => {
    const response = await api.get<ApiResponse<Oyster[]>>('/oysters');
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
  updateProfile: async (name?: string, email?: string): Promise<User | null> => {
    const response = await api.put<ApiResponse<User>>('/users/profile', { name, email });
    return response.data.data || null;
  },
};

export default api;
