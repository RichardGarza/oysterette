/**
 * Oyster Detail Page Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import OysterDetailPage from '../../app/oysters/[id]/page';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../lib/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock API
jest.mock('../../lib/api', () => ({
  oysterApi: {
    getById: jest.fn(),
  },
  reviewApi: {
    getOysterReviews: jest.fn(),
  },
  favoriteApi: {
    getAll: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
  },
}));

// Mock components
jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../components/ReviewCard', () => ({
  __esModule: true,
  default: ({ review }: any) => (
    <div data-testid={`review-${review.id}`}>{review.notes}</div>
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

describe('Oyster Detail Page', () => {
  const mockPush = jest.fn();
  const mockOyster = {
    id: 'oyster-1',
    name: 'Kumamoto',
    species: 'Crassostrea gigas',
    origin: 'Pacific Northwest',
    overallScore: 8.5,
    totalReviews: 10,
    avgSize: 7.5,
    avgBody: 8.0,
    avgSweetBrininess: 7.0,
    avgFlavorfulness: 8.5,
    avgCreaminess: 8.2,
  };

  const mockReviews = [
    {
      id: 'review-1',
      userId: 'user-1',
      oysterId: 'oyster-1',
      rating: 'LOVE_IT',
      notes: 'Amazing oyster!',
      createdAt: '2024-11-01T00:00:00Z',
      agreeCount: 3,
      disagreeCount: 0,
    },
    {
      id: 'review-2',
      userId: 'user-2',
      oysterId: 'oyster-1',
      rating: 'LIKE_IT',
      notes: 'Pretty good',
      createdAt: '2024-11-02T00:00:00Z',
      agreeCount: 1,
      disagreeCount: 0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: 'oyster-1' });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
    });
  });

  it('should show loading spinner initially', () => {
    (api.oysterApi.getById as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    (api.reviewApi.getOysterReviews as jest.Mock).mockResolvedValue([]);

    render(<OysterDetailPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading oyster details...')).toBeInTheDocument();
  });

  it('should display oyster details when loaded', async () => {
    (api.oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);
    (api.reviewApi.getOysterReviews as jest.Mock).mockResolvedValue(mockReviews);

    render(<OysterDetailPage />);

    await waitFor(() => {
      expect(api.oysterApi.getById).toHaveBeenCalledWith('oyster-1');
      expect(api.reviewApi.getOysterReviews).toHaveBeenCalledWith('oyster-1');
    });

    await waitFor(() => {
      expect(screen.getByText('Kumamoto')).toBeInTheDocument();
      expect(screen.getByText(/Pacific Northwest/)).toBeInTheDocument();
      expect(screen.getByText(/Crassostrea gigas/)).toBeInTheDocument();
    });
  });

  it('should display reviews', async () => {
    (api.oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);
    (api.reviewApi.getOysterReviews as jest.Mock).mockResolvedValue(mockReviews);

    render(<OysterDetailPage />);

    await waitFor(() => {
      expect(api.oysterApi.getById).toHaveBeenCalled();
      expect(api.reviewApi.getOysterReviews).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('review-review-1')).toBeInTheDocument();
      expect(screen.getByTestId('review-review-2')).toBeInTheDocument();
      expect(screen.getByText('Amazing oyster!')).toBeInTheDocument();
    });
  });

  it('should show empty state when no reviews', async () => {
    (api.oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);
    (api.reviewApi.getOysterReviews as jest.Mock).mockResolvedValue([]);

    render(<OysterDetailPage />);

    await waitFor(() => {
      expect(api.oysterApi.getById).toHaveBeenCalled();
      expect(api.reviewApi.getOysterReviews).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('should toggle favorite when authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1' },
    });
    (api.oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);
    (api.reviewApi.getOysterReviews as jest.Mock).mockResolvedValue([]);
    (api.favoriteApi.getAll as jest.Mock).mockResolvedValue([]);
    (api.favoriteApi.add as jest.Mock).mockResolvedValue({});

    render(<OysterDetailPage />);

    await waitFor(() => {
      expect(api.oysterApi.getById).toHaveBeenCalled();
      expect(api.favoriteApi.getAll).toHaveBeenCalled();
    });

    // Find the favorite button by the white heart emoji
    const favoriteButton = await screen.findByText('🤍');
    fireEvent.click(favoriteButton.parentElement!);

    await waitFor(() => {
      expect(api.favoriteApi.add).toHaveBeenCalledWith('oyster-1');
    });
  });

  it('should not show favorite button when not authenticated', async () => {
    (api.oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);
    (api.reviewApi.getOysterReviews as jest.Mock).mockResolvedValue([]);

    render(<OysterDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Kumamoto')).toBeInTheDocument();
    });

    // Favorite button should not exist when not authenticated
    expect(screen.queryByText('🤍')).not.toBeInTheDocument();
    expect(screen.queryByText('❤️')).not.toBeInTheDocument();
  });
});
