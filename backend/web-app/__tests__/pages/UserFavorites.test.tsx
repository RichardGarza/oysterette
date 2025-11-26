/**
 * Public User Favorites Page Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import UserFavoritesPage from '../../app/users/[userId]/favorites/page';
import { userApi } from '../../lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  userApi: {
    getPublicProfile: jest.fn(),
  },
}));

jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
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

jest.mock('../../components/RatingDisplay', () => ({
  __esModule: true,
  default: () => <div data-testid="rating-display">Rating</div>,
}));

describe('User Favorites Page', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  };

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

    render(<UserFavoritesPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading favorites...')).toBeInTheDocument();
  });

  it('should display user name in header', async () => {
    (userApi.getPublicProfile as jest.Mock).mockResolvedValue({ user: mockUser, stats: {} });

    render(<UserFavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText("Test User's Favorites")).toBeInTheDocument();
    });
  });

  it('should show privacy message since favorites are private', async () => {
    (userApi.getPublicProfile as jest.Mock).mockResolvedValue({ user: mockUser, stats: {} });

    render(<UserFavoritesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Favorites are Private')).toBeInTheDocument();
      expect(screen.getByText("Test User's favorites are set to private.")).toBeInTheDocument();
    });
  });
});
