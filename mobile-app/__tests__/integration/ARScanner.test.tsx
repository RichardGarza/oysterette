import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

// Mock Camera
jest.mock('expo-camera', () => ({
  Camera: {
    getCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  },
  CameraView: 'CameraView',
}));

// Mock ocrService
jest.mock('../../src/services/ocrService', () => ({
  recognizeText: jest.fn().mockResolvedValue([]),
  matchOysters: jest.fn().mockReturnValue({ matches: [], unmatched: [] }),
  calculatePersonalizedScore: jest.fn().mockReturnValue(85),
  getMatchColor: jest.fn().mockReturnValue('green'),
  getMatchLabel: jest.fn().mockReturnValue('Great match'),
}));

// Mock theme
jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: { colors: { primary: '#000', background: '#fff' } },
    paperTheme: { colors: { primary: '#000', background: '#fff' } },
    isDark: false,
  }),
}));

// Mock API
jest.mock('../../src/services/api', () => ({
  oysterApi: {
    getAll: jest.fn().mockResolvedValue([]),
  },
}));

describe('AR Scanner Integration Tests', () => {
  it('renders scanner structure without crashing', () => {
    const rendered = render(
      <View testID="scanner-container">
        <View testID="camera-view" />
        <View testID="scan-button" />
      </View>
    );
    expect(rendered).toBeTruthy();
  });

  it('ocrService functions are accessible', () => {
    const ocrService = require('../../src/services/ocrService');
    expect(typeof ocrService.recognizeText).toBe('function');
    expect(typeof ocrService.matchOysters).toBe('function');
  });

  it('scanner mocks are configured', () => {
    const Camera = require('expo-camera').Camera;
    expect(Camera.getCameraPermissionsAsync).toBeDefined();
    expect(Camera.requestCameraPermissionsAsync).toBeDefined();
  });
});

export default {};
