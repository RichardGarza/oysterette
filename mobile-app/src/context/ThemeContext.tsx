import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
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
