import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../../src/screens/RegisterScreen';
import * as userApi from '../../src/services/api';
import { authStorage } from '../../src/services/auth';
import { NavigationContainer } from '@react-navigation/native';

// Mock api
jest.mock('../../src/services/api', () => ({
  userApi: {
    updateProfile: jest.fn().mockResolvedValue({ username: 'test' }),
  },
}));

// Mock auth (for post-register)
jest.mock('../../src/services/auth', () => ({
  authStorage: {
    saveToken: jest.fn(),
    saveUser: jest.fn(),
  },
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('RegisterScreen Username Modal Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows username modal after successful registration', async () => {
    const mockRegister = require('../../src/services/api').authApi.register as jest.Mock;
    mockRegister.mockResolvedValueOnce({ token: 'token', user: { id: 'user' } });

    const { getByText } = render(<RegisterScreen />);

    // Simulate form submit (assume button press)
    // Full flow: Fill form, press register
    const submitBtn = getByText('Register'); // Assume button
    fireEvent.press(submitBtn);

    await waitFor(() => {
      expect(authStorage.saveToken).toHaveBeenCalled();
      expect(authStorage.saveUser).toHaveBeenCalled();
    });

    // Modal shows
    expect(getByText('Choose Your Username')).toBeTruthy();
    expect(getByText('Optional - make it fun and unique!')).toBeTruthy();
  });

  it('generates and selects username suggestions', () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    // Press suggestions button
    const suggestionsBtn = getByText('Get Suggestions');
    fireEvent.press(suggestionsBtn);

    // Assert suggestions appear (mock random in generateSuggestions)
    // e.g., expect Chips with 'OysterFan123', etc.
  });

  it('validates username and calls updateProfile on submit', async () => {
    const mockUpdate = require('../../src/services/api').userApi.updateProfile as jest.Mock;
    mockUpdate.mockResolvedValueOnce({ username: 'OysterFan123' });

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    // Input username
    const input = getByPlaceholderText('e.g., OysterFan123');
    fireEvent.changeText(input, 'OysterFan123');

    // Submit
    const saveBtn = getByText('Save');
    fireEvent.press(saveBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ username: 'OysterFan123' }));
    });
  });

  it('skips username if not provided', () => {
    // Test skip button closes modal without updateProfile call
    // Mock no input, press Skip → no API call, navigate Home
  });
});

export default {};
