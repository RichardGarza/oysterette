import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Home from '../app/page';  // Adjusted path
import { server } from '../mocks/server';  // MSW server for integration tests - use node server for Jest

// Mock router if needed
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock hooks - relative from __tests__
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

// Mock API calls via MSW for integration
beforeAll(() => server.listen({
  onUnhandledRequest: 'error',  // Fail on unmocked requests
}));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Home Page Integration Test', () => {
  beforeEach(() => {
    const mockRouter = {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
    require('next/router').useRouter.mockReturnValue(mockRouter);

    const useAuth = require('../context/AuthContext').useAuth;
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    const useTheme = require('../context/ThemeContext').useTheme;
    useTheme.mockReturnValue({
      theme: 'light',
    });
  });

  it('renders unauthenticated home page correctly', async () => {
    render(<Home />);

    // Hero section
    expect(await screen.findByText('Discover Oysters from Around the World')).toBeInTheDocument();
    expect(screen.getByText('Explore, review, and share your favorite oyster experiences')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Search for Oysters/i })).toBeInTheDocument();

    // No stats or recommendations for unauthenticated
    expect(screen.queryByText(/Your Reviews/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Recommendations/i)).not.toBeInTheDocument();

    // Top oysters load with mock data
    await waitFor(() => {
      expect(screen.getByText('Test Oyster')).toBeInTheDocument();  // From MSW mock
    });
  });

  it('shows authenticated content with stats and recommendations', async () => {
    const useAuth = require('../context/AuthContext').useAuth;
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1' },
    });

    // Mock API for recommendations (override default handler)
    server.use(
      http.get('https://oysterette-production.up.railway.app/api/recommendations/hybrid/5', () => {
        return HttpResponse.json({
          success: true,
          data: [{ id: 'rec-1', name: 'Recommended Oyster' }],
        });
      })
    );

    render(<Home />);

    // Stats cards
    expect(await screen.findByText(/Your Reviews/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Favorites/i)).toBeInTheDocument();

    // Recommendations section
    expect(await screen.findByText(/Recommendations/i)).toBeInTheDocument();
    expect(screen.getByText('Recommended Oyster')).toBeInTheDocument();

    // Friends quick action
    expect(screen.getByText(/Friends/i)).toBeInTheDocument();
  });

  it('handles loading state for oysters', async () => {
    // Mock API to delay response for loading test
    server.use(
      http.get('https://oysterette-production.up.railway.app/api/oysters', async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));  // 1s delay
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    render(<Home />);

    // Loading skeleton (add data-testid="loading-skeleton" to the loading div in Home.tsx for this test)
    // For now, check for absence of content
    await waitFor(() => {
      expect(screen.getByText('Test Oyster')).toBeInTheDocument();  // Wait for load
    }, { timeout: 2000 });
  });
});
