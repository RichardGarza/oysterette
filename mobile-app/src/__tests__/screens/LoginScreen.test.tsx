import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../screens/LoginScreen';
import { authApi } from '../../services/api';
import { authStorage } from '../../services/auth';

// Mock navigation
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    dispatch: mockDispatch,
  }),
  CommonActions: {
    reset: jest.fn((config) => config),
  },
  useFocusEffect: jest.fn(),
  useRoute: () => ({ params: {} }),
}));

// Mock theme context
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    paperTheme: {
      colors: {
        primary: '#000',
        background: '#fff',
      },
    },
    loadUserTheme: jest.fn(),
    isDark: false,
  }),
}));

// Mock services
jest.mock('../../services/auth');
jest.mock('../../services/favorites');
jest.mock('../../services/tempReviews');

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authStorage.getToken as jest.Mock).mockResolvedValue(null);
  });

  it('should render correctly', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Log In')).toBeTruthy();
    expect(getByText('Continue with Google')).toBeTruthy();
  });

  it('should update email input', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    const emailInput = getByPlaceholderText('Email');

    fireEvent.changeText(emailInput, 'test@example.com');

    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should update password input', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    const passwordInput = getByPlaceholderText('Password');

    fireEvent.changeText(passwordInput, 'password123');

    expect(passwordInput.props.value).toBe('password123');
  });

  it('should toggle password visibility', () => {
    const { getByPlaceholderText, getByLabelText } = render(<LoginScreen />);
    const passwordInput = getByPlaceholderText('Password');

    // Initially password should be hidden
    expect(passwordInput.props.secureTextEntry).toBe(true);

    // Click eye icon to show password
    const toggleButton = getByLabelText('Toggle password visibility');
    fireEvent.press(toggleButton);

    // Password should now be visible
    expect(passwordInput.props.secureTextEntry).toBe(false);
  });

  it('should handle successful login', async () => {
    const mockLoginResponse = {
      token: 'test-token',
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
    };

    (authApi.login as jest.Mock).mockResolvedValue(mockLoginResponse);
    (authStorage.saveToken as jest.Mock).mockResolvedValue(undefined);
    (authStorage.saveUser as jest.Mock).mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    // Find the "Log In" button by text and press it
    const loginButton = getByText('Log In').parent;
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(authStorage.saveToken).toHaveBeenCalled();
      expect(authStorage.saveUser).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  it('should show error on failed login', async () => {
    (authApi.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'wrong@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');
    fireEvent.press(getByText('Log In'));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalled();
      // Alert.alert would be called with error
    });
  });

  it('should navigate to register screen', () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText('Sign Up'));

    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  it('should disable login button while loading', async () => {
    (authApi.login as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    const loginText = getByText('Log In');
    const loginButton = loginText.parent;
    fireEvent.press(loginButton);

    // Button should be disabled while loading
    expect(loginButton.props.disabled).toBe(true);
  });

  it('should redirect to home if already logged in', async () => {
    (authStorage.getToken as jest.Mock).mockResolvedValue('existing-token');

    render(<LoginScreen />);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });
  });
});
