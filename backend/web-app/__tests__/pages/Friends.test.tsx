/**
 * Friends Page Tests
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import FriendsPage from '../../app/friends/page';
import { useAuth } from '../../context/AuthContext';
import { friendApi, userApi } from '../../lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  friendApi: {
    getFriends: jest.fn(),
    getPendingRequests: jest.fn(),
    getActivity: jest.fn(),
    sendRequest: jest.fn(),
    acceptRequest: jest.fn(),
    rejectRequest: jest.fn(),
    removeFriend: jest.fn(),
  },
  userApi: {
    searchUsers: jest.fn(),
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

describe('Friends Page', () => {
  const mockPush = jest.fn();

  const mockFriends = [
    {
      id: 'friend-1',
      name: 'Alice Smith',
      email: 'alice@example.com',
      username: 'alice',
      profilePhotoUrl: null,
      friendshipId: 'friendship-1',
      since: '2024-01-01T00:00:00Z',
    },
    {
      id: 'friend-2',
      name: 'Bob Jones',
      email: 'bob@example.com',
      username: 'bob',
      profilePhotoUrl: null,
      friendshipId: 'friendship-2',
      since: '2024-02-01T00:00:00Z',
    },
  ];

  const mockPendingRequests = {
    sent: [],
    received: [
      {
        id: 'request-1',
        user: {
          id: 'user-3',
          name: 'Charlie Brown',
          email: 'charlie@example.com',
          username: 'charlie',
          profilePhotoUrl: null,
        },
        createdAt: '2024-03-01T00:00:00Z',
      },
    ],
  };

  const mockActivity = [
    {
      id: 'activity-1',
      user: { id: 'friend-1', name: 'Alice Smith', profilePhotoUrl: null },
      oyster: { id: 'oyster-1', name: 'Kumamoto' },
      rating: 'LOVE_IT',
      notes: 'Amazing!',
      createdAt: '2024-03-15T00:00:00Z',
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
      user: null,
    });

    render(<FriendsPage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should show loading spinner while loading', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1' },
    });
    (friendApi.getFriends as jest.Mock).mockImplementation(() => new Promise(() => {}));
    (friendApi.getPendingRequests as jest.Mock).mockImplementation(() => new Promise(() => {}));
    (friendApi.getActivity as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<FriendsPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading friends...')).toBeInTheDocument();
  });

  it('should display friends list', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1' },
    });
    (friendApi.getFriends as jest.Mock).mockResolvedValue(mockFriends);
    (friendApi.getPendingRequests as jest.Mock).mockResolvedValue({ sent: [], received: [] });
    (friendApi.getActivity as jest.Mock).mockResolvedValue([]);

    render(<FriendsPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      expect(screen.getByText('@alice')).toBeInTheDocument();
      expect(screen.getByText('@bob')).toBeInTheDocument();
    });
  });

  it('should show empty state when no friends', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1' },
    });
    (friendApi.getFriends as jest.Mock).mockResolvedValue([]);
    (friendApi.getPendingRequests as jest.Mock).mockResolvedValue({ sent: [], received: [] });
    (friendApi.getActivity as jest.Mock).mockResolvedValue([]);

    render(<FriendsPage />);

    await waitFor(() => {
      expect(screen.getByText('No friends yet')).toBeInTheDocument();
      expect(screen.getByText('Start adding friends to see them here')).toBeInTheDocument();
    });
  });

  it('should display pending requests count in tab', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1' },
    });
    (friendApi.getFriends as jest.Mock).mockResolvedValue([]);
    (friendApi.getPendingRequests as jest.Mock).mockResolvedValue(mockPendingRequests);
    (friendApi.getActivity as jest.Mock).mockResolvedValue([]);

    render(<FriendsPage />);

    await waitFor(() => {
      expect(screen.getByText('Pending (1)')).toBeInTheDocument();
    });
  });
});
