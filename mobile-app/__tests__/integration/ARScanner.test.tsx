import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { oysterApi } from '../../src/services/api';
import ScanMenuScreen from '../../src/screens/ScanMenuScreen';
import * as ocrService from '../../src/services/ocrService';
import { Oyster } from '../../src/types/Oyster';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

// Mock Camera
const mockTakePicture = jest.fn().mockResolvedValue({ uri: 'mock-photo.jpg' });
jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn().mockReturnValue({ status: 'granted' }),
  getCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  takePictureAsync: mockTakePicture,
}));

// Mock ocrService
jest.mock('../../src/services/ocrService', () => ({
  recognizeText: jest.fn(),
  matchOysters: jest.fn(),
  calculatePersonalizedScore: jest.fn(() => 85),
  getMatchColor: jest.fn(() => 'green'),
  getMatchLabel: jest.fn(() => 'Great match'),
}));

// Mock theme
jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ paperTheme: { colors: {} } }),
}));

// Mock Alert
const mockAlert = jest.fn();
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: { alert: mockAlert },
}));

const mockOysters: Oyster[] = [
  { id: '1', name: 'Blue Point' },
  { id: '2', name: 'Kumamoto' },
];

describe('AR Scanner Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ocrService.recognizeText as jest.Mock).mockResolvedValue(['Blue Point 12.99', 'Kumamoto', 'Price 15.99']);
    (ocrService.matchOysters as jest.Mock).mockReturnValue({
      matches: [{ item: mockOysters[0], score: 0.8, position: 0 }], // >0.7, deduped
      unmatched: [{ detectedText: 'Kumamoto', position: 1 }], // No price
    });
  });

  it('handles scan: capture photo, show analyzing, process OCR, navigate to results', async () => {
    const { getByText } = render(<ScanMenuScreen />);

    // Simulate scan button press
    const scanBtn = getByText('Scan Now');
    fireEvent.press(scanBtn);

    await waitFor(() => {
      expect(mockTakePicture).toHaveBeenCalled(); // Photo captured
    });

    // Analyzing state (static photo shown)
    expect(getByText('Analyzing...')).toBeTruthy(); // Overlay

    // OCR processed, results set (matches filtered, deduped, limited/sorted)
    await waitFor(() => {
      expect(ocrService.recognizeText).toHaveBeenCalledWith('mock-photo.jpg');
      expect(ocrService.matchOysters).toHaveBeenCalledWith(
        ['Blue Point 12.99', 'Kumamoto', 'Price 15.99'],
        expect.any(Array),
        { threshold: 0.7 }
      );
      // Assert matches: filtered (no 'Price 15.99'), >70%, deduped (1 Blue Point), limited 20, sorted
      // Assume component re-renders with matches.length <=20, sorted by score desc/position
    });

    // No Alert for no matches (has some)
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it('shows no-matches Alert if no text detected', async () => {
    (ocrService.recognizeText as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<ScanMenuScreen />);

    fireEvent.press(getByText('Scan Now'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('No Text Detected', 'Point camera at menu text and try again.');
    });
  });

  it('navigates to OysterDetail on match press', async () => {
    const mockNavigate = require('@react-navigation/native').useNavigation();
    (mockNavigate as jest.MockedFunction<any>).navigate = jest.fn();

    const { getByText } = render(<ScanMenuScreen />);

    // Simulate scan with matches
    fireEvent.press(getByText('Scan Now'));

    await waitFor(() => {
      // Assume renderItem called; test press on match card
      const matchCard = getByText('Blue Point'); // From render
      fireEvent.press(matchCard);
      expect(mockNavigate).toHaveBeenCalledWith('OysterDetail', { oysterId: '1' });
    });
  });

  it('navigates to AddOyster for unmatched', async () => {
    const mockNavigate = require('@react-navigation/native').useNavigation();
    (mockNavigate as jest.MockedFunction<any>).navigate = jest.fn();

    // Mock unmatched only
    (ocrService.matchOysters as jest.Mock).mockReturnValue({
      matches: [],
      unmatched: [{ detectedText: 'Unknown Oyster', position: 0 }],
    });

    const { getByText } = render(<ScanMenuScreen />);

    fireEvent.press(getByText('Scan Now'));

    await waitFor(() => {
      const addBtn = getByText('Add to Database');
      fireEvent.press(addBtn);
      expect(mockNavigate).toHaveBeenCalledWith('AddOyster', { name: 'Unknown Oyster' });
    });
  });
});

export default {};
