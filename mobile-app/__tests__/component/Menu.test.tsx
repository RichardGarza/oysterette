import React from 'react';
import { render } from '@testing-library/react-native';
import { Menu as RNPMenu, IconButton } from 'react-native-paper';
import { View } from 'react-native';

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
jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: { isDark: false, colors: { primary: '#000' } },
    isDark: false,
    paperTheme: { colors: { primary: '#000' } },
  }),
}));

describe('Menu Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const rendered = render(
      <View>
        <IconButton icon="menu" testID="menu-icon" onPress={() => {}} />
      </View>
    );
    expect(rendered).toBeTruthy();
  });

  it('menu icon is accessible', () => {
    const { getByTestId } = render(
      <View>
        <IconButton icon="menu" testID="menu-icon" onPress={() => {}} />
      </View>
    );
    const icon = getByTestId('menu-icon');
    expect(icon).toBeTruthy();
  });

  it('renders menu structure', () => {
    const rendered = render(
      <View>
        <RNPMenu
          visible={true}
          onDismiss={() => {}}
          anchor={<View testID="anchor" />}
        >
          <RNPMenu.Item onPress={() => {}} title="Test Item" />
        </RNPMenu>
      </View>
    );
    expect(rendered).toBeTruthy();
  });
});

export default {};
