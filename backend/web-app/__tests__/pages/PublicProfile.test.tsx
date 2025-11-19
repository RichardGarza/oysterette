/**
 * Public Profile Page Tests
 * 
 * Tests for the public profile page (/users/[userId]) in the web app.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import PublicProfilePage from '../../app/users/[userId]/page';
import * as api from '../../lib/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

// Mock components
jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../components/ReviewCard', () => ({
  __esModule: true,
  default: ({ review }: any) => (
    <div data-testid={`review-${review.id}`}>{review.notes || 'No notes'}</div>
  ),
}));

jest.mock('../../components/EmptyState', () => ({
  __esModule: true,
  default: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}));

jest.mock('../../components/LoadingSpinner', () => ({
  __esModule: true,
  default: ({ text }: any) => <div data-testid="loading-spinner">{text}</div>,
}));

// Mock API
jest.mock('../../lib/api', () => ({
  userApi: {
    getPublicProfile: jest.fn(),
  },
  reviewApi: {
    getPublicUserReviews: jest.fn(),
  },
}));

describe('Public Profile Page', () => {
  const mockUserId = 'user-123';
  const mockProfile = {
    user: {
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      profilePhotoUrl: 'https://example.com/photo.jpg',
      credibilityScore: 1.5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    stats: {
      totalReviews: 20,
      totalFavorites: 10,
      friendsCount: 5,
      avgRatingGiven: 3.5,
      credibilityScore: 1.5,
      badgeLevel: 'Trusted' as const,
      reviewStreak: 7,
      mostReviewedSpecies: 'Crassostrea gigas',
      mostReviewedOrigin: 'Pacific Northwest',
      memberSince: '2024-01-01T00:00:00Z',
      totalVotesGiven: 40,
      totalVotesReceived: 25,
    },
  };

  const mockReviews = [
    {
      id: 'review-1',
      userId: mockUserId,
      oysterId: 'oyster-1',
      rating: 'LOVE_IT',
      notes: 'Amazing oyster!',
      size: 8,
      body: 7,
      sweetBrininess: 6,
      flavorfulness: 9,
      creaminess: 8,
      createdAt: '2024-11-01T00:00:00Z',
      agreeCount: 3,
      disagreeCount: 0,
      oyster: {
        id: 'oyster-1',
        name: 'Test Oyster',
        species: 'Crassostrea gigas',
        origin: 'Test Bay',
      },
      user: {
        id: mockUserId,
        name: 'Test User',
        profilePhotoUrl: 'https://example.com/photo.jpg',
      },
    },
    {
      id: 'review-2',
      userId: mockUserId,
      oysterId: 'oyster-2',
      rating: 'LIKE_IT',
      notes: 'Good oyster',
      size: 6,
      body: 7,
      sweetBrininess: 8,
      flavorfulness: 7,
      creaminess: 6,
      createdAt: '2024-11-02T00:00:00Z',
      agreeCount: 1,
      disagreeCount: 0,
      oyster: {
        id: 'oyster-2',
        name: 'Test Oyster 2',
        species: 'Crassostrea virginica',
        origin: 'Test Bay 2',
      },
      user: {
        id: mockUserId,
        name: 'Test User',
        profilePhotoUrl: 'https://example.com/photo.jpg',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ userId: mockUserId });
  });

  describe('Successful Profile Load', () => {
    it('should load and display public profile', async () => {
      (api.userApi.getPublicProfile as jest.Mock).mockResolvedValue(mockProfile);
      (api.reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue(mockReviews);

      render(<PublicProfilePage />);

      await waitFor(() => {
        expect(api.userApi.getPublicProfile).toHaveBeenCalledWith(mockUserId);
      });

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('@testuser')).toBeInTheDocument();
      });

      expect(api.reviewApi.getPublicUserReviews).toHaveBeenCalledWith(mockUserId);
    });

    it('should display user stats correctly', async () => {
      (api.userApi.getPublicProfile as jest.Mock).mockResolvedValue(mockProfile);
      (api.reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue([]);

      render(<PublicProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('20')).toBeInTheDocument(); // Total reviews
        expect(screen.getByText('10')).toBeInTheDocument(); // Total favorites
        expect(screen.getByText('5')).toBeInTheDocument(); // Friends count
      });
    });

    it('should display badge level', async () => {
      (api.userApi.getPublicProfile as jest.Mock).mockResolvedValue(mockProfile);
      (api.reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue([]);

      render(<PublicProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Trusted')).toBeInTheDocument();
      });
    });

    it('should display reviews', async () => {
      (api.userApi.getPublicProfile as jest.Mock).mockResolvedValue(mockProfile);
      (api.reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue(mockReviews);

      render(<PublicProfilePage />);

      await waitFor(() => {
        expect(screen.getByTestId('review-review-1')).toBeInTheDocument();
        expect(screen.getByTestId('review-review-2')).toBeInTheDocument();
      });
    });

    it('should not show edit profile button', async () => {
      (api.userApi.getPublicProfile as jest.Mock).mockResolvedValue(mockProfile);
      (api.reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue([]);

      render(<PublicProfilePage />);

      await waitFor(() => {
        expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
      });
    });

    it('should not show change password button', async () => {
      (api.userApi.getPublicProfile as jest.Mock).mockResolvedValue(mockProfile);
      (api.reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue([]);

      render(<PublicProfilePage />);

      await waitFor(() => {
        expect(screen.queryByText('Change Password')).not.toBeInTheDocument();
      });
    });

    it('should display member since date', async () => {
      (api.userApi.getPublicProfile as jest.Mock).mockResolvedValue(mockProfile);
      (api.reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue([]);

      render(<PublicProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/Member since/)).toBeInTheDocument();
      });
    });

    it('should limit reviews to 3 on initial display', async () => {
      const manyReviews = Array.from({ length: 10 }, (_, i) => ({
        ...mockReviews[0],
        id: `review-${i}`,
        notes: `Review ${i}`,
      }));

      (api.userApi.getPublicProfile as jest.Mock).mockResolvedValue(mockProfile);
      (api.reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue(manyReviews);

      render(<PublicProfilePage />);

      await waitFor(() => {
        const reviews = screen.queryAllByTestId(/review-/);
        expect(reviews.length).toBeLessThanOrEqual(3);
      });
    });

    it('should show empty state when user has no reviews', async () => {
      (api.userApi.getPublicProfile as jest.Mock).mockResolvedValue(mockProfile);
      (api.reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue([]);

      render(<PublicProfilePage />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(screen.getByText('No Reviews Yet')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when profile not found', async () => {
      (api.userApi.getPublicProfile as jest.Mock).mockRejectedValue({
        response: { data: { error: 'User not found' } },
      });
      (api.reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue([]);

      render(<PublicProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Profile Not Found')).toBeInTheDocument();
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });
    });

    it('should display error message when API fails', async () => {
      (api.userApi.getPublicProfile as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      (api.reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue([]);

      render(<PublicProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Profile Not Found')).toBeInTheDocument();
      });
    });

    it('should handle reviews loading error gracefully', async () => {
      (api.userApi.getPublicProfile as jest.Mock).mockResolvedValue(mockProfile);
      (api.reviewApi.getPublicUserReviews as jest.Mock).mockRejectedValue(
        new Error('Failed to load reviews')
      );

      render(<PublicProfilePage />);

      await waitFor(() => {
        // Profile should still load even if reviews fail
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while loading profile', () => {
      (api.userApi.getPublicProfile as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      (api.reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue([]);

      render(<PublicProfilePage />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });
  });
});

