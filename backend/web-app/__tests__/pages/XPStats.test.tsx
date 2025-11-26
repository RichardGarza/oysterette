/**
 * XP Stats Page Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import XPStatsPage from '../../app/xp-stats/page';
import { useAuth } from '../../context/AuthContext';
import { xpApi } from '../../lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  xpApi: {
    getStats: jest.fn(),
  },
}));

jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

describe('XP Stats Page', () => {
  const mockPush = jest.fn();

  const mockXPData = {
    level: 7,
    xp: 1750,
    xpToNextLevel: 100,
    achievements: [
      {
        name: 'First Review',
        description: 'Write your first oyster review',
        icon: '📝',
      },
      {
        name: 'Oyster Explorer',
        description: 'Try 10 different oysters',
        icon: '🦪',
      },
    ],
  };

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

    render(<XPStatsPage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should show loading state while loading', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (xpApi.getStats as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<XPStatsPage />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    // Loading skeleton has animate-pulse class
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('should display XP stats when loaded', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (xpApi.getStats as jest.Mock).mockResolvedValue(mockXPData);

    render(<XPStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('XP & Achievements')).toBeInTheDocument();
      expect(screen.getByText('Level 7')).toBeInTheDocument();
      expect(screen.getByText('1750 XP')).toBeInTheDocument();
    });
  });

  it('should display achievements when available', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (xpApi.getStats as jest.Mock).mockResolvedValue(mockXPData);

    render(<XPStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.getByText('First Review')).toBeInTheDocument();
      expect(screen.getByText('Write your first oyster review')).toBeInTheDocument();
      expect(screen.getByText('Oyster Explorer')).toBeInTheDocument();
    });
  });

  it('should show error message when data fails to load', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (xpApi.getStats as jest.Mock).mockResolvedValue(null);

    render(<XPStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load XP stats.')).toBeInTheDocument();
    });
  });
});
