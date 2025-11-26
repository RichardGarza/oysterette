/**
 * Register Page Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import RegisterPage from '../../app/register/page';
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
  default: ({ text }: { text?: string }) => (
    <button data-testid="google-signin">{text || 'Sign in with Google'}</button>
  ),
}));

describe('Register Page', () => {
  const mockPush = jest.fn();
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      user: null,
    });
  });

  it('should render registration form with all fields', () => {
    render(<RegisterPage />);

    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByText('Create an account to start reviewing oysters!')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/)).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByTestId('google-signin')).toBeInTheDocument();
    expect(screen.getByText(/Already have an account/)).toBeInTheDocument();
  });

  it('should handle successful registration and redirect', async () => {
    mockRegister.mockResolvedValue({ token: 'test-token' });

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText(/^Password$/);
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'Test User', 'Password123');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should show error when passwords do not match', async () => {
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText(/^Password$/);
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should show error when password is too short', async () => {
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText(/^Password$/);
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should display error message on registration failure', async () => {
    mockRegister.mockRejectedValue({
      response: { data: { error: 'Email already exists' } },
    });

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText(/^Password$/);
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
