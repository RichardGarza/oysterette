/**
 * Profile Reviews Page Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProfileReviewsPage from '../../app/profile/reviews/page';
import { useAuth } from '../../context/AuthContext';
import { reviewApi } from '../../lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  reviewApi: {
    getUserReviews: jest.fn(),
  },
}));

jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../components/ReviewCard', () => ({
  __esModule: true,
  default: ({ review }: any) => (
    <div data-testid={`review-${review.id}`}>
      <span>{review.notes}</span>
      <span>{review.rating}</span>
    </div>
  ),
}));

jest.mock('../../components/EmptyState', () => ({
  __esModule: true,
  default: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

jest.mock('../../components/LoadingSpinner', () => ({
  __esModule: true,
  default: ({ text }: any) => <div data-testid="loading-spinner">{text}</div>,
}));

describe('Profile Reviews Page', () => {
  const mockPush = jest.fn();

  const mockReviews = [
    {
      id: 'review-1',
      userId: 'user-1',
      oysterId: 'oyster-1',
      rating: 'LOVE_IT',
      notes: 'Amazing oyster!',
      createdAt: '2024-11-01T00:00:00Z',
      agreeCount: 5,
      disagreeCount: 1,
    },
    {
      id: 'review-2',
      userId: 'user-1',
      oysterId: 'oyster-2',
      rating: 'LIKE_IT',
      notes: 'Pretty good',
      createdAt: '2024-10-15T00:00:00Z',
      agreeCount: 3,
      disagreeCount: 0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
    });
  });

  it('should redirect to login if not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });

    render(<ProfileReviewsPage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should show loading spinner while loading', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (reviewApi.getUserReviews as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<ProfileReviewsPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
  });

  it('should display reviews list', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (reviewApi.getUserReviews as jest.Mock).mockResolvedValue(mockReviews);

    render(<ProfileReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Your Reviews')).toBeInTheDocument();
      expect(screen.getByText('2 reviews')).toBeInTheDocument();
      expect(screen.getByTestId('review-review-1')).toBeInTheDocument();
      expect(screen.getByTestId('review-review-2')).toBeInTheDocument();
      expect(screen.getByText('Amazing oyster!')).toBeInTheDocument();
      expect(screen.getByText('Pretty good')).toBeInTheDocument();
    });
  });

  it('should show empty state when no reviews', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (reviewApi.getUserReviews as jest.Mock).mockResolvedValue([]);

    render(<ProfileReviewsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No Reviews Yet')).toBeInTheDocument();
    });
  });

  it('should have back to profile link', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (reviewApi.getUserReviews as jest.Mock).mockResolvedValue(mockReviews);

    render(<ProfileReviewsPage />);

    await waitFor(() => {
      const backLink = screen.getByRole('link', { name: /back to profile/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/profile');
    });
  });

  it('should handle API error gracefully', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (reviewApi.getUserReviews as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<ProfileReviewsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No Reviews Yet')).toBeInTheDocument();
    });
  });
});
