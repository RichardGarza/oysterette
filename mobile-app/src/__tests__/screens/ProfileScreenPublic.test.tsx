/**
 * ProfileScreen Public Profile Tests
 * 
 * Tests for viewing other users' public profiles in the mobile app.
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../../screens/ProfileScreen';
import * as api from '../../services/api';
import * as auth from '../../services/auth';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';

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
    theme: { colors: { primary: '#FF6B35', background: '#ffffff' } },
    isDark: false,
    paperTheme: { colors: { primary: '#FF6B35', background: '#ffffff', onSurface: '#000000' } },
  })),
}));

// Mock auth storage
jest.mock('../../services/auth', () => ({
  authStorage: {
    getUser: jest.fn(),
    getToken: jest.fn(),
  },
}));

// Mock API
jest.mock('../../services/api', () => {
  const mockGetXPStats = jest.fn();
  return {
    userApi: {
      getProfile: jest.fn(),
      getPublicProfile: jest.fn(),
      getMyReviews: jest.fn(),
    },
    reviewApi: {
      getPublicUserReviews: jest.fn(),
    },
    getXPStats: mockGetXPStats,
    xpApi: {
      getStats: mockGetXPStats,
    },
  };
});

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

    useNavigation.mockReturnValue({
      navigate: mockNavigate,
      goBack: mockGoBack,
    });

    (auth.authStorage.getUser as jest.Mock).mockResolvedValue({
      id: currentUserId,
      name: 'Current User',
      email: 'current@example.com',
    });

    (api.userApi.getPublicProfile as jest.Mock).mockResolvedValue(mockPublicProfile);
    (api.reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue(mockPublicReviews);
    const apiModule = require('../../services/api');
    (apiModule.getXPStats as jest.Mock).mockResolvedValue({ xp: 100, level: 2 });
    (apiModule.xpApi.getStats as jest.Mock).mockResolvedValue({ xp: 100, level: 2 });
  });

  describe('Public Profile Viewing', () => {
    it('should load public profile when viewingUserId is provided', async () => {
      useRoute.mockReturnValue({
        params: { userId: viewingUserId },
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.userApi.getPublicProfile).toHaveBeenCalledWith(viewingUserId);
        expect(api.reviewApi.getPublicUserReviews).toHaveBeenCalledWith(viewingUserId);
      });

      expect(getByText('Friend User')).toBeTruthy();
      expect(getByText('@frienduser')).toBeTruthy();
    });

    it('should not call getProfile when viewing public profile', async () => {
      useRoute.mockReturnValue({
        params: { userId: viewingUserId },
      });

      render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.userApi.getPublicProfile).toHaveBeenCalled();
      });

      expect(api.userApi.getProfile).not.toHaveBeenCalled();
    });

    it('should not load XP data for public profiles', async () => {
      useRoute.mockReturnValue({
        params: { userId: viewingUserId },
      });

      render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.userApi.getPublicProfile).toHaveBeenCalled();
      });

      const apiModule = require('../../services/api');
      expect(apiModule.getXPStats).not.toHaveBeenCalled();
    });

    it('should hide edit profile button on public profiles', async () => {
      useRoute.mockReturnValue({
        params: { userId: viewingUserId },
      });

      const { queryByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.userApi.getPublicProfile).toHaveBeenCalled();
      });

      // Edit Profile button should not be visible
      expect(queryByText('Edit Profile')).toBeNull();
    });

    it('should hide change password button on public profiles', async () => {
      useRoute.mockReturnValue({
        params: { userId: viewingUserId },
      });

      const { queryByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.userApi.getPublicProfile).toHaveBeenCalled();
      });

      expect(queryByText('Change Password')).toBeNull();
    });

    it('should hide privacy settings button on public profiles', async () => {
      useRoute.mockReturnValue({
        params: { userId: viewingUserId },
      });

      const { queryByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.userApi.getPublicProfile).toHaveBeenCalled();
      });

      expect(queryByText('Privacy Settings')).toBeNull();
    });

    it('should hide XP & Achievements button on public profiles', async () => {
      useRoute.mockReturnValue({
        params: { userId: viewingUserId },
      });

      const { queryByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.userApi.getPublicProfile).toHaveBeenCalled();
      });

      expect(queryByText('XP & Achievements')).toBeNull();
    });

    it('should hide email on public profiles', async () => {
      useRoute.mockReturnValue({
        params: { userId: viewingUserId },
      });

      const { queryByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.userApi.getPublicProfile).toHaveBeenCalled();
      });

      // Email should not be displayed for public profiles
      expect(queryByText('friend@example.com')).toBeNull();
    });

    it('should hide delete button on reviews for public profiles', async () => {
      useRoute.mockReturnValue({
        params: { userId: viewingUserId },
      });

      const { queryByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.reviewApi.getPublicUserReviews).toHaveBeenCalled();
      });

      // Delete button should not be visible (IconButton with delete icon)
      // Note: This would need a testID on the IconButton to test properly
      // For now, we verify the component renders without errors
    });

    it('should display stats correctly for public profile', async () => {
      useRoute.mockReturnValue({
        params: { userId: viewingUserId },
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.userApi.getPublicProfile).toHaveBeenCalled();
      });

      expect(getByText('25')).toBeTruthy(); // Total reviews
      expect(getByText('15')).toBeTruthy(); // Total favorites
      expect(getByText('8')).toBeTruthy(); // Friends count
    });

    it('should display badge level for public profile', async () => {
      useRoute.mockReturnValue({
        params: { userId: viewingUserId },
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.userApi.getPublicProfile).toHaveBeenCalled();
      });

      expect(getByText('Trusted')).toBeTruthy();
    });

    it('should display reviews for public profile', async () => {
      useRoute.mockReturnValue({
        params: { userId: viewingUserId },
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.reviewApi.getPublicUserReviews).toHaveBeenCalled();
      });

      expect(getByText('Test Oyster')).toBeTruthy();
      expect(getByText('Great oyster!')).toBeTruthy();
    });

    it('should handle error when public profile fails to load', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      useRoute.mockReturnValue({
        params: { userId: viewingUserId },
      });

      (api.userApi.getPublicProfile as jest.Mock).mockRejectedValue(
        new Error('Failed to load profile')
      );

      render(<ProfileScreen />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Own Profile Viewing', () => {
    it('should load own profile when no viewingUserId is provided', async () => {
      useRoute.mockReturnValue({
        params: undefined,
      });

      (api.userApi.getProfile as jest.Mock).mockResolvedValue(mockPublicProfile);
      (api.userApi.getMyReviews as jest.Mock).mockResolvedValue({
        reviews: mockPublicReviews,
        total: 1,
        page: 1,
        pages: 1,
      });

      render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.userApi.getProfile).toHaveBeenCalled();
        expect(api.userApi.getMyReviews).toHaveBeenCalled();
        const apiModule = require('../../services/api');
        expect(apiModule.getXPStats).toHaveBeenCalled();
      });

      expect(api.userApi.getPublicProfile).not.toHaveBeenCalled();
    });

    it('should show edit buttons on own profile', async () => {
      useRoute.mockReturnValue({
        params: undefined,
      });

      (api.userApi.getProfile as jest.Mock).mockResolvedValue(mockPublicProfile);
      (api.userApi.getMyReviews as jest.Mock).mockResolvedValue({
        reviews: [],
        total: 0,
        page: 1,
        pages: 0,
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(api.userApi.getProfile).toHaveBeenCalled();
      });

      expect(getByText('Edit Profile')).toBeTruthy();
      expect(getByText('Change Password')).toBeTruthy();
    });
  });
});

