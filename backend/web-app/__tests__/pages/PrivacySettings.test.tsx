/**
 * Privacy Settings Page Tests
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import PrivacySettingsPage from '../../app/privacy-settings/page';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  userApi: {
    updatePrivacySettings: jest.fn(),
  },
}));

jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

describe('Privacy Settings Page', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
    });
  });

  it('should redirect to login if not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });

    render(<PrivacySettingsPage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should display privacy settings page with all options', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });

    render(<PrivacySettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
      expect(screen.getByText('Profile Visibility')).toBeInTheDocument();
      expect(screen.getByText('Show Review History')).toBeInTheDocument();
      expect(screen.getByText('Show Favorites')).toBeInTheDocument();
      expect(screen.getByText('Show Statistics')).toBeInTheDocument();
    });
  });

  it('should have profile visibility dropdown with options', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });

    render(<PrivacySettingsPage />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Public');
    expect(options[1]).toHaveTextContent('Friends Only');
    expect(options[2]).toHaveTextContent('Private');
  });

  it('should have toggle switches for privacy options', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });

    render(<PrivacySettingsPage />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
    // All should be checked by default
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  it('should call updatePrivacySettings when save button is clicked', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (userApi.updatePrivacySettings as jest.Mock).mockResolvedValue({});

    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<PrivacySettingsPage />);

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(userApi.updatePrivacySettings).toHaveBeenCalledWith({
        profileVisibility: 'public',
        showReviewHistory: true,
        showFavorites: true,
        showStatistics: true,
      });
    });

    alertSpy.mockRestore();
  });

  it('should update state when toggle is clicked', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });

    render(<PrivacySettingsPage />);

    const checkboxes = screen.getAllByRole('checkbox');
    const showFavoritesCheckbox = checkboxes[1]; // Second checkbox is showFavorites

    fireEvent.click(showFavoritesCheckbox);

    expect(showFavoritesCheckbox).not.toBeChecked();
  });
});
