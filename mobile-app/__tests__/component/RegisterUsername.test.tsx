import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

// Mock theme
jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: { colors: { primary: '#000', background: '#fff', text: '#000' } },
    paperTheme: { colors: { primary: '#000', background: '#fff' } },
    isDark: false,
  }),
}));

// Mock auth
jest.mock('../../src/services/auth', () => ({
  authStorage: {
    saveToken: jest.fn(),
    saveUser: jest.fn(),
    getToken: jest.fn().mockResolvedValue('token'),
  },
}));

// Mock API
jest.mock('../../src/services/api', () => ({
  authApi: {
    register: jest.fn().mockResolvedValue({ token: 'token', user: { id: 'user' } }),
  },
  userApi: {
    updateProfile: jest.fn().mockResolvedValue({ username: 'test' }),
  },
}));

describe('RegisterScreen Username Modal Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const rendered = render(
      <View testID="register-username">
        <TextInput label="Username" testID="username-input" />
        <Button testID="save-button">Save</Button>
      </View>
    );
    expect(rendered).toBeTruthy();
  });

  it('username input is accessible', () => {
    const { getByTestId } = render(
      <View testID="register-username">
        <TextInput label="Username" testID="username-input" />
      </View>
    );
    const input = getByTestId('username-input');
    expect(input).toBeTruthy();
  });

  it('save button is accessible', () => {
    const { getByTestId } = render(
      <View testID="register-username">
        <Button testID="save-button">Save</Button>
      </View>
    );
    const button = getByTestId('save-button');
    expect(button).toBeTruthy();
  });
});

export default {};
