/**
 * Add Review Page Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ReviewPage from '../../app/oysters/[id]/review/page';
import { useAuth } from '../../context/AuthContext';
import { oysterApi, reviewApi } from '../../lib/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock API
jest.mock('../../lib/api', () => ({
  oysterApi: {
    getById: jest.fn(),
  },
  reviewApi: {
    create: jest.fn(),
    update: jest.fn(),
    checkExisting: jest.fn(),
  },
}));

// Mock components
jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../components/LoadingSpinner', () => ({
  __esModule: true,
  default: ({ text }: any) => <div data-testid="loading-spinner">{text}</div>,
}));

describe('Review Page', () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  const mockOyster = {
    id: 'oyster-1',
    name: 'Test Oyster',
    species: 'Crassostrea gigas',
    origin: 'Pacific Northwest',
    size: 5,
    body: 5,
    sweetBrininess: 5,
    flavorfulness: 5,
    creaminess: 5,
    avgSize: 6,
    avgBody: 6,
    avgSweetBrininess: 6,
    avgFlavorfulness: 6,
    avgCreaminess: 6,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: 'oyster-1' });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
      replace: jest.fn(),
    });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
  });

  it('should redirect to login if not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });
    (oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);

    render(<ReviewPage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should render review form with all rating options', async () => {
    (oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Review Test Oyster')).toBeInTheDocument();
    });

    expect(screen.getByText('Share your experience with this oyster')).toBeInTheDocument();
    expect(screen.getByText('Overall Rating')).toBeInTheDocument();
    expect(screen.getByText('Love It')).toBeInTheDocument();
    expect(screen.getByText('Like It')).toBeInTheDocument();
    expect(screen.getByText('Okay')).toBeInTheDocument();
    expect(screen.getByText('Meh')).toBeInTheDocument();
  });

  it('should allow selecting a rating and show attribute sliders', async () => {
    (oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Love It')).toBeInTheDocument();
    });

    // Click Love It rating
    fireEvent.click(screen.getByText('Love It'));

    // Check that attribute sliders are present
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Sweet/Brininess')).toBeInTheDocument();
    expect(screen.getByText('Flavorfulness')).toBeInTheDocument();
    expect(screen.getByText('Creaminess')).toBeInTheDocument();

    // Check that notes textarea is present
    expect(screen.getByPlaceholderText('Share your thoughts about this oyster...')).toBeInTheDocument();
  });

  it('should submit review successfully and redirect', async () => {
    (oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);
    (reviewApi.create as jest.Mock).mockResolvedValue({ id: 'review-1' });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Love It')).toBeInTheDocument();
    });

    // Select rating
    fireEvent.click(screen.getByText('Love It'));

    // Add notes
    const notesInput = screen.getByPlaceholderText('Share your thoughts about this oyster...');
    fireEvent.change(notesInput, { target: { value: 'Absolutely delicious!' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Review/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(reviewApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          oysterId: 'oyster-1',
          rating: 'LOVE_IT',
          notes: 'Absolutely delicious!',
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/oysters/oyster-1');
    });
  });

  it('should display error message on submission failure', async () => {
    (oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);
    (reviewApi.create as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Failed to create review' } },
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Love It')).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Review/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create review')).toBeInTheDocument();
    });
  });

  it('should show duplicate modal when user already reviewed', async () => {
    (oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);
    (reviewApi.create as jest.Mock).mockRejectedValue({
      response: { data: { error: 'User has already reviewed this oyster' } },
    });
    (reviewApi.checkExisting as jest.Mock).mockResolvedValue({
      id: 'existing-review-1',
      rating: 'LIKE_IT',
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Love It')).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Review/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Already Reviewed?')).toBeInTheDocument();
      expect(screen.getByText(/You have already reviewed this oyster/i)).toBeInTheDocument();
    });
  });

  it('should show loading spinner while loading oyster', () => {
    (oysterApi.getById as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<ReviewPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading review form...')).toBeInTheDocument();
  });

  it('should show not found message when oyster does not exist', async () => {
    (oysterApi.getById as jest.Mock).mockResolvedValue(null);

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Oyster not found.')).toBeInTheDocument();
    });
  });

  it('should load existing review in edit mode', async () => {
    const mockReview = {
      id: 'review-1',
      rating: 'LOVE_IT',
      notes: 'Great oyster!',
      size: 7,
      body: 8,
      sweetBrininess: 6,
      flavorfulness: 9,
      creaminess: 5,
    };

    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue('review-1'),
    });
    (oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);
    (reviewApi.checkExisting as jest.Mock).mockResolvedValue(mockReview);

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Update Test Oyster')).toBeInTheDocument();
      expect(screen.getByText('Update your experience with this oyster')).toBeInTheDocument();
    });

    // Check that notes are pre-populated
    const notesInput = screen.getByPlaceholderText('Share your thoughts about this oyster...') as HTMLTextAreaElement;
    expect(notesInput.value).toBe('Great oyster!');
  });

  it('should update existing review when in edit mode', async () => {
    const mockReview = {
      id: 'review-1',
      rating: 'LOVE_IT',
      notes: 'Great oyster!',
      size: 7,
      body: 8,
      sweetBrininess: 6,
      flavorfulness: 9,
      creaminess: 5,
    };

    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue('review-1'),
    });
    (oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);
    (reviewApi.checkExisting as jest.Mock).mockResolvedValue(mockReview);
    (reviewApi.update as jest.Mock).mockResolvedValue({ id: 'review-1' });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Update Test Oyster')).toBeInTheDocument();
    });

    // Change notes
    const notesInput = screen.getByPlaceholderText('Share your thoughts about this oyster...');
    fireEvent.change(notesInput, { target: { value: 'Updated notes!' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Update Review/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(reviewApi.update).toHaveBeenCalledWith(
        'review-1',
        expect.objectContaining({
          rating: 'LOVE_IT',
          notes: 'Updated notes!',
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/oysters/oyster-1');
    });
  });

  it('should allow canceling and go back', async () => {
    (oysterApi.getById as jest.Mock).mockResolvedValue(mockOyster);

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Love It')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockBack).toHaveBeenCalled();
  });
});
