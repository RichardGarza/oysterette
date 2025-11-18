import { render, screen, waitFor } from '@testing-library/react';
import ProfilePage from '../app/profile/page';
import { useAuth } from '../../context/AuthContext';

// Mock router and params
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock API
server.use(
  http.get('https://oysterette-production.up.railway.app/api/users/profile', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: { id: '1', name: 'Test User' },
        stats: { totalReviews: 5, totalFavorites: 3, credibilityScore: 1.2, badgeLevel: 'Trusted' },
      },
    });
  }),
  http.get('https://oysterette-production.up.railway.app/api/users/me/reviews', () => {
    return HttpResponse.json({
      success: true,
      data: { reviews: [{ id: 'r1' }], total: 5 },
    });
  })
);

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Profile Page Unit Test', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: '1' } });
  });

  it('renders profile stats and recent reviews', async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Trusted')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Total reviews
    });

    // Recent reviews section
    expect(screen.getByText('Recent Reviews')).toBeInTheDocument();
    expect(screen.getByText('r1')).toBeInTheDocument(); // Mock review
  });

  it('shows empty state if no reviews', async () => {
    server.use(
      http.get('https://oysterette-production.up.railway.app/api/users/me/reviews', () => {
        return HttpResponse.json({ success: true, data: { reviews: [] } });
      })
    );

    render(<ProfilePage />);

    expect(await screen.findByText('No Reviews Yet')).toBeInTheDocument();
  });
});
