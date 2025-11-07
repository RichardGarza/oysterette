/**
 * ThemeContext
 *
 * Global theme management with light/dark mode support and backend synchronization.
 *
 * Features:
 * - Three theme modes: light, dark, system
 * - System mode follows device appearance settings
 * - Persistent theme preference (AsyncStorage)
 * - Backend sync for logged-in users
 * - React Context API for global access
 * - Automatic system theme change detection
 * - Pre-defined color palettes for both modes
 *
 * Theme Modes:
 * - light: Always light theme
 * - dark: Always dark theme
 * - system: Follows device setting (respects user's system preference)
 *
 * Color Definitions:
 * Light Theme:
 * - primary: #3498db (blue)
 * - background: #f5f5f5 (light gray)
 * - card: #ffffff (white)
 * - text: #2c3e50 (dark gray)
 * - textSecondary: #7f8c8d (medium gray)
 * - border: #e0e0e0 (light gray)
 * - error: #e74c3c (red)
 * - success: #27ae60 (green)
 * - warning: #f59e0b (orange)
 *
 * Dark Theme:
 * - primary: #5dade2 (lighter blue for contrast)
 * - background: #1a1a1a (near black)
 * - card: #2c2c2c (dark gray)
 * - text: #ecf0f1 (light gray)
 * - textSecondary: #95a5a6 (medium gray)
 * - border: #3a3a3a (dark gray)
 * - error: #e74c3c (red, same as light)
 * - success: #2ecc71 (green)
 * - warning: #f39c12 (orange)
 *
 * Context Values:
 * - theme: Current theme object with colors
 * - themeMode: Current mode ('light' | 'dark' | 'system')
 * - isDark: Boolean indicating if dark theme is active
 * - setThemeMode: Function to change theme mode
 * - loadUserTheme: Function to load theme from user object
 *
 * Storage & Sync:
 * - Local: AsyncStorage key @oysterette_theme_mode
 * - Backend: user.preferences.theme field
 * - On setThemeMode: Saves locally AND syncs to backend (if logged in)
 * - On login: loadUserTheme() loads preference from user object
 * - On app start: Loads from AsyncStorage
 *
 * Theme Change Flow:
 * 1. User selects mode in SettingsScreen
 * 2. setThemeMode() called with new mode
 * 3. Saved to AsyncStorage immediately
 * 4. State updated (triggers UI re-render)
 * 5. Backend API call to save preference (if logged in)
 * 6. If sync fails, local preference persists
 *
 * System Mode Detection:
 * - Uses Appearance.getColorScheme() for initial value
 * - Subscribes to Appearance.addChangeListener() for live updates
 * - isDark computed based on mode and system setting
 * - Example: mode='system' + systemColorScheme='dark' → isDark=true
 *
 * Usage:
 * ```tsx
 * // Wrap app in provider (App.tsx):
 * <ThemeProvider>
 *   <NavigationContainer>
 *     {screens}
 *   </NavigationContainer>
 * </ThemeProvider>
 *
 * // Use in component:
 * const { theme, themeMode, isDark, setThemeMode } = useTheme();
 * const styles = StyleSheet.create({
 *   container: { backgroundColor: theme.colors.background }
 * });
 * ```
 *
 * Hook Safety:
 * - useTheme() throws error if used outside ThemeProvider
 * - Ensures proper context usage throughout app
 *
 * Used By:
 * - All screens and components that need theme-aware styling
 * - SettingsScreen: Theme switcher UI
 * - HomeScreen, LoginScreen: Loads user theme on login
 * - App.tsx: Wraps entire app
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userApi } from '../services/api';
import { authStorage } from '../services/auth';

export type ThemeMode = 'light' | 'dark' | 'system';

export type Theme = {
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    notification: string;
    error: string;
    success: string;
    warning: string;
    cardBackground: string;
    inputBackground: string;
    shadowColor: string;
  };
};

const lightTheme: Theme = {
  colors: {
    primary: '#3498db',
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#2c3e50',
    textSecondary: '#7f8c8d',
    border: '#e0e0e0',
    notification: '#27ae60',
    error: '#e74c3c',
    success: '#27ae60',
    warning: '#f59e0b',
    cardBackground: '#ffffff',
    inputBackground: '#f5f5f5',
    shadowColor: '#000',
  },
};

const darkTheme: Theme = {
  colors: {
    primary: '#5dade2',
    background: '#1a1a1a',
    card: '#2c2c2c',
    text: '#ecf0f1',
    textSecondary: '#95a5a6',
    border: '#3a3a3a',
    notification: '#2ecc71',
    error: '#e74c3c',
    success: '#2ecc71',
    warning: '#f39c12',
    cardBackground: '#2c2c2c',
    inputBackground: '#3a3a3a',
    shadowColor: '#000',
  },
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  loadUserTheme: (user: any) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@oysterette_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      // Save locally
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);

      // Sync with backend if user is logged in
      try {
        const user = await authStorage.getUser();
        if (user?.id) {
          const preferences = { theme: mode };
          await userApi.updatePreferences(preferences);
          console.log('Theme preference synced to server');
        }
      } catch (syncError) {
        // Silently fail - local preference is still saved
        console.log('Could not sync theme to server (user may not be logged in)');
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const loadUserTheme = (user: any) => {
    try {
      // Load theme from user preferences if available
      if (user?.preferences && typeof user.preferences === 'object') {
        const savedTheme = user.preferences.theme;
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
          AsyncStorage.setItem(THEME_STORAGE_KEY, savedTheme);
          console.log('Loaded user theme preference:', savedTheme);
        }
      }
    } catch (error) {
      console.error('Failed to load user theme:', error);
    }
  };

  // Determine active theme
  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    loadUserTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
