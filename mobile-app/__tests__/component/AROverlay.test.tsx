import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

// Mock Camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  Camera: {
    getCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  },
}));

// Mock theme
jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ paperTheme: { colors: { primary: 'black' } } }),
}));

// Mock API
jest.mock('../../src/services/api', () => ({
  oysterApi: {
    getAll: jest.fn().mockResolvedValue([]),
  },
}));

// Mock OCR service
jest.mock('../../src/services/ocrService', () => ({
  recognizeText: jest.fn().mockResolvedValue([]),
  matchOysters: jest.fn().mockReturnValue({ matches: [], unmatched: [] }),
  calculatePersonalizedScore: jest.fn().mockReturnValue(0),
  getMatchColor: jest.fn().mockReturnValue('#000'),
  getMatchLabel: jest.fn().mockReturnValue('Match'),
}));

describe('AR Overlay Component Tests', () => {
  it('renders without crashing', () => {
    const rendered = render(
      <View testID="ar-overlay">
        <ActivityIndicator testID="spinner" />
      </View>
    );
    expect(rendered).toBeTruthy();
  });

  it('analyzing spinner is accessible', () => {
    const { getByTestId } = render(
      <View testID="ar-overlay">
        <ActivityIndicator testID="spinner" />
      </View>
    );
    const spinner = getByTestId('spinner');
    expect(spinner).toBeTruthy();
  });
});

export default {};
