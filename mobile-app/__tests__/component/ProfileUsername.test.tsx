import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfileScreen from '../../src/screens/ProfileScreen';
import * as api from '../../src/services/api';
import * as auth from '../../src/services/auth';
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
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
  useFocusEffect: jest.fn((callback) => {
    if (typeof callback === 'function') {
      callback();
    }
  }),
}));

// Mock theme context
jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#000',
        background: '#fff',
        surface: '#fff',
        text: '#000',
        textSecondary: '#666',
      },
    },
    paperTheme: {
      colors: {
        primary: '#000',
        background: '#fff',
        surface: '#fff',
        text: '#000',
        onSurface: '#000',
      },
    },
    isDark: false,
  }),
}));

// Mock XP notification context
jest.mock('../../src/context/XPNotificationContext', () => ({
  useXPNotification: () => ({
    showXPNotification: jest.fn(),
    showLevelUp: jest.fn(),
  }),
}));

// Mock components
jest.mock('../../src/components/EmptyState', () => ({
  EmptyState: 'EmptyState',
}));

jest.mock('../../src/components/XPBadge', () => ({
  XPBadge: 'XPBadge',
}));

// Mock services
jest.mock('../../src/services/favorites', () => ({
  favoritesStorage: {
    getFavorites: jest.fn().mockResolvedValue([]),
    addFavorite: jest.fn().mockResolvedValue(undefined),
    removeFavorite: jest.fn().mockResolvedValue(undefined),
    toggleFavorite: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../src/utils/flavorLabels', () => ({
  getRangeLabel: jest.fn((value: number) => `${value}`),
  getAttributeLabel: jest.fn((attr: string) => attr),
}));

// Mock API
jest.mock('../../src/services/api', () => ({
  userApi: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getMyReviews: jest.fn(),
  },
  uploadApi: {
    uploadProfilePhoto: jest.fn().mockResolvedValue({ url: 'https://example.com/photo.jpg' }),
  },
  getXPStats: jest.fn(),
}));

// Mock auth storage
jest.mock('../../src/services/auth', () => ({
  authStorage: {
    getUser: jest.fn(),
    getToken: jest.fn(),
  },
}));

// Mock custom hooks
const mockUseProfile = jest.fn();
const mockUsePublicProfile = jest.fn();
const mockUseProfileReviews = jest.fn();
const mockUsePublicProfileReviews = jest.fn();
const mockUseProfileXP = jest.fn();

jest.mock('../../src/hooks/useQueries', () => ({
  useProfile: () => mockUseProfile(),
  usePublicProfile: (userId: string) => mockUsePublicProfile(userId),
  useProfileReviews: () => mockUseProfileReviews(),
  usePublicProfileReviews: (userId: string) => mockUsePublicProfileReviews(userId),
  useProfileXP: () => mockUseProfileXP(),
}));

describe('ProfileScreen Username Tests', () => {
  const mockNavigate = jest.fn();
  const mockGoBack = jest.fn();
  const currentUserId = 'test-user-id';

  const mockProfileWithoutUsername = {
    user: {
      id: currentUserId,
      name: 'Test User',
      email: 'test@example.com',
      username: null,
      profilePhotoUrl: null,
      credibilityScore: 0.5,
      createdAt: new Date('2024-01-01'),
    },
    stats: {
      totalReviews: 5,
      totalFavorites: 3,
      friendsCount: 0,
      avgRatingGiven: 3.5,
      credibilityScore: 0.5,
      badgeLevel: 'Novice' as const,
      reviewStreak: 2,
      mostReviewedSpecies: 'Crassostrea gigas',
      mostReviewedOrigin: 'Pacific Northwest',
      memberSince: '2024-01-01T00:00:00Z',
      totalVotesGiven: 10,
      totalVotesReceived: 5,
    },
  };

  const mockProfileWithUsername = {
    ...mockProfileWithoutUsername,
    user: {
      ...mockProfileWithoutUsername.user,
      username: 'OysterFan123',
    },
  };

  const mockReviews: any[] = [];

  beforeEach(() => {
    jest.clearAllMocks();

    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
      goBack: mockGoBack,
      setOptions: jest.fn(),
    });

    (useRoute as jest.Mock).mockReturnValue({
      params: {},
    });

    (auth.authStorage.getUser as jest.Mock).mockResolvedValue({
      id: currentUserId,
      name: 'Test User',
      email: 'test@example.com',
    });

    (auth.authStorage.getToken as jest.Mock).mockResolvedValue('test-token');

    // Setup default hook responses (no username)
    mockUseProfile.mockReturnValue({
      data: mockProfileWithoutUsername,
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
      data: { reviews: mockReviews },
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

  it('renders username input empty if not set', async () => {
    const queryClient = createTestQueryClient();
    const { getByLabelText } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const usernameInput = getByLabelText('Username (optional)');
      expect(usernameInput.props.value).toBe('');
    });
  });

  it('updates and saves username', async () => {
    (api.userApi.updateProfile as jest.Mock).mockResolvedValue({
      id: currentUserId,
      username: 'OysterFan123',
    });

    const queryClient = createTestQueryClient();
    const { getByLabelText, getByText } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getByLabelText('Username (optional)')).toBeTruthy();
    });

    const input = getByLabelText('Username (optional)');
    fireEvent.changeText(input, 'OysterFan123');

    const saveBtn = getByText('Save');
    fireEvent.press(saveBtn);

    await waitFor(() => {
      expect(api.userApi.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'OysterFan123' })
      );
    });
  });

  it('displays username if set, falls back to name if empty', async () => {
    // Override mock for this test
    mockUseProfile.mockReturnValue({
      data: mockProfileWithUsername,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const queryClient = createTestQueryClient();
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getByText('OysterFan123')).toBeTruthy();
    });
  });

  it('displays name if username empty', async () => {
    const queryClient = createTestQueryClient();
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreen />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getByText('Test User')).toBeTruthy();
    });
  });
});

export default {};
