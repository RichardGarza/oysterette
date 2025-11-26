/**
 * Oyster List Page Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import OystersPage from '../../app/oysters/page';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../lib/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock API
jest.mock('../../lib/api', () => ({
  oysterApi: {
    getAll: jest.fn(),
    search: jest.fn(),
  },
  favoriteApi: {
    getAll: jest.fn(),
  },
}));

// Mock components
jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../components/RatingDisplay', () => ({
  __esModule: true,
  default: ({ overallScore }: any) => <div>{overallScore}/10</div>,
}));

jest.mock('../../components/EmptyState', () => ({
  __esModule: true,
  default: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}));

jest.mock('../../components/LoadingSpinner', () => ({
  __esModule: true,
  default: ({ text }: any) => <div data-testid="loading-spinner">{text}</div>,
}));

describe('Oyster List Page', () => {
  const mockOysters = [
    {
      id: 'oyster-1',
      name: 'Kumamoto',
      species: 'Crassostrea gigas',
      origin: 'Pacific Northwest',
      overallScore: 8.5,
      totalReviews: 25,
    },
    {
      id: 'oyster-2',
      name: 'Blue Point',
      species: 'Crassostrea virginica',
      origin: 'Long Island',
      overallScore: 7.8,
      totalReviews: 15,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });
    (api.favoriteApi.getAll as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render page heading and search input', async () => {
    (api.oysterApi.getAll as jest.Mock).mockResolvedValue(mockOysters);

    render(<OystersPage />);

    expect(screen.getByText('Browse Oysters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search oysters/)).toBeInTheDocument();
  });

  it('should display oysters when loaded', async () => {
    (api.oysterApi.getAll as jest.Mock).mockResolvedValue(mockOysters);

    render(<OystersPage />);

    await waitFor(() => {
      expect(api.oysterApi.getAll).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Kumamoto')).toBeInTheDocument();
      expect(screen.getByText('Blue Point')).toBeInTheDocument();
      expect(screen.getByText(/Pacific Northwest/)).toBeInTheDocument();
    });
  });

  it('should show loading spinner initially', () => {
    (api.oysterApi.getAll as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<OystersPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading oysters...')).toBeInTheDocument();
  });

  it('should show empty state when no oysters found', async () => {
    (api.oysterApi.getAll as jest.Mock).mockResolvedValue([]);

    render(<OystersPage />);

    await waitFor(() => {
      expect(api.oysterApi.getAll).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No Oysters Found')).toBeInTheDocument();
    });
  });

  it('should handle search input with debounce', async () => {
    (api.oysterApi.getAll as jest.Mock).mockResolvedValue(mockOysters);
    (api.oysterApi.search as jest.Mock).mockResolvedValue([mockOysters[0]]);

    render(<OystersPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(api.oysterApi.getAll).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText(/Search oysters/);
    fireEvent.change(searchInput, { target: { value: 'Kumamoto' } });

    // Fast-forward debounce timer
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(api.oysterApi.search).toHaveBeenCalledWith('Kumamoto');
    });
  });

  it('should handle sort changes', async () => {
    (api.oysterApi.getAll as jest.Mock).mockResolvedValue(mockOysters);

    render(<OystersPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(api.oysterApi.getAll).toHaveBeenCalledWith({
        sortBy: 'name',
        sortDirection: 'asc',
      });
    });

    // Change sort option
    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'rating' } });

    await waitFor(() => {
      expect(api.oysterApi.getAll).toHaveBeenCalledWith({
        sortBy: 'rating',
        sortDirection: 'asc',
      });
    });
  });
});
