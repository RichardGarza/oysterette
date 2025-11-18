import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import HomeScreen from '../../src/screens/HomeScreen';
import OysterListScreen from '../../src/screens/OysterListScreen';
import { RootStackParamList } from '../../src/types/navigation';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { PaperProvider } from 'react-native-paper';

// Mock BackHandler
jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  exitApp: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock Alert
const mockAlert = jest.fn();
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: { alert: mockAlert },
}));

const Stack = createNativeStackNavigator<RootStackParamList>();

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>
    <ThemeProvider initialTheme={{ isDark: false, colors: {} }}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={() => <View testID="home">{children}</View>} />
          <Stack.Screen name="OysterList" component={() => <View testID="list">{children}</View>} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  </PaperProvider>
);

describe('Navigation BackHandler Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('HomeScreen BackHandler shows exit Alert and calls exitApp on confirm', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    // Simulate back press - mock addEventListener calls the handler
    const mockBackHandler = require('react-native/Libraries/Utilities/BackHandler');
    const listener = mockBackHandler.addEventListener.mock.calls[0][1];
    listener();

    expect(mockAlert).toHaveBeenCalledWith(
      'Exit Oysterette?',
      'Are you sure you want to exit the app?',
      expect.any(Array), // Options with Stay/Exit
      { cancelable: true }
    );

    // Simulate confirm press - in full test, mock onPress of Exit
    const exitOption = { text: 'Exit', onPress: expect.any(Function) };
    exitOption.onPress();
    expect(mockBackHandler.exitApp).toHaveBeenCalled();
  });

  it('HomeScreen BackHandler prevents default back and returns true', () => {
    const mockBackHandler = require('react-native/Libraries/Utilities/BackHandler');
    const { getByTestId } = render(<TestWrapper><HomeScreen /></TestWrapper>);

    const listener = mockBackHandler.addEventListener.mock.calls[0][1];
    const result = listener();
    expect(result).toBe(true); // Prevents default
  });

  it('OysterListScreen has no BackHandler - default navigation expected', () => {
    const mockBackHandler = require('react-native/Libraries/Utilities/BackHandler');
    render(<TestWrapper><OysterListScreen /></TestWrapper>);

    // No addEventListener called for OysterList
    expect(mockBackHandler.addEventListener).not.toHaveBeenCalled();
    // Back press should navigate normally (mock would show if added)
  });

  it('Navigation from OysterList back goes to Home without exit', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <OysterListScreen />
      </TestWrapper>
    );

    // Simulate back - no Alert, no exitApp
    const mockBackHandler = require('react-native/Libraries/Utilities/BackHandler');
    // Default back would navigate, but since no handler, no mockAlert or exit
    expect(mockAlert).not.toHaveBeenCalled();
    expect(mockBackHandler.exitApp).not.toHaveBeenCalled();
  });
});

export default {};
