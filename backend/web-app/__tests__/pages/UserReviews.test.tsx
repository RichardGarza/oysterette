/**
 * Public User Reviews Page Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import UserReviewsPage from '../../app/users/[userId]/reviews/page';
import { userApi, reviewApi } from '../../lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  userApi: {
    getPublicProfile: jest.fn(),
  },
  reviewApi: {
    getPublicUserReviews: jest.fn(),
  },
}));

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

describe('User Reviews Page', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockReviews = [
    {
      id: 'review-1',
      userId: 'user-1',
      oysterId: 'oyster-1',
      rating: 'LOVE_IT',
      notes: 'Great oyster!',
      createdAt: '2024-11-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    (useParams as jest.Mock).mockReturnValue({
      userId: 'user-1',
    });
  });

  it('should show loading spinner while loading', async () => {
    (userApi.getPublicProfile as jest.Mock).mockImplementation(() => new Promise(() => {}));
    (reviewApi.getPublicUserReviews as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<UserReviewsPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
  });

  it('should display user reviews', async () => {
    (userApi.getPublicProfile as jest.Mock).mockResolvedValue({ user: mockUser, stats: {} });
    (reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue(mockReviews);

    render(<UserReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText("Test User's Reviews")).toBeInTheDocument();
      expect(screen.getByText('1 review')).toBeInTheDocument();
      expect(screen.getByTestId('review-review-1')).toBeInTheDocument();
      expect(screen.getByText('Great oyster!')).toBeInTheDocument();
    });
  });

  it('should show empty state when no reviews', async () => {
    (userApi.getPublicProfile as jest.Mock).mockResolvedValue({ user: mockUser, stats: {} });
    (reviewApi.getPublicUserReviews as jest.Mock).mockResolvedValue([]);

    render(<UserReviewsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No Reviews Yet')).toBeInTheDocument();
      expect(screen.getByText("Test User hasn't written any reviews yet.")).toBeInTheDocument();
    });
  });
});
