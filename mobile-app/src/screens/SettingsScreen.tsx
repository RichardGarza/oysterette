/**
 * SettingsScreen
 *
 * App-wide settings and configuration hub accessible from global navigation gear icon.
 *
 * Features:
 * - Profile quick view (name, email) with "View Full Profile" link
 * - Auth buttons for non-logged-in users (Log In / Sign Up)
 * - Theme switcher (Light / Dark / System) with live preview
 * - Share app functionality (native share sheet)
 * - App version display
 * - Legal links (Privacy Policy, Terms of Service) - opens in browser
 * - Logout button (logged-in users only)
 * - Delete account button (logged-in users only, placeholder)
 * - Theme-aware styling
 * - Redirects to auth after logout
 *
 * Profile Section:
 * - Shows user name and email if logged in
 * - Shows "User Not Logged In" if not authenticated
 * - Auth buttons (Log In, Sign Up) for unauthenticated users
 * - "View Full Profile" button navigates to ProfileScreen
 *
 * Theme Switcher:
 * - Three options: Light, Dark, System
 * - System mode follows device appearance settings
 * - Shows current effective theme (e.g., "System (Dark)")
 * - Live updates UI when theme changes
 * - Persists preference to backend for logged-in users
 *
 * Share Functionality:
 * - Uses native Share API
 * - Message: "Check out Oysterette - The ultimate oyster discovery app! 🦪"
 * - Works on both iOS and Android
 *
 * Account Actions:
 * - Logout: Confirmation alert, clears auth, navigates to Home
 * - Delete Account: Currently placeholder (shows "coming soon" message)
 * - 48px spacing between logout and delete to prevent accidental clicks
 *
 * Auth State:
 * - Loads user data from authStorage on mount
 * - Updates isLoggedIn flag for conditional rendering
 * - Shows loading spinner during initial load
 *
 * Layout:
 * - Grouped sections with cards (Profile, Appearance, Share, About, Account Actions)
 * - Section titles in uppercase with letterSpacing
 * - Platform-specific shadows (iOS shadowOffset, Android elevation)
 * - Footer text: "Made with ❤️ for oyster lovers"
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Share,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { authStorage } from '../services/auth';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await authStorage.getUser();
      if (user) {
        setUserName(user.name);
        setUserEmail(user.email);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authStorage.clearAuth();
              setIsLoggedIn(false);
              setUserName(null);
              setUserEmail(null);
              // Navigate to Home screen
              navigation.navigate('Home' as never);
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Account Deletion',
              'This feature will be available soon. Please contact support to delete your account.'
            );
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out Oysterette - The ultimate oyster discovery app! 🦪',
        title: 'Oysterette',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getThemeLabel = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  };

  const styles = createStyles(theme.colors, isDark);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.card}>
          {isLoggedIn ? (
            <>
              <View style={styles.profileItem}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{userName}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.profileItem}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{userEmail}</Text>
              </View>
              <View style={styles.separator} />
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => navigation.navigate('Profile' as never)}
              >
                <Text style={styles.settingLabel}>View Full Profile</Text>
                <Text style={styles.settingValue}>→</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.profileItem}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>User Not Logged In</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.authButtonsContainer}>
                <TouchableOpacity
                  style={[styles.authButton, styles.loginButton]}
                  onPress={() => navigation.navigate('Login' as never)}
                >
                  <Text style={styles.authButtonText}>Log In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.authButton, styles.signUpButton]}
                  onPress={() => navigation.navigate('Register' as never)}
                >
                  <Text style={[styles.authButtonText, styles.signUpButtonText]}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Theme</Text>
              <Text style={styles.settingDescription}>
                {getThemeLabel(themeMode)}
                {themeMode === 'system' && ` (${isDark ? 'Dark' : 'Light'})`}
              </Text>
            </View>
          </View>
          <View style={styles.themeOptions}>
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeButton,
                  themeMode === mode && styles.themeButtonActive,
                ]}
                onPress={() => setThemeMode(mode)}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    themeMode === mode && styles.themeButtonTextActive,
                  ]}
                >
                  {getThemeLabel(mode)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Share Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Share</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingItem} onPress={handleShareApp}>
            <Text style={styles.settingLabel}>Share Oysterette</Text>
            <Text style={styles.settingValue}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>
      </View>

      {/* Legal Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Linking.openURL('https://richardgarza.github.io/oysterette/privacy-policy.html')}
          >
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingValue}>→</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Linking.openURL('https://richardgarza.github.io/oysterette/terms-of-service.html')}
          >
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Text style={styles.settingValue}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Actions */}
      {isLoggedIn && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for oyster lovers</Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    profileItem: {
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    label: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    value: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 16,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    settingLeft: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    settingValue: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    themeOptions: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    themeButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginTop: 8,
      backgroundColor: colors.inputBackground,
    },
    themeButtonActive: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    themeButtonText: {
      fontSize: 15,
      color: colors.text,
    },
    themeButtonTextActive: {
      fontWeight: '600',
      color: colors.primary,
    },
    logoutButton: {
      backgroundColor: colors.cardBackground,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 48, // Increased spacing to prevent accidental delete clicks
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    logoutButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    deleteButton: {
      backgroundColor: colors.cardBackground,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.error,
    },
    deleteButtonText: {
      fontSize: 16,
      color: colors.error,
      fontWeight: '600',
    },
    footer: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    authButtonsContainer: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    authButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 3,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    loginButton: {
      backgroundColor: colors.primary,
    },
    signUpButton: {
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    authButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    signUpButtonText: {
      color: colors.primary,
    },
  });
