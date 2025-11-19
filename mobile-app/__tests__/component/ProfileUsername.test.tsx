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

  it('username input field is rendered and accessible', async () => {
    const queryClient = createTestQueryClient();
    const { getByLabelText } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreen />
      </QueryClientProvider>
    );

    // Wait for username input to be available
    await waitFor(() => {
      const input = getByLabelText('Username (optional)');
      expect(input).toBeTruthy();
      expect(input.props.accessibilityLabel).toBe('Username (optional)');
    });

    // Verify input has onChangeText handler
    const input = getByLabelText('Username (optional)');
    expect(input.props.onChangeText).toBeDefined();
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
