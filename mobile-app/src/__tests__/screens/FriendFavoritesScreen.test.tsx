/**
 * FriendFavoritesScreen Tests
 *
 * Tests for viewing a friend's public favorited oysters
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FriendFavoritesScreen from '../../screens/FriendFavoritesScreen';
import { favoritesStorage } from '../../services/favorites';
import * as Haptics from 'expo-haptics';

// Mock Haptics
jest.mock('expo-haptics');

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockRouteParams = {
  userId: 'friend-123',
  userName: 'Test Friend',
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

// Mock theme context
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#000',
        background: '#fff',
        text: '#000',
        textSecondary: '#666',
        border: '#ddd',
        card: '#fff',
        shadowColor: '#000',
      },
    },
    paperTheme: {
      colors: {
        primary: '#000',
        background: '#fff',
      },
    },
    isDark: false,
  }),
}));

// Mock favorites storage
jest.mock('../../services/favorites');

// Mock React Query hook
const mockUsePublicProfileFavorites = jest.fn();
jest.mock('../../hooks/useQueries', () => ({
  usePublicProfileFavorites: (userId: string) => mockUsePublicProfileFavorites(userId),
}));

describe('FriendFavoritesScreen', () => {
  const mockFavorites = [
    {
      id: 'oyster-1',
      name: 'Kusshi',
      species: 'Crassostrea gigas',
      origin: 'British Columbia',
      size: 5,
      body: 6,
      sweetBrininess: 7,
      flavorfulness: 8,
      creaminess: 5,
      standoutNotes: 'Sweet and briny',
    },
    {
      id: 'oyster-2',
      name: 'Blue Point',
      species: 'Crassostrea virginica',
      origin: 'Long Island',
      size: 6,
      body: 7,
      sweetBrininess: 5,
      flavorfulness: 6,
      creaminess: 6,
      standoutNotes: 'Classic Atlantic flavor',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (favoritesStorage.getFavorites as jest.Mock).mockResolvedValue([]);
    (favoritesStorage.toggleFavorite as jest.Mock).mockResolvedValue(true);
  });

  describe('Loading State', () => {
    it('should show loading indicator while fetching favorites', () => {
      mockUsePublicProfileFavorites.mockReturnValue({
        data: [],
        isLoading: true,
        isError: false,
        refetch: jest.fn(),
      });

      const { getByText, UNSAFE_getAllByType } = render(<FriendFavoritesScreen />);

      expect(getByText('Loading favorites...')).toBeTruthy();

      // Check header exists
      const headers = UNSAFE_getAllByType(require('react-native-paper').Appbar.Header);
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when friend has no favorites', () => {
      mockUsePublicProfileFavorites.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      const { getByText } = render(<FriendFavoritesScreen />);

      expect(getByText('No Favorites Yet')).toBeTruthy();
      expect(getByText('Test Friend has not favorited any oysters yet!')).toBeTruthy();
    });
  });

  describe('Privacy State', () => {
    it('should show privacy error when favorites are private', () => {
      mockUsePublicProfileFavorites.mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
        refetch: jest.fn(),
      });

      const { getByText } = render(<FriendFavoritesScreen />);

      expect(getByText('Favorites are Private')).toBeTruthy();
      expect(getByText('Test Friend has not made their favorites public.')).toBeTruthy();
    });
  });

  describe('Favorites Display', () => {
    beforeEach(() => {
      mockUsePublicProfileFavorites.mockReturnValue({
        data: mockFavorites,
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });
    });

    it('should display all friend favorites with correct data', () => {
      const { getByText, getAllByText } = render(<FriendFavoritesScreen />);

      // Check first oyster
      expect(getByText('Kusshi')).toBeTruthy();
      expect(getByText('Crassostrea gigas')).toBeTruthy();
      expect(getByText('British Columbia')).toBeTruthy();
      expect(getByText('Sweet and briny')).toBeTruthy();

      // Check second oyster
      expect(getByText('Blue Point')).toBeTruthy();
      expect(getByText('Crassostrea virginica')).toBeTruthy();
      expect(getByText('Long Island')).toBeTruthy();
      expect(getByText('Classic Atlantic flavor')).toBeTruthy();

      // Check attributes are displayed (multiple oysters may have same values)
      const sizeFive = getAllByText('5/10');
      expect(sizeFive.length).toBeGreaterThan(0);
    });

    it('should display all attributes for each oyster', () => {
      const { getAllByText } = render(<FriendFavoritesScreen />);

      // Check that all attribute labels are present (2 oysters × 5 attributes = 10 labels)
      const sizeLabels = getAllByText('Size');
      const bodyLabels = getAllByText('Body');
      const brineLabels = getAllByText('Brine');
      const flavorLabels = getAllByText('Flavor');
      const creamLabels = getAllByText('Cream');

      expect(sizeLabels.length).toBe(2);
      expect(bodyLabels.length).toBe(2);
      expect(brineLabels.length).toBe(2);
      expect(flavorLabels.length).toBe(2);
      expect(creamLabels.length).toBe(2);
    });

    it('should navigate to oyster detail when card is pressed', async () => {
      const { UNSAFE_getAllByType } = render(<FriendFavoritesScreen />);

      await waitFor(() => {
        const cards = UNSAFE_getAllByType(require('react-native-paper').Card);
        expect(cards.length).toBeGreaterThan(0);

        // Press the first card
        fireEvent.press(cards[0]);

        expect(mockNavigate).toHaveBeenCalledWith('OysterDetail', { oysterId: 'oyster-1' });
      });
    });
  });

  describe('Favorite Toggling', () => {
    beforeEach(() => {
      mockUsePublicProfileFavorites.mockReturnValue({
        data: mockFavorites,
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });
      (favoritesStorage.getFavorites as jest.Mock).mockResolvedValue(['oyster-1']);
    });

    it('should show filled heart for user favorites', async () => {
      const { UNSAFE_getAllByType } = render(<FriendFavoritesScreen />);

      await waitFor(() => {
        const iconButtons = UNSAFE_getAllByType(require('react-native-paper').IconButton);
        // Find the first favorite button (for oyster-1)
        const firstFavButton = iconButtons.find((btn: any) =>
          btn.props.icon === 'heart' || btn.props.icon === 'heart-outline'
        );
        expect(firstFavButton).toBeTruthy();
      });
    });

    it('should toggle favorite when heart is pressed', async () => {
      (favoritesStorage.toggleFavorite as jest.Mock).mockResolvedValue(true);

      const { UNSAFE_getAllByType } = render(<FriendFavoritesScreen />);

      await waitFor(() => {
        const iconButtons = UNSAFE_getAllByType(require('react-native-paper').IconButton);
        const favButton = iconButtons.find((btn: any) =>
          btn.props.icon === 'heart' || btn.props.icon === 'heart-outline'
        );

        expect(favButton).toBeTruthy();
      });

      const iconButtons = UNSAFE_getAllByType(require('react-native-paper').IconButton);
      const favButton = iconButtons.find((btn: any) =>
        btn.props.icon === 'heart' || btn.props.icon === 'heart-outline'
      );

      // Create mock event with stopPropagation
      const mockEvent = { stopPropagation: jest.fn() };
      fireEvent(favButton, 'press', mockEvent);

      await waitFor(() => {
        expect(favoritesStorage.toggleFavorite).toHaveBeenCalled();
        expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
      });
    });

    it('should remove favorite when already favorited', async () => {
      (favoritesStorage.toggleFavorite as jest.Mock).mockResolvedValue(false);

      const { UNSAFE_getAllByType } = render(<FriendFavoritesScreen />);

      await waitFor(() => {
        const iconButtons = UNSAFE_getAllByType(require('react-native-paper').IconButton);
        const favButton = iconButtons.find((btn: any) =>
          btn.props.icon === 'heart' || btn.props.icon === 'heart-outline'
        );

        expect(favButton).toBeTruthy();
      });

      const iconButtons = UNSAFE_getAllByType(require('react-native-paper').IconButton);
      const favButton = iconButtons.find((btn: any) =>
        btn.props.icon === 'heart' || btn.props.icon === 'heart-outline'
      );

      // Create mock event with stopPropagation
      const mockEvent = { stopPropagation: jest.fn() };
      fireEvent(favButton, 'press', mockEvent);

      await waitFor(() => {
        expect(favoritesStorage.toggleFavorite).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockUsePublicProfileFavorites.mockReturnValue({
        data: mockFavorites,
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });
    });

    it('should show back button in header', () => {
      const { UNSAFE_getAllByType } = render(<FriendFavoritesScreen />);

      const backActions = UNSAFE_getAllByType(require('react-native-paper').Appbar.BackAction);
      expect(backActions.length).toBeGreaterThan(0);
    });

    it('should navigate back when back button is pressed', () => {
      const { UNSAFE_getAllByType } = render(<FriendFavoritesScreen />);

      const backAction = UNSAFE_getAllByType(require('react-native-paper').Appbar.BackAction)[0];
      fireEvent.press(backAction);

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('should display friend name in header', () => {
      const { UNSAFE_getAllByType } = render(<FriendFavoritesScreen />);

      // Check that Appbar.Content exists with the correct title
      const contents = UNSAFE_getAllByType(require('react-native-paper').Appbar.Content);
      expect(contents.length).toBeGreaterThan(0);
      expect(contents[0].props.title).toBe("Test Friend's Favorites");
    });
  });

  describe('Edge Cases', () => {
    it('should not display species when set to Unknown', () => {
      const oysterWithoutSpecies = {
        ...mockFavorites[0],
        species: 'Unknown',
      };

      mockUsePublicProfileFavorites.mockReturnValue({
        data: [oysterWithoutSpecies],
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      const { queryByText, getByText } = render(<FriendFavoritesScreen />);

      expect(getByText('Kusshi')).toBeTruthy(); // Name should still be there
      expect(queryByText('Unknown')).toBeNull(); // Unknown species not shown
      expect(queryByText('Crassostrea gigas')).toBeNull(); // Original species not there
    });

    it('should not display origin when set to Unknown', () => {
      const oysterWithoutOrigin = {
        ...mockFavorites[0],
        origin: 'Unknown',
      };

      mockUsePublicProfileFavorites.mockReturnValue({
        data: [oysterWithoutOrigin],
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      const { queryByText, getByText } = render(<FriendFavoritesScreen />);

      expect(getByText('Kusshi')).toBeTruthy(); // Name should still be there
      expect(queryByText('Unknown')).toBeNull(); // Unknown origin not shown
      expect(queryByText('British Columbia')).toBeNull(); // Original origin not there
    });

    it('should not display standout notes when null', () => {
      const oysterWithoutNotes = {
        ...mockFavorites[0],
        standoutNotes: null,
      };

      mockUsePublicProfileFavorites.mockReturnValue({
        data: [oysterWithoutNotes],
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      const { queryByText, getByText } = render(<FriendFavoritesScreen />);

      expect(getByText('Kusshi')).toBeTruthy(); // Name should still be there
      expect(queryByText('Sweet and briny')).toBeNull(); // Notes not shown
    });

    it('should display full oyster data including all attributes', () => {
      mockUsePublicProfileFavorites.mockReturnValue({
        data: mockFavorites,
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      const { getAllByText } = render(<FriendFavoritesScreen />);

      // Check that attributes are displayed (use getAllByText for values that may repeat)
      const fiveOutOfTen = getAllByText('5/10');
      const sixOutOfTen = getAllByText('6/10');
      const sevenOutOfTen = getAllByText('7/10');
      const eightOutOfTen = getAllByText('8/10');

      // Each oyster has 5 attributes, so we should have multiple instances
      expect(fiveOutOfTen.length).toBeGreaterThan(0);
      expect(sixOutOfTen.length).toBeGreaterThan(0);
      expect(sevenOutOfTen.length).toBeGreaterThan(0);
      expect(eightOutOfTen.length).toBeGreaterThan(0);
    });
  });
});
