/**
 * Login Page Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '../../app/login/page';
import { useAuth } from '../../context/AuthContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock components
jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../components/GoogleSignInButton', () => ({
  __esModule: true,
  default: () => <button data-testid="google-signin">Sign in with Google</button>,
}));

describe('Login Page', () => {
  const mockPush = jest.fn();
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      user: null,
    });
  });

  it('should render login form with all fields', () => {
    render(<LoginPage />);

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Welcome back! Log in to continue.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    expect(screen.getByTestId('google-signin')).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account/)).toBeInTheDocument();
  });

  it('should handle successful login and redirect', async () => {
    mockLogin.mockResolvedValue({ token: 'test-token' });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Log In' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should display error message on login failure', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Log In' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should display generic error when no error message provided', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Log In' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    mockLogin.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Log In' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: 'Logging in...' })).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    });
  });
});
