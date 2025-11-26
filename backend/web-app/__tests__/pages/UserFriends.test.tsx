/**
 * Public User Friends Page Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import UserFriendsPage from '../../app/users/[userId]/friends/page';
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

describe('User Friends Page', () => {
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

    render(<UserFriendsPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading friends...')).toBeInTheDocument();
  });

  it('should display user name in header', async () => {
    (userApi.getPublicProfile as jest.Mock).mockResolvedValue({ user: mockUser, stats: {} });

    render(<UserFriendsPage />);

    await waitFor(() => {
      expect(screen.getByText("Test User's Friends")).toBeInTheDocument();
    });
  });

  it('should show privacy message since friends list is private', async () => {
    (userApi.getPublicProfile as jest.Mock).mockResolvedValue({ user: mockUser, stats: {} });

    render(<UserFriendsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Friends List is Private')).toBeInTheDocument();
      expect(screen.getByText("Test User's friends list is set to private.")).toBeInTheDocument();
    });
  });
});
