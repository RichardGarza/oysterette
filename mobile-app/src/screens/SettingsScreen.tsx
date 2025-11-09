/**
 * SettingsScreen
 *
 * App configuration hub with profile, theme, sharing, and account management.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, Share, Linking, StyleSheet } from 'react-native';
import {
  List,
  Divider,
  Button,
  SegmentedButtons,
  Dialog,
  Portal,
  ActivityIndicator,
  Text,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { authStorage } from '../services/auth';

// ============================================================================
// CONSTANTS
// ============================================================================

const APP_VERSION = Constants.expoConfig?.version || '2.0.0';

const LEGAL_URLS = {
  PRIVACY_POLICY: 'https://richardgarza.github.io/oysterette/privacy-policy.html',
  TERMS_OF_SERVICE: 'https://richardgarza.github.io/oysterette/terms-of-service.html',
} as const;

const SHARE_MESSAGE = {
  message: 'Check out Oysterette - The ultimate oyster discovery app! 🦪',
  title: 'Oysterette',
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { theme, themeMode, setThemeMode, isDark, paperTheme } = useTheme();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const loadUserData = useCallback(async () => {
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
      if (__DEV__) {
        console.error('❌ [SettingsScreen] Error loading user data:', error);
      }
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleLogout = useCallback(async () => {
    try {
      await authStorage.clearAuth();
      setIsLoggedIn(false);
      setUserName(null);
      setUserEmail(null);
      setLogoutDialogVisible(false);
      navigation.navigate('Home' as never);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [SettingsScreen] Error logging out:', error);
      }
    }
  }, [navigation]);

  const handleShareApp = useCallback(async () => {
    try {
      await Share.share(SHARE_MESSAGE);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [SettingsScreen] Error sharing:', error);
      }
    }
  }, []);

  const themeDescription = useMemo((): string => {
    if (themeMode === 'system') {
      return `System (${isDark ? 'Dark' : 'Light'})`;
    }
    return themeMode === 'light' ? 'Light' : 'Dark';
  }, [themeMode, isDark]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <List.Section>
        <List.Subheader>Profile</List.Subheader>
        {isLoggedIn ? (
          <>
            <List.Item
              title="Name"
              description={userName}
              left={(props) => <List.Icon {...props} icon="account" />}
            />
            <Divider />
            <List.Item
              title="Email"
              description={userEmail}
              left={(props) => <List.Icon {...props} icon="email" />}
            />
            <Divider />
            <List.Item
              title="View Full Profile"
              left={(props) => <List.Icon {...props} icon="account-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Profile' as never)}
            />
          </>
        ) : (
          <>
            <List.Item
              title="Not Logged In"
              description="Sign in to access your profile"
              left={(props) => <List.Icon {...props} icon="account-off" />}
            />
            <Divider />
            <View style={styles.authButtonsContainer}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Login' as never)}
                style={styles.authButton}
                icon="login"
              >
                Log In
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Register' as never)}
                style={styles.authButton}
                icon="account-plus"
              >
                Sign Up
              </Button>
            </View>
          </>
        )}
      </List.Section>

      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <List.Item
          title="Theme"
          description={themeDescription}
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
        />
        <View style={styles.themeSegmentContainer}>
          <SegmentedButtons
            value={themeMode}
            onValueChange={(value) => setThemeMode(value as ThemeMode)}
            buttons={[
              {
                value: 'light',
                label: 'Light',
                icon: 'white-balance-sunny',
              },
              {
                value: 'dark',
                label: 'Dark',
                icon: 'moon-waning-crescent',
              },
              {
                value: 'system',
                label: 'System',
                icon: 'cellphone',
              },
            ]}
          />
        </View>
      </List.Section>

      <List.Section>
        <List.Subheader>Share</List.Subheader>
        <List.Item
          title="Share Oysterette"
          description="Tell your friends about the app"
          left={(props) => <List.Icon {...props} icon="share-variant" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleShareApp}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item
          title="Version"
          description={APP_VERSION}
          left={(props) => <List.Icon {...props} icon="information" />}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Legal</List.Subheader>
        <List.Item
          title="Privacy Policy"
          left={(props) => <List.Icon {...props} icon="shield-account" />}
          right={(props) => <List.Icon {...props} icon="open-in-new" />}
          onPress={() => Linking.openURL(LEGAL_URLS.PRIVACY_POLICY)}
        />
        <Divider />
        <List.Item
          title="Terms of Service"
          left={(props) => <List.Icon {...props} icon="file-document" />}
          right={(props) => <List.Icon {...props} icon="open-in-new" />}
          onPress={() => Linking.openURL(LEGAL_URLS.TERMS_OF_SERVICE)}
        />
      </List.Section>

      {isLoggedIn && (
        <View style={styles.accountActionsContainer}>
          <Button
            mode="outlined"
            onPress={() => setLogoutDialogVisible(true)}
            icon="logout"
            style={styles.logoutButton}
          >
            Logout
          </Button>

          <Button
            mode="outlined"
            onPress={() => setDeleteDialogVisible(true)}
            icon="delete"
            textColor={paperTheme.colors.error}
            style={[styles.deleteButton, { borderColor: paperTheme.colors.error }]}
          >
            Delete Account
          </Button>
        </View>
      )}

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={{ color: paperTheme.colors.onSurfaceVariant }}>
          Made with ❤️ for oyster lovers
        </Text>
      </View>

      <Portal>
        <Dialog visible={logoutDialogVisible} onDismiss={() => setLogoutDialogVisible(false)}>
          <Dialog.Icon icon="logout" />
          <Dialog.Title>Logout</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Are you sure you want to logout?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleLogout}>Logout</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
              Are you sure you want to delete your account? This action cannot be undone.
            </Text>
            <Text variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>
              This feature will be available soon. Please contact support to delete your account.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  authButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  authButton: {
    flex: 1,
  },
  themeSegmentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  accountActionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  logoutButton: {
    marginBottom: 32,
  },
  deleteButton: {
    marginBottom: 16,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
});
