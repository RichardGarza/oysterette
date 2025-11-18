import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import Header from '../components/Header';  // Adjusted path

// Mock the router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock auth and theme hooks - relative from __tests__
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

describe('Header Component', () => {
  beforeEach(() => {
    useRouter.mockReturnValue({
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
    });

    const useAuth = require('../context/AuthContext').useAuth;
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
    });

    const useTheme = require('../context/ThemeContext').useTheme;
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });
  });

  it('renders the logo and navigation links', () => {
    render(<Header />);
    
    // Check logo/image
    const logo = screen.getByAltText('Oysterette');
    expect(logo).toBeInTheDocument();

    // Check Home link
    const homeLink = screen.getByText('Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');

    // Check Browse link
    const browseLink = screen.getByText('Browse');
    expect(browseLink).toBeInTheDocument();
    expect(browseLink).toHaveAttribute('href', '/oysters');

    // Check Login link (unauthenticated)
    const loginLink = screen.getByText('Login');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');

    // Check Sign Up button
    const signUpButton = screen.getByText('Sign Up');
    expect(signUpButton).toBeInTheDocument();
    expect(signUpButton).toHaveAttribute('href', '/register');

    // Check theme toggle button
    const themeButton = screen.getByLabelText('Toggle theme');
    expect(themeButton).toBeInTheDocument();
  });

  it('includes Home button with correct href', () => {
    render(<Header />);

    const homeLink = screen.getByText('Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('shows unauthenticated navigation', () => {
    const useAuth = require('../context/AuthContext').useAuth;
    useAuth.mockReturnValue({ isAuthenticated: false, user: null });
    
    render(<Header />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('shows authenticated navigation', () => {
    const useAuth = require('../context/AuthContext').useAuth;
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: '1', name: 'Test User' } });
    
    render(<Header />);
    
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('shows moon icon for light theme', () => {
    const useTheme = require('../context/ThemeContext').useTheme;
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });

    render(<Header />);
    const themeButton = screen.getByLabelText('Toggle theme');
    expect(themeButton).toHaveTextContent('🌙');  // Moon for light theme
  });

  it('shows sun icon for dark theme', () => {
    const useTheme = require('../context/ThemeContext').useTheme;
    useTheme.mockReturnValue({
      theme: 'dark',
      toggleTheme: jest.fn(),
    });

    render(<Header />);
    const themeButton = screen.getByLabelText('Toggle theme');
    expect(themeButton).toHaveTextContent('☀️');  // Sun for dark theme
  });
});
