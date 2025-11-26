/**
 * Profile Page Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProfilePage from '../../app/profile/page';
import { useAuth } from '../../context/AuthContext';
import * as hooks from '../../hooks/useQueries';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock hooks
jest.mock('../../hooks/useQueries', () => ({
  useProfile: jest.fn(),
  useProfileReviews: jest.fn(),
  useProfileXP: jest.fn(),
}));

// Mock components
jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../components/ReviewCard', () => ({
  __esModule: true,
  default: ({ review }: any) => <div data-testid={`review-${review.id}`}>{review.notes}</div>,
}));

jest.mock('../../components/EmptyState', () => ({
  __esModule: true,
  default: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}));

jest.mock('../../components/LoadingSpinner', () => ({
  __esModule: true,
  default: ({ text }: any) => <div data-testid="loading-spinner">{text}</div>,
}));

describe('Profile Page', () => {
  const mockPush = jest.fn();
  const mockRefreshUser = jest.fn();
  const mockLogout = jest.fn();

  const mockProfile = {
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      profilePhotoUrl: 'https://example.com/photo.jpg',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    stats: {
      totalReviews: 10,
      totalFavorites: 5,
      avgRatingGiven: 3.5,
      credibilityScore: 1.2,
      badgeLevel: 'Trusted' as const,
      reviewStreak: 3,
      mostReviewedSpecies: 'Crassostrea gigas',
      mostReviewedOrigin: 'Pacific Northwest',
      memberSince: '2024-01-01T00:00:00Z',
      totalVotesGiven: 20,
      totalVotesReceived: 15,
      friendsCount: 5,
    },
  };

  const mockReviews = [
    {
      id: 'review-1',
      userId: 'user-1',
      oysterId: 'oyster-1',
      rating: 'LOVE_IT',
      notes: 'Great oyster!',
      createdAt: '2024-11-01T00:00:00Z',
      agreeCount: 3,
      disagreeCount: 0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });
  });

  it('should redirect to login if not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: mockLogout,
      refreshUser: mockRefreshUser,
    });
    (hooks.useProfile as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      refetch: jest.fn(),
    });
    (hooks.useProfileReviews as jest.Mock).mockReturnValue({
      data: { reviews: [] },
      refetch: jest.fn(),
    });
    (hooks.useProfileXP as jest.Mock).mockReturnValue({
      data: null,
      refetch: jest.fn(),
    });

    render(<ProfilePage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should show loading spinner while loading profile', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-1' },
      isAuthenticated: true,
      logout: mockLogout,
      refreshUser: mockRefreshUser,
    });
    (hooks.useProfile as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      refetch: jest.fn(),
    });
    (hooks.useProfileReviews as jest.Mock).mockReturnValue({
      data: { reviews: [] },
      refetch: jest.fn(),
    });
    (hooks.useProfileXP as jest.Mock).mockReturnValue({
      data: null,
      refetch: jest.fn(),
    });

    render(<ProfilePage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('should display user profile information', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-1' },
      isAuthenticated: true,
      logout: mockLogout,
      refreshUser: mockRefreshUser,
    });
    (hooks.useProfile as jest.Mock).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      refetch: jest.fn(),
    });
    (hooks.useProfileReviews as jest.Mock).mockReturnValue({
      data: { reviews: mockReviews },
      refetch: jest.fn(),
    });
    (hooks.useProfileXP as jest.Mock).mockReturnValue({
      data: { level: 5, xp: 1250 },
      refetch: jest.fn(),
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('@testuser')).toBeInTheDocument();
    });
  });

  it('should display user stats', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-1' },
      isAuthenticated: true,
      logout: mockLogout,
      refreshUser: mockRefreshUser,
    });
    (hooks.useProfile as jest.Mock).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      refetch: jest.fn(),
    });
    (hooks.useProfileReviews as jest.Mock).mockReturnValue({
      data: { reviews: [] },
      refetch: jest.fn(),
    });
    (hooks.useProfileXP as jest.Mock).mockReturnValue({
      data: null,
      refetch: jest.fn(),
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // totalReviews
      expect(screen.getByText('Reviews')).toBeInTheDocument();
      expect(screen.getByText('Favorites')).toBeInTheDocument();
    });
  });

  it('should display XP badge when XP data is available', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-1' },
      isAuthenticated: true,
      logout: mockLogout,
      refreshUser: mockRefreshUser,
    });
    (hooks.useProfile as jest.Mock).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      refetch: jest.fn(),
    });
    (hooks.useProfileReviews as jest.Mock).mockReturnValue({
      data: { reviews: [] },
      refetch: jest.fn(),
    });
    (hooks.useProfileXP as jest.Mock).mockReturnValue({
      data: { level: 5, xp: 1250 },
      refetch: jest.fn(),
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Level 5')).toBeInTheDocument();
      expect(screen.getByText('1250 XP')).toBeInTheDocument();
    });
  });
});
