/**
 * Settings Page Tests
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import SettingsPage from '../../app/settings/page';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { userApi } from '../../lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  userApi: {
    changePassword: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));

jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

describe('Settings Page', () => {
  const mockPush = jest.fn();
  const mockLogout = jest.fn();
  const mockToggleTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
    });
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
    });
  });

  it('should redirect to login if not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
    });

    render(<SettingsPage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should display settings page with all sections', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1', email: 'test@example.com' },
      logout: mockLogout,
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Change Password')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });
  });

  it('should toggle theme when appearance button is clicked', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1' },
      logout: mockLogout,
    });

    render(<SettingsPage />);

    const themeButton = screen.getByRole('button', { name: /dark/i });
    fireEvent.click(themeButton);

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('should call logout when logout button is clicked', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1' },
      logout: mockLogout,
    });

    render(<SettingsPage />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should show change password modal when button is clicked', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1' },
      logout: mockLogout,
    });

    render(<SettingsPage />);

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByText('Current Password')).toBeInTheDocument();
      expect(screen.getByText('New Password')).toBeInTheDocument();
      expect(screen.getByText('Confirm New Password')).toBeInTheDocument();
    });
  });

  it('should display version info in About section', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1' },
      logout: mockLogout,
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/version:/i)).toBeInTheDocument();
      expect(screen.getByText('2.0.0')).toBeInTheDocument();
      expect(screen.getByText(/platform:/i)).toBeInTheDocument();
      expect(screen.getByText('Web')).toBeInTheDocument();
    });
  });
});
