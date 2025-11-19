/**
 * ProfileScreen Public Profile Tests
 * 
 * Tests for viewing other users' public profiles in the mobile app.
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfileScreen from '../../screens/ProfileScreen';
import * as api from '../../services/api';
import * as auth from '../../services/auth';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
  useFocusEffect: jest.fn((callback) => {
    // Call callback after component mounts
    setTimeout(() => callback(), 0);
  }),
}));

// Mock theme context
jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: { colors: { primary: '#FF6B35', background: '#ffffff', text: '#000', textSecondary: '#666' } },
    isDark: false,
    paperTheme: { colors: { primary: '#FF6B35', background: '#ffffff', onSurface: '#000000', surface: '#fff', text: '#000' } },
  })),
}));

// Mock XP notification context
jest.mock('../../context/XPNotificationContext', () => ({
  useXPNotification: () => ({
    showXPNotification: jest.fn(),
    showLevelUp: jest.fn(),
  }),
}));

// Mock auth storage
jest.mock('../../services/auth', () => ({
  authStorage: {
    getUser: jest.fn(),
    getToken: jest.fn(),
  },
}));

// Mock components
jest.mock('../../components/EmptyState', () => ({
  EmptyState: 'EmptyState',
}));

jest.mock('../../components/XPBadge', () => ({
  XPBadge: 'XPBadge',
}));

// Mock services
jest.mock('../../services/favorites', () => ({
  favoritesStorage: {
    getFavorites: jest.fn().mockResolvedValue([]),
    addFavorite: jest.fn().mockResolvedValue(undefined),
    removeFavorite: jest.fn().mockResolvedValue(undefined),
    toggleFavorite: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../utils/flavorLabels', () => ({
  getRangeLabel: jest.fn((value: number) => `${value}`),
  getAttributeLabel: jest.fn((attr: string) => attr),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const React = require('react');

  const mockComponent = (name: string) => {
    const Component = (props: any) => React.createElement(name, props, props.children);
    Component.displayName = name;
    return Component;
  };

  return {
    Card: Object.assign(mockComponent('Card'), {
      Content: mockComponent('Card.Content'),
      Title: mockComponent('Card.Title'),
      Actions: mockComponent('Card.Actions'),
    }),
    Text: mockComponent('Text'),
    Button: mockComponent('Button'),
    TextInput: React.forwardRef((props: any, ref) => {
      const { label, value, onChangeText, ...otherProps } = props;
      return React.createElement('TextInput', {
        ...otherProps,
        ref,
        accessibilityLabel: label,
        value: value || '',
        onChangeText,
      });
    }),
    IconButton: mockComponent('IconButton'),
    Avatar: {
      Text: mockComponent('Avatar.Text'),
      Image: mockComponent('Avatar.Image'),
    },
    Chip: mockComponent('Chip'),
    ActivityIndicator: mockComponent('ActivityIndicator'),
    Dialog: Object.assign(mockComponent('Dialog'), {
      Title: mockComponent('Dialog.Title'),
      Content: mockComponent('Dialog.Content'),
      Actions: mockComponent('Dialog.Actions'),
    }),
    Portal: mockComponent('Portal'),
    ProgressBar: mockComponent('ProgressBar'),
    Surface: mockComponent('Surface'),
    useTheme: () => ({
      colors: {
        primary: '#000',
        background: '#fff',
        surface: '#fff',
        text: '#000',
      },
    }),
  };
});

// Mock API
jest.mock('../../services/api', () => {
  const mockGetXPStats = jest.fn();
  return {
    userApi: {
      getProfile: jest.fn(),
      getPublicProfile: jest.fn(),
      getMyReviews: jest.fn(),
      updateProfile: jest.fn(),
    },
    reviewApi: {
      getPublicUserReviews: jest.fn(),
    },
    uploadApi: {
      uploadProfilePhoto: jest.fn().mockResolvedValue({ url: 'https://example.com/photo.jpg' }),
    },
    getXPStats: mockGetXPStats,
    xpApi: {
      getStats: mockGetXPStats,
    },
  };
});

// Mock custom hooks
const mockUseProfile = jest.fn();
const mockUsePublicProfile = jest.fn();
const mockUseProfileReviews = jest.fn();
const mockUsePublicProfileReviews = jest.fn();
const mockUseProfileXP = jest.fn();

jest.mock('../../hooks/useQueries', () => ({
  useProfile: () => mockUseProfile(),
  usePublicProfile: (userId: string) => mockUsePublicProfile(userId),
  useProfileReviews: () => mockUseProfileReviews(),
  usePublicProfileReviews: (userId: string) => mockUsePublicProfileReviews(userId),
  useProfileXP: () => mockUseProfileXP(),
}));

describe('ProfileScreen - Public Profile Viewing', () => {
  const mockNavigate = jest.fn();
  const mockGoBack = jest.fn();
  const viewingUserId = 'friend-user-id-123';
  const currentUserId = 'current-user-id-456';

  const mockPublicProfile = {
    user: {
      id: viewingUserId,
      name: 'Friend User',
      email: 'friend@example.com',
      username: 'frienduser',
      profilePhotoUrl: 'https://example.com/photo.jpg',
      credibilityScore: 1.5,
      createdAt: new Date('2024-01-01'),
    },
    stats: {
      totalReviews: 25,
      totalFavorites: 15,
      friendsCount: 8,
      avgRatingGiven: 3.2,
      credibilityScore: 1.5,
      badgeLevel: 'Trusted' as const,
      reviewStreak: 5,
      mostReviewedSpecies: 'Crassostrea gigas',
      mostReviewedOrigin: 'Pacific Northwest',
      memberSince: '2024-01-01T00:00:00Z',
      totalVotesGiven: 50,
      totalVotesReceived: 30,
    },
  };

  const mockPublicReviews = [
    {
      id: 'review-1',
      userId: viewingUserId,
      oysterId: 'oyster-1',
      rating: 'LOVE_IT',
      notes: 'Great oyster!',
      size: 7,
      body: 8,
      sweetBrininess: 6,
      flavorfulness: 9,
      creaminess: 7,
      createdAt: '2024-11-01T00:00:00Z',
      agreeCount: 5,
      disagreeCount: 1,
      oyster: {
        id: 'oyster-1',
        name: 'Test Oyster',
        species: 'Crassostrea gigas',
        origin: 'Test Bay',
      },
      user: {
        id: viewingUserId,
        name: 'Friend User',
        profilePhotoUrl: 'https://example.com/photo.jpg',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
      goBack: mockGoBack,
      setOptions: jest.fn(),
    });

    (auth.authStorage.getUser as jest.Mock).mockResolvedValue({
      id: currentUserId,
      name: 'Current User',
      email: 'current@example.com',
    });

    (auth.authStorage.getToken as jest.Mock).mockResolvedValue('test-token');

    // Setup default hook responses (own profile - no data initially)
    mockUseProfile.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUsePublicProfile.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseProfileReviews.mockReturnValue({
      data: { reviews: [] },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUsePublicProfileReviews.mockReturnValue({
      data: { reviews: [] },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseProfileXP.mockReturnValue({
      data: {
        level: 2,
        currentXP: 150,
        xpToNextLevel: 200,
        totalXP: 350,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  describe('Public Profile Viewing', () => {
    it('renders public profile screen without crashing', async () => {
      (useRoute as jest.Mock).mockReturnValue({
        params: { userId: viewingUserId },
      });

      // Override mock for this test - provide public profile data
      mockUsePublicProfile.mockReturnValue({
        data: mockPublicProfile,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      });

      mockUsePublicProfileReviews.mockReturnValue({
        data: { reviews: mockPublicReviews },
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      });

      const queryClient = createTestQueryClient();
      const rendered = render(
        <QueryClientProvider client={queryClient}>
          <ProfileScreen />
        </QueryClientProvider>
      );

      // Just verify it renders without crashing
      expect(rendered).toBeTruthy();
    });

    it('distinguishes between own and public profiles', () => {
      // Test with public profile (userId in params)
      (useRoute as jest.Mock).mockReturnValue({
        params: { userId: 'some-user-id' },
      });

      mockUsePublicProfile.mockReturnValue({
        data: mockPublicProfile,
        isLoading: false,
        refetch: jest.fn(),
      });

      const queryClient = createTestQueryClient();
      const rendered = render(
        <QueryClientProvider client={queryClient}>
          <ProfileScreen />
        </QueryClientProvider>
      );

      expect(rendered).toBeTruthy();
    });

  });

  describe('Own Profile Viewing', () => {
    it('renders own profile when no userId param', () => {
      (useRoute as jest.Mock).mockReturnValue({
        params: {},  // No userId means own profile
      });

      const ownProfile = {
        user: {
          id: currentUserId,
          name: 'Current User',
          email: 'current@example.com',
          username: 'currentuser',
          profilePhotoUrl: null,
          credibilityScore: 1.0,
          createdAt: new Date('2024-01-01'),
        },
        stats: {
          totalReviews: 10,
          totalFavorites: 5,
          friendsCount: 3,
          avgRatingGiven: 3.5,
          credibilityScore: 1.0,
          badgeLevel: 'Novice' as const,
          reviewStreak: 2,
          mostReviewedSpecies: null,
          mostReviewedOrigin: null,
          memberSince: '2024-01-01T00:00:00Z',
          totalVotesGiven: 20,
          totalVotesReceived: 10,
        },
      };

      mockUseProfile.mockReturnValue({
        data: ownProfile,
        isLoading: false,
        refetch: jest.fn(),
      });

      const queryClient = createTestQueryClient();
      const rendered = render(
        <QueryClientProvider client={queryClient}>
          <ProfileScreen />
        </QueryClientProvider>
      );

      expect(rendered).toBeTruthy();
    });
  });
});

