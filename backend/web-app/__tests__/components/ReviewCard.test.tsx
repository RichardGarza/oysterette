/**
 * ReviewCard Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ReviewCard from '../../components/ReviewCard';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../lib/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock API
jest.mock('../../lib/api', () => ({
  voteApi: {
    vote: jest.fn(),
    removeVote: jest.fn(),
  },
  reviewApi: {
    delete: jest.fn(),
  },
}));

describe('ReviewCard', () => {
  const mockPush = jest.fn();
  const mockReview = {
    id: 'review-1',
    userId: 'user-1',
    oysterId: 'oyster-1',
    rating: 'LOVE_IT',
    notes: 'Best oyster ever! So creamy and flavorful.',
    size: 8,
    body: 7,
    sweetBrininess: 6,
    flavorfulness: 9,
    creaminess: 8,
    createdAt: '2024-11-01T00:00:00Z',
    agreeCount: 5,
    disagreeCount: 1,
    oyster: {
      id: 'oyster-1',
      name: 'Kumamoto',
      species: 'Crassostrea gigas',
      origin: 'Pacific Northwest',
    },
    user: {
      id: 'user-1',
      name: 'John Doe',
      username: 'johndoe',
      profilePhotoUrl: 'https://example.com/photo.jpg',
    },
    photoUrls: ['https://example.com/review-photo.jpg'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'other-user' },
    });
    global.confirm = jest.fn(() => true);
  });

  it('should display review content correctly', () => {
    render(<ReviewCard review={mockReview} />);

    expect(screen.getByText('Kumamoto')).toBeInTheDocument();
    expect(screen.getByText('johndoe')).toBeInTheDocument();
    expect(screen.getByText('Best oyster ever! So creamy and flavorful.')).toBeInTheDocument();
    expect(screen.getByText(/LOVE IT/)).toBeInTheDocument();
    // Date format may vary by locale, just check it exists
    const dateText = new Date('2024-11-01T00:00:00Z').toLocaleDateString();
    expect(screen.getByText(dateText)).toBeInTheDocument();
  });

  it('should show user info with profile photo', () => {
    render(<ReviewCard review={mockReview} />);

    const profilePhoto = screen.getByAltText('John Doe');
    expect(profilePhoto).toBeInTheDocument();
    expect(profilePhoto).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('should show vote buttons for authenticated users', async () => {
    render(<ReviewCard review={mockReview} />);

    const agreeButton = screen.getByText(/👍 5/);
    const disagreeButton = screen.getByText(/👎 1/);

    expect(agreeButton).toBeInTheDocument();
    expect(disagreeButton).toBeInTheDocument();

    fireEvent.click(agreeButton);

    await waitFor(() => {
      expect(api.voteApi.vote).toHaveBeenCalledWith('review-1', true);
    });
  });

  it('should show edit and delete buttons for own review', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1' }, // Same as review userId
    });

    render(<ReviewCard review={mockReview} />);

    const editButton = screen.getByTitle('Edit review');
    const deleteButton = screen.getByTitle('Delete review');

    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });

  it('should handle delete review', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1' },
    });

    const mockOnDelete = jest.fn();
    (api.reviewApi.delete as jest.Mock).mockResolvedValue({});

    render(<ReviewCard review={mockReview} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByTitle('Delete review');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(api.reviewApi.delete).toHaveBeenCalledWith('review-1');
    });

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });
});
