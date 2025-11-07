/**
 * PrivacySettingsScreen
 *
 * User privacy and profile visibility configuration screen.
 *
 * Features:
 * - Profile visibility level (Public, Friends Only, Private)
 * - Display preferences for profile sections (toggles)
 * - Saves settings to backend and local storage
 * - Theme-aware styling
 * - Loading state while fetching current settings
 * - Success alert with auto-redirect after save
 *
 * Profile Visibility Levels:
 * - Public: Anyone can view profile (default)
 * - Friends Only: Coming soon (UI only, not implemented)
 * - Private: Only user can view their own profile
 *
 * Display Preferences:
 * - Show Review History: Display reviews on profile (default: true)
 * - Show Favorites: Display favorite oysters on profile (default: true)
 * - Show Statistics: Display stats and badge on profile (default: true)
 *
 * Privacy Notice:
 * - Reviews and ratings always visible for community ratings integrity
 * - Privacy settings only affect profile page display
 * - Shown as info box above save button
 *
 * Settings Flow:
 * 1. Loads current user from authStorage on mount
 * 2. Pre-populates form with user's existing privacy settings
 * 3. User modifies settings via radio buttons and switches
 * 4. User taps "Save Privacy Settings" button
 * 5. Calls userApi.updatePrivacySettings() with new values
 * 6. Updates local authStorage with new user data
 * 7. Shows success alert
 * 8. Navigates back to ProfileScreen
 *
 * Radio Button Group (Profile Visibility):
 * - Visual radio indicators with primary color
 * - Selected option has colored border and background tint
 * - Each option has title and description
 * - Platform-specific shadows
 *
 * Switch Toggles (Display Preferences):
 * - Native Switch component with theme colors
 * - Each has title and description
 * - Enclosed in styled cards
 * - Platform-specific styling (iOS vs Android thumb colors)
 *
 * State:
 * - profileVisibility: 'public' | 'friends' | 'private'
 * - showReviewHistory: boolean
 * - showFavorites: boolean
 * - showStatistics: boolean
 * - loading: Initial data fetch in progress
 * - saving: Save operation in progress
 *
 * Error Handling:
 * - Loading errors: Shows alert and stays on screen
 * - Save errors: Shows backend error message in alert
 * - No user found: Navigates back immediately
 *
 * Backend Integration:
 * - Loads from user object in authStorage
 * - Saves via userApi.updatePrivacySettings()
 * - Updates local storage for offline consistency
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authStorage } from '../services/auth';
import { userApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function PrivacySettingsScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Privacy settings state
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [showReviewHistory, setShowReviewHistory] = useState(true);
  const [showFavorites, setShowFavorites] = useState(true);
  const [showStatistics, setShowStatistics] = useState(true);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      const user = await authStorage.getUser();
      if (!user) {
        navigation.goBack();
        return;
      }

      // Set current privacy settings from user data
      setProfileVisibility(user.profileVisibility || 'public');
      setShowReviewHistory(user.showReviewHistory ?? true);
      setShowFavorites(user.showFavorites ?? true);
      setShowStatistics(user.showStatistics ?? true);
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      Alert.alert('Error', 'Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const settings = {
        profileVisibility,
        showReviewHistory,
        showFavorites,
        showStatistics,
      };

      await userApi.updatePrivacySettings(settings);

      // Update local user data
      const user = await authStorage.getUser();
      if (user) {
        const updatedUser = {
          ...user,
          ...settings,
        };
        await authStorage.saveUser(updatedUser);
      }

      Alert.alert('Success', 'Privacy settings updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Error saving privacy settings:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const styles = createStyles(theme.colors, isDark);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Privacy Settings</Text>
            <Text style={styles.subtitle}>
              Control what information is visible to other users
            </Text>
          </View>

          {/* Profile Visibility Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Visibility</Text>
            <Text style={styles.sectionDescription}>
              Who can see your profile and activity
            </Text>

            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  profileVisibility === 'public' && styles.radioOptionSelected,
                ]}
                onPress={() => setProfileVisibility('public')}
              >
                <View style={styles.radio}>
                  {profileVisibility === 'public' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.radioTextContainer}>
                  <Text style={styles.radioTitle}>Public</Text>
                  <Text style={styles.radioDescription}>Anyone can view your profile</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioOption,
                  profileVisibility === 'friends' && styles.radioOptionSelected,
                ]}
                onPress={() => setProfileVisibility('friends')}
              >
                <View style={styles.radio}>
                  {profileVisibility === 'friends' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.radioTextContainer}>
                  <Text style={styles.radioTitle}>Friends Only</Text>
                  <Text style={styles.radioDescription}>
                    Only your friends can view your profile (coming soon)
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioOption,
                  profileVisibility === 'private' && styles.radioOptionSelected,
                ]}
                onPress={() => setProfileVisibility('private')}
              >
                <View style={styles.radio}>
                  {profileVisibility === 'private' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.radioTextContainer}>
                  <Text style={styles.radioTitle}>Private</Text>
                  <Text style={styles.radioDescription}>Only you can view your profile</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Display Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Display Preferences</Text>
            <Text style={styles.sectionDescription}>
              Choose what information to show on your public profile
            </Text>

            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Show Review History</Text>
                <Text style={styles.settingDescription}>
                  Display your reviews on your profile
                </Text>
              </View>
              <Switch
                value={showReviewHistory}
                onValueChange={setShowReviewHistory}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : showReviewHistory ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Show Favorites</Text>
                <Text style={styles.settingDescription}>
                  Display your favorite oysters on your profile
                </Text>
              </View>
              <Switch
                value={showFavorites}
                onValueChange={setShowFavorites}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : showFavorites ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Show Statistics</Text>
                <Text style={styles.settingDescription}>
                  Display your review stats and badge on your profile
                </Text>
              </View>
              <Switch
                value={showStatistics}
                onValueChange={setShowStatistics}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : showStatistics ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Privacy Notice */}
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Note: Your reviews and ratings are always visible to maintain the integrity of our
              community ratings system. Privacy settings only affect your profile page.
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Privacy Settings</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 6,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    radioGroup: {
      gap: 12,
    },
    radioOption: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: 'transparent',
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.08,
          shadowRadius: 3,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    radioOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: isDark ? colors.cardBackground : `${colors.primary}10`,
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      marginRight: 12,
      marginTop: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    radioTextContainer: {
      flex: 1,
    },
    radioTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    radioDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.08,
          shadowRadius: 3,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    settingText: {
      flex: 1,
      marginRight: 16,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    notice: {
      backgroundColor: isDark ? `${colors.primary}20` : `${colors.primary}15`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    noticeText: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 20,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 40,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '600',
    },
  });
