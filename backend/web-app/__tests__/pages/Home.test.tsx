/**
 * Home Page Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import Home from '../../app/page';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import * as hooks from '../../hooks/useQueries';

// Mock contexts
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

// Mock hooks
jest.mock('../../hooks/useQueries', () => ({
  useRecommendations: jest.fn(),
  useTopOysters: jest.fn(),
  useProfile: jest.fn(),
}));

// Mock components
jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../components/RatingDisplay', () => ({
  __esModule: true,
  default: ({ overallScore, totalReviews }: any) => (
    <div data-testid="rating-display">{overallScore}/10 ({totalReviews})</div>
  ),
}));

describe('Home Page', () => {
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
    (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });
  });

  it('should render hero section with main heading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    (hooks.useTopOysters as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (hooks.useRecommendations as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (hooks.useProfile as jest.Mock).mockReturnValue({
      data: null,
    });

    render(<Home />);

    expect(screen.getByText('Discover Oysters from Around the World')).toBeInTheDocument();
    expect(screen.getByText(/Explore, review, and share/)).toBeInTheDocument();
    expect(screen.getByText('🔍 Search for Oysters')).toBeInTheDocument();
  });

  it('should display top oysters when loaded', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    (hooks.useTopOysters as jest.Mock).mockReturnValue({
      data: mockOysters,
      isLoading: false,
    });
    (hooks.useRecommendations as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (hooks.useProfile as jest.Mock).mockReturnValue({
      data: null,
    });

    render(<Home />);

    expect(screen.getByText('Top Rated Oysters')).toBeInTheDocument();
    expect(screen.getByText('Kumamoto')).toBeInTheDocument();
    expect(screen.getByText('Blue Point')).toBeInTheDocument();
    expect(screen.getByText(/Pacific Northwest/)).toBeInTheDocument();
  });

  it('should show user stats when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    (hooks.useTopOysters as jest.Mock).mockReturnValue({
      data: mockOysters,
      isLoading: false,
    });
    (hooks.useRecommendations as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (hooks.useProfile as jest.Mock).mockReturnValue({
      data: {
        stats: {
          totalReviews: 10,
          totalFavorites: 5,
        },
      },
    });

    render(<Home />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Reviews')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('should show recommendations for authenticated users', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    (hooks.useTopOysters as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (hooks.useRecommendations as jest.Mock).mockReturnValue({
      data: mockOysters,
      isLoading: false,
    });
    (hooks.useProfile as jest.Mock).mockReturnValue({
      data: {
        stats: {
          totalReviews: 10,
          totalFavorites: 5,
        },
      },
    });

    render(<Home />);

    expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    expect(screen.getAllByText('Kumamoto')[0]).toBeInTheDocument();
  });
});
