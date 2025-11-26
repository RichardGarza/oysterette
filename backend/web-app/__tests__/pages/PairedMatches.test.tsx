/**
 * Paired Matches Page Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import PairedMatchesPage from '../../app/friends/paired/[friendId]/page';
import { useAuth } from '../../context/AuthContext';
import { friendApi } from '../../lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  friendApi: {
    getPairedRecommendations: jest.fn(),
  },
}));

jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../components/LoadingSpinner', () => ({
  __esModule: true,
  default: ({ text }: any) => <div data-testid="loading-spinner">{text}</div>,
}));

describe('Paired Matches Page', () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  const mockMatches = [
    {
      oyster: {
        id: 'oyster-1',
        name: 'Kumamoto',
        species: 'Crassostrea sikamea',
        origin: 'Washington',
      },
      userMatch: 85,
      friendMatch: 90,
      combinedScore: 87.5,
    },
    {
      oyster: {
        id: 'oyster-2',
        name: 'Blue Point',
        species: 'Crassostrea virginica',
        origin: 'Long Island',
      },
      userMatch: 75,
      friendMatch: 80,
      combinedScore: 77.5,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
    (useParams as jest.Mock).mockReturnValue({
      friendId: 'friend-123',
    });
  });

  it('should redirect to login if not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });

    render(<PairedMatchesPage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should show loading spinner while loading', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (friendApi.getPairedRecommendations as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<PairedMatchesPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading paired matches...')).toBeInTheDocument();
  });

  it('should display paired matches with compatibility scores', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (friendApi.getPairedRecommendations as jest.Mock).mockResolvedValue(mockMatches);

    render(<PairedMatchesPage />);

    await waitFor(() => {
      expect(screen.getByText('Paired Matches')).toBeInTheDocument();
      expect(screen.getByText('Kumamoto')).toBeInTheDocument();
      expect(screen.getByText('Blue Point')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument(); // Your Match
      expect(screen.getByText('90%')).toBeInTheDocument(); // Friend's Match
      expect(screen.getByText('88%')).toBeInTheDocument(); // Combined (rounded)
    });
  });

  it('should show empty state when no matches', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (friendApi.getPairedRecommendations as jest.Mock).mockResolvedValue([]);

    render(<PairedMatchesPage />);

    await waitFor(() => {
      expect(screen.getByText('No paired matches yet')).toBeInTheDocument();
      expect(screen.getByText('Review more oysters to see recommendations with your friend')).toBeInTheDocument();
    });
  });
});
