/**
 * ThemeContext
 *
 * Global theme management with light/dark mode support and backend synchronization.
 */

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';
import { userApi } from '../services/api';
import { authStorage } from '../services/auth';
import { User } from '../types/Oyster';

// ============================================================================
// TYPES
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  readonly colors: {
    readonly primary: string;
    readonly background: string;
    readonly card: string;
    readonly text: string;
    readonly textSecondary: string;
    readonly border: string;
    readonly notification: string;
    readonly error: string;
    readonly success: string;
    readonly warning: string;
    readonly cardBackground: string;
    readonly inputBackground: string;
    readonly shadowColor: string;
  };
}

interface ThemeContextType {
  readonly theme: Theme;
  readonly themeMode: ThemeMode;
  readonly isDark: boolean;
  readonly paperTheme: MD3Theme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  loadUserTheme: (user: User) => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = '@oysterette_theme_mode';

const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

// ============================================================================
// THEME DEFINITIONS
// ============================================================================

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

// React Native Paper themes with brand colors
export const paperLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FF6B35',
    primaryContainer: '#FFE5DB',
    secondary: '#004E89',
    secondaryContainer: '#D4E6F1',
    tertiary: '#4A7C59',
    tertiaryContainer: '#D5E8DB',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#FAFAFA',
    error: '#BA1A1A',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1C1B1F',
    outline: '#79747E',
    shadow: '#000000',
  },
};

export const paperDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FFB59A',
    primaryContainer: '#8B3A1F',
    secondary: '#5DADE2',
    secondaryContainer: '#00344D',
    tertiary: '#7FAC8E',
    tertiaryContainer: '#2F4A38',
    surface: '#1C1B1F',
    surfaceVariant: '#2B2930',
    background: '#121212',
    error: '#FFB4AB',
    onPrimary: '#5A1A00',
    onSecondary: '#00344D',
    onSurface: '#E6E1E5',
    outline: '#938F99',
    shadow: '#000000',
  },
};

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// HELPERS
// ============================================================================

function isValidThemeMode(value: string): value is ThemeMode {
  return THEME_MODES.includes(value as ThemeMode);
}

// ============================================================================
// PROVIDER
// ============================================================================

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Load saved theme preference on mount
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

  const loadThemePreference = useCallback(async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedTheme && isValidThemeMode(savedTheme)) {
        setThemeModeState(savedTheme);
      }
    } catch (error) {
      console.error('❌ [Theme] Failed to load preference:', error);
    }
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      // Save locally
      await AsyncStorage.setItem(STORAGE_KEY, mode);
      setThemeModeState(mode);

      // Sync with backend if logged in
      try {
        const user = await authStorage.getUser();
        if (user?.id) {
          await userApi.updatePreferences({ theme: mode });
          if (__DEV__) {
            console.log('✅ [Theme] Synced to server:', mode);
          }
        }
      } catch (syncError) {
        // Silently fail - local preference is still saved
        if (__DEV__) {
          console.log('⚠️ [Theme] Could not sync to server (user may not be logged in)');
        }
      }
    } catch (error) {
      console.error('❌ [Theme] Failed to save preference:', error);
    }
  }, []);

  const loadUserTheme = useCallback(async (user: User) => {
    try {
      const preferences = user.preferences;
      if (preferences?.theme && isValidThemeMode(preferences.theme)) {
        setThemeModeState(preferences.theme);
        await AsyncStorage.setItem(STORAGE_KEY, preferences.theme);
        if (__DEV__) {
          console.log('✅ [Theme] Loaded user preference:', preferences.theme);
        }
      }
    } catch (error) {
      console.error('❌ [Theme] Failed to load user theme:', error);
    }
  }, []);

  // Determine active theme
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;
  const paperTheme = isDark ? paperDarkTheme : paperLightTheme;

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    paperTheme,
    setThemeMode,
    loadUserTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
