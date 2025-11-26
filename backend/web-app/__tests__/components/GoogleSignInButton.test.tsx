/**
 * GoogleSignInButton Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import { useAuth } from '../../context/AuthContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('GoogleSignInButton', () => {
  const mockPush = jest.fn();
  const mockGoogleLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    });
    (useAuth as jest.Mock).mockReturnValue({
      googleLogin: mockGoogleLogin,
    });

    // Mock environment variable
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id';
  });

  it('should render button with default text', () => {
    render(<GoogleSignInButton />);

    expect(screen.getByRole('button', { name: /Log in with Google/i })).toBeInTheDocument();
  });

  it('should render button with custom text', () => {
    render(<GoogleSignInButton text="Sign up with Google" />);

    expect(screen.getByRole('button', { name: /Sign up with Google/i })).toBeInTheDocument();
  });

  it('should show error when Google Client ID is not configured', () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    render(<GoogleSignInButton />);

    expect(screen.getByText(/Google Client ID not configured/i)).toBeInTheDocument();
  });
});
