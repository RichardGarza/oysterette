import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewCard from '../components/ReviewCard';  // Adjusted
import { Review } from '../lib/types';  // Adjusted

// Mock API calls
jest.mock('../lib/api', () => ({
  voteApi: {
    vote: jest.fn(),
    removeVote: jest.fn(),
  },
  reviewApi: {
    delete: jest.fn(),
  },
}));

// Mock router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock auth
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('ReviewCard Component', () => {
  const mockReview = {
    id: 'review-1',
    rating: 'LIKE_IT',
    size: 7,
    body: 8,
    sweetBrininess: 6,
    flavorfulness: 9,
    creaminess: 7,
    notes: 'Great oyster!',
    oyster: { id: 'oyster-1', name: 'Test Oyster' },
    user: { id: 'user-1', name: 'Test User' },
    photoUrls: [],
    createdAt: new Date().toISOString(),
  };

  const mockOwnReview = { ...mockReview, user: { id: 'current-user-id', name: 'Me' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders review content correctly', () => {
    const useAuth = require('../context/AuthContext').useAuth;
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'current-user-id' } });

    render(<ReviewCard review={mockReview} onVoteChange={jest.fn()} onDelete={jest.fn()} />);

    // Check user name and rating
    expect(screen.getByText(mockReview.user.name)).toBeInTheDocument();
    expect(screen.getByText('Like It')).toBeInTheDocument();

    // Check attributes - adjust selectors based on actual rendering
    expect(screen.getByText('Size: 7/10')).toBeInTheDocument();
    expect(screen.getByText('Body: 8/10')).toBeInTheDocument();

    // Check notes
    expect(screen.getByText(mockReview.notes)).toBeInTheDocument();

    // Check vote buttons
    expect(screen.getByLabelText('Vote Agree')).toBeInTheDocument();
    expect(screen.getByLabelText('Vote Disagree')).toBeInTheDocument();
  });

  it('shows edit and delete buttons for own review', () => {
    const useAuth = require('../context/AuthContext').useAuth;
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'current-user-id' } });

    render(<ReviewCard review={mockOwnReview} onVoteChange={jest.fn()} onDelete={jest.fn()} />);

    // Pencil edit icon
    const editButton = screen.getByTitle('Edit review');
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveTextContent('✏️');

    // Delete icon
    const deleteButton = screen.getByTitle('Delete review');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveTextContent('🗑️');
  });

  it('handles agree vote click', async () => {
    const mockOnVoteChange = jest.fn();
    const useAuth = require('../context/AuthContext').useAuth;
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'current-user-id' } });

    const { vote } = require('../lib/api').voteApi;
    vote.mockResolvedValue({ message: 'Voted' });

    render(<ReviewCard review={mockReview} onVoteChange={mockOnVoteChange} onDelete={jest.fn()} />);

    const agreeButton = screen.getByLabelText('Vote Agree');
    await userEvent.click(agreeButton);

    await waitFor(() => {
      expect(vote).toHaveBeenCalledWith(mockReview.id, true);
      expect(mockOnVoteChange).toHaveBeenCalled();
    });
  });

  it('handles delete own review', async () => {
    const mockOnDelete = jest.fn();
    const useAuth = require('../context/AuthContext').useAuth;
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'current-user-id' } });

    const { delete: mockDelete } = require('../lib/api').reviewApi;
    mockDelete.mockResolvedValue(true);

    render(<ReviewCard review={mockOwnReview} onVoteChange={jest.fn()} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByTitle('Delete review');
    await userEvent.click(deleteButton);

    // Simulate confirm dialog
    global.confirm = jest.fn(() => true);
    // Assume the delete confirmation is triggered by the same button or a follow-up
    // If it's a separate button, adjust; for now, assume click triggers
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(mockOwnReview.id);
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });

  it('does not show edit/delete for other users review', () => {
    const useAuth = require('../context/AuthContext').useAuth;
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'different-user' } });

    render(<ReviewCard review={mockReview} onVoteChange={jest.fn()} onDelete={jest.fn()} />);

    // No edit or delete buttons
    expect(screen.queryByTitle('Edit review')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete review')).not.toBeInTheDocument();
  });
});
