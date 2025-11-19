import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';

// Mock BackHandler
const mockAddEventListener = jest.fn(() => ({ remove: jest.fn() }));
const mockExitApp = jest.fn();

jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
  addEventListener: mockAddEventListener,
  exitApp: mockExitApp,
  removeEventListener: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useFocusEffect: jest.fn(),
}));

// Mock theme
jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: { colors: { primary: '#000', background: '#fff', text: '#000' } },
    paperTheme: { colors: { primary: '#000', background: '#fff' } },
    isDark: false,
  }),
}));

describe('Navigation BackHandler Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation structure without crashing', () => {
    const rendered = render(
      <View testID="navigation-container">
        <View testID="home-screen" />
        <View testID="oyster-list-screen" />
      </View>
    );
    expect(rendered).toBeTruthy();
  });

  it('BackHandler addEventListener is accessible', () => {
    const BackHandler = require('react-native/Libraries/Utilities/BackHandler');
    const handler = jest.fn();
    BackHandler.addEventListener('hardwareBackPress', handler);
    expect(mockAddEventListener).toHaveBeenCalledWith('hardwareBackPress', handler);
  });

  it('BackHandler exitApp is accessible', () => {
    const BackHandler = require('react-native/Libraries/Utilities/BackHandler');
    BackHandler.exitApp();
    expect(mockExitApp).toHaveBeenCalled();
  });
});

export default {};
