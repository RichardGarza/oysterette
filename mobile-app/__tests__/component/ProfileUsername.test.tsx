import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../../src/screens/ProfileScreen';
import * as userApi from '../../src/services/api';

// Mock api
jest.mock('../../src/services/api', () => ({
  userApi: {
    updateProfile: jest.fn().mockResolvedValue({ username: 'test' }),
    getProfile: jest.fn().mockResolvedValue({ name: 'Test User', username: null }), // No username
  },
}));

describe('ProfileScreen Username Tests', () => {
  it('renders username input empty if not set', () => {
    const { getByLabelText } = render(<ProfileScreen />);

    const usernameInput = getByLabelText('Username (optional)');
    expect(usernameInput.props.value).toBe('');
  });

  it('updates and saves username', async () => {
    const mockUpdate = require('../../src/services/api').userApi.updateProfile as jest.Mock;
    mockUpdate.mockResolvedValueOnce({ id: 'user', username: 'OysterFan123' });

    const { getByLabelText, getByText } = render(<ProfileScreen />);

    const input = getByLabelText('Username (optional)');
    fireEvent.changeText(input, 'OysterFan123');

    const saveBtn = getByText('Save'); // Assume save button
    fireEvent.press(saveBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ username: 'OysterFan123' }));
    });
  });

  it('displays username if set, falls back to name if empty', () => {
    const mockGet = require('../../src/services/api').userApi.getProfile as jest.Mock;
    mockGet.mockResolvedValueOnce({ name: 'Test User', username: 'OysterFan123' });

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('OysterFan123')).toBeTruthy(); // Displays username
  });

  it('displays name if username empty', () => {
    const mockGet = require('../../src/services/api').userApi.getProfile as jest.Mock;
    mockGet.mockResolvedValueOnce({ name: 'Test User', username: null });

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Test User')).toBeTruthy(); // Fallback to name
  });
});

export default {};
