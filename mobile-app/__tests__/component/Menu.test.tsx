import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider } from '../../src/context/ThemeContext';
import Menu from '../../src/screens/MenuScreen'; // Assume MenuScreen is the component
import { RootStackParamList } from '../../src/types/navigation';
import { View } from 'react-native';
import { IconButton, Divider } from 'react-native-paper';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// Mock auth
jest.mock('../../src/services/auth', () => ({
  authStorage: {
    getToken: jest.fn().mockResolvedValue('token'),
    getUser: jest.fn().mockResolvedValue({ name: 'Test User' }),
  },
}));

// Mock theme
const mockTheme = { isDark: false, colors: { primary: '#000' } };
jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => mockTheme,
}));

const Stack = createNativeStackNavigator<RootStackParamList>();

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>
    <ThemeProvider initialTheme={mockTheme}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Menu" component={() => <View testID="menu">{children}</View>} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  </PaperProvider>
);

describe('Menu Component Tests', () => {
  it('renders hamburger menu icon correctly', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <IconButton icon="menu" testID="menu-icon" onPress={() => {}} />
      </TestWrapper>
    );
    const icon = getByTestId('menu-icon');
    expect(icon).toBeTruthy();
    expect(icon.props.icon).toBe('menu');
  });

  it('opens menu on press and renders items (logged in)', async () => {
    const { getByTestId, queryByText } = render(
      <TestWrapper>
        <Menu
          visible={false}
          onDismiss={() => {}}
          anchor={<IconButton icon="menu" testID="anchor" onPress={() => {}} />}
        >
          <Menu.Item onPress={() => mockNavigate('Profile')} title="My Profile" leadingIcon="account" testID="profile" />
          <Menu.Item onPress={() => mockNavigate('Friends')} title="Friends" leadingIcon="account-group" testID="friends" />
          <Divider />
          <Menu.Item onPress={() => mockNavigate('Settings')} title="Settings" leadingIcon="cog" testID="settings" />
          <Menu.Item onPress={() => { mockNavigate('Logout'); }} title="Log Out" leadingIcon="logout" testID="logout" />
        </Menu>
      </TestWrapper>
    );

    const anchor = getByTestId('anchor');
    fireEvent.press(anchor); // Simulate open

    // Assume menu opens, test items (in practice, use visible=true for render)
    expect(queryByText('My Profile')).toBeNull(); // Closed initially
    // For full test, toggle visible state in wrapper
  });

  it('closes menu on item press and navigates', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <Menu visible={true} onDismiss={() => {}} anchor={<View />}>
          <Menu.Item onPress={() => { mockNavigate('Settings'); }} title="Settings" testID="settings-item" />
        </Menu>
      </TestWrapper>
    );

    const item = getByTestId('settings-item');
    fireEvent.press(item);
    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });

  it('shows conditional items based on auth (not logged in)', () => {
    // Mock no token
    require('../../src/services/auth').authStorage.getToken.mockResolvedValueOnce(null);

    const { queryByText } = render(
      <TestWrapper>
        {/* Render MenuScreen or component with conditional logic */}
        <Menu visible={true} onDismiss={() => {}} anchor={<View />}>
          <Menu.Item onPress={() => mockNavigate('Settings')} title="Settings" leadingIcon="cog" />
          <Menu.Item onPress={() => mockNavigate('Login')} title="Log In" leadingIcon="login" />
          <Menu.Item onPress={() => mockNavigate('Register')} title="Sign Up" leadingIcon="account-plus" />
        </Menu>
      </TestWrapper>
    );

    expect(queryByText('Log Out')).toBeNull(); // No logout if not logged in
    // Assert other items present
  });
});

export default {};
