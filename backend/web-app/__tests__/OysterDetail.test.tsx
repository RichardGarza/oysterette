import { render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import OysterDetailPage from '../app/oysters/[id]/page';
import { useAuth } from '../../context/AuthContext';

// Mock params
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock API via MSW (assume setup)
server.use(
  http.get('https://oysterette-production.up.railway.app/api/oysters/:id', () => {
    return HttpResponse.json({
      success: true,
      data: { id: 'test-id', name: 'Test Oyster', overallScore: 8.5 },
    });
  }),
  http.get('https://oysterette-production.up.railway.app/api/reviews/oyster/test-id', () => {
    return HttpResponse.json({
      success: true,
      data: [{ id: 'r1', rating: 'LIKE_IT', user: { id: 'user1' } }],
    });
  })
);

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Oyster Detail Integration Test', () => {
  beforeEach(() => {
    useParams.mockReturnValue({ id: 'test-id' });
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'user1' } });
  });

  it('renders oyster details and reviews', async () => {
    render(<OysterDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Oyster')).toBeInTheDocument();
      expect(screen.getByText('8.5')).toBeInTheDocument(); // Overall score
    });

    // Reviews section
    expect(screen.getByText('Reviews (1)')).toBeInTheDocument();
    expect(screen.getByText('Like It')).toBeInTheDocument();
  });

  it('shows write review button if authenticated', async () => {
    render(<OysterDetailPage />);

    const writeReviewLink = screen.getByRole('link', { name: /Write Review/ });
    expect(writeReviewLink).toHaveAttribute('href', '/oysters/test-id/review');
  });

  it('shows favorite button and toggles state', async () => {
    render(<OysterDetailPage />);

    const favoriteButton = screen.getByText(/Favorite/);
    fireEvent.click(favoriteButton);

    expect(favoriteButton).toHaveTextContent('❤️ Favorited');
  });
});
