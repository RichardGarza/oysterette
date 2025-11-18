import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../app/login/page';
import { useRouter } from 'next/router';

// Mock router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock API
jest.mock('../lib/api', () => ({
  authApi: {
    login: jest.fn(),
  },
}));

describe('Login Page Unit Test', () => {
  const mockLogin = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    require('next/router').useRouter.mockReturnValue({ push: mockPush });
    require('../lib/api').authApi.login = mockLogin;
  });

  it('renders login form correctly', () => {
    render(<LoginPage />);

    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account? Sign up/i)).toBeInTheDocument();
  });

  it('submits form and navigates on success', async () => {
    mockLogin.mockResolvedValue({ token: 'fake-token', user: { id: '1' } });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
      expect(mockPush).toHaveBeenCalledWith('/', undefined, { scroll: true });
    });
  });

  it('shows error on failed login', async () => {
    mockLogin.mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
