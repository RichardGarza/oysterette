/**
 * Favorites Page Tests
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import FavoritesPage from '../../app/favorites/page';
import { useAuth } from '../../context/AuthContext';
import { oysterApi, favoriteApi } from '../../lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  oysterApi: {
    getAll: jest.fn(),
  },
  favoriteApi: {
    getAll: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../components/RatingDisplay', () => ({
  __esModule: true,
  default: ({ overallScore, totalReviews }: any) => (
    <div data-testid="rating-display">
      Score: {overallScore} ({totalReviews} reviews)
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

describe('Favorites Page', () => {
  const mockPush = jest.fn();

  const mockOysters = [
    {
      id: 'oyster-1',
      name: 'Kumamoto',
      species: 'Crassostrea sikamea',
      origin: 'Washington',
      overallScore: 4.5,
      totalReviews: 12,
    },
    {
      id: 'oyster-2',
      name: 'Blue Point',
      species: 'Crassostrea virginica',
      origin: 'Long Island',
      overallScore: 4.2,
      totalReviews: 8,
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

    render(<FavoritesPage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should show loading state while loading', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (favoriteApi.getAll as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<FavoritesPage />);

    // Loading skeleton has animate-pulse class
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should display favorites list', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (favoriteApi.getAll as jest.Mock).mockResolvedValue(['oyster-1', 'oyster-2']);
    (oysterApi.getAll as jest.Mock).mockResolvedValue(mockOysters);

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('My Favorites')).toBeInTheDocument();
      expect(screen.getByText('Kumamoto')).toBeInTheDocument();
      expect(screen.getByText('Blue Point')).toBeInTheDocument();
      expect(screen.getByText('2 favorites')).toBeInTheDocument();
    });
  });

  it('should show empty state when no favorites', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (favoriteApi.getAll as jest.Mock).mockResolvedValue([]);

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No Favorites Yet')).toBeInTheDocument();
    });
  });

  it('should display oyster details correctly', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (favoriteApi.getAll as jest.Mock).mockResolvedValue(['oyster-1']);
    (oysterApi.getAll as jest.Mock).mockResolvedValue([mockOysters[0]]);

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('Kumamoto')).toBeInTheDocument();
      expect(screen.getByText('Crassostrea sikamea')).toBeInTheDocument();
      expect(screen.getByText('Washington')).toBeInTheDocument();
      expect(screen.getByTestId('rating-display')).toBeInTheDocument();
    });
  });
});
