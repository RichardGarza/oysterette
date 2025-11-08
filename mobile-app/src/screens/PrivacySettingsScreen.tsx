/**
 * PrivacySettingsScreen
 *
 * Profile visibility and display preferences configuration.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  Text,
  RadioButton,
  List,
  Button,
  ActivityIndicator,
  Banner,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { authStorage } from '../services/auth';
import { userApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';

// ============================================================================
// COMPONENT
// ============================================================================

export default function PrivacySettingsScreen() {
  const navigation = useNavigation();
  const { paperTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileVisibility, setProfileVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [showReviewHistory, setShowReviewHistory] = useState(true);
  const [showFavorites, setShowFavorites] = useState(true);
  const [showStatistics, setShowStatistics] = useState(true);

  const loadPrivacySettings = useCallback(async () => {
    try {
      setLoading(true);
      const user = await authStorage.getUser();
      if (!user) {
        navigation.goBack();
        return;
      }

      setProfileVisibility(user.profileVisibility || 'public');
      setShowReviewHistory(user.showReviewHistory ?? true);
      setShowFavorites(user.showFavorites ?? true);
      setShowStatistics(user.showStatistics ?? true);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [PrivacySettingsScreen] Error loading settings:', error);
      }
      Alert.alert('Error', 'Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    loadPrivacySettings();
  }, [loadPrivacySettings]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);

      const settings = {
        profileVisibility,
        showReviewHistory,
        showFavorites,
        showStatistics,
      };

      await userApi.updatePrivacySettings(settings);

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
      if (__DEV__) {
        console.error('❌ [PrivacySettingsScreen] Error saving settings:', error);
      }
      Alert.alert('Error', error.response?.data?.error || 'Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  }, [profileVisibility, showReviewHistory, showFavorites, showStatistics, navigation]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: paperTheme.colors.background }]}>
        <ActivityIndicator size="large" animating={true} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>Privacy Settings</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Control what information is visible to other users
            </Text>
          </View>

          <List.Section>
            <List.Subheader>Profile Visibility</List.Subheader>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              Who can see your profile and activity
            </Text>

            <RadioButton.Group
              onValueChange={(value) => setProfileVisibility(value as 'public' | 'friends' | 'private')}
              value={profileVisibility}
            >
              <RadioButton.Item
                label="Public"
                value="public"
                position="leading"
                style={styles.radioItem}
                labelStyle={styles.radioLabel}
              />
              <Text variant="bodySmall" style={styles.radioDescription}>
                Anyone can view your profile
              </Text>
              <Divider />

              <RadioButton.Item
                label="Friends Only"
                value="friends"
                position="leading"
                style={styles.radioItem}
                labelStyle={styles.radioLabel}
              />
              <Text variant="bodySmall" style={styles.radioDescription}>
                Only your friends can view your profile (coming soon)
              </Text>
              <Divider />

              <RadioButton.Item
                label="Private"
                value="private"
                position="leading"
                style={styles.radioItem}
                labelStyle={styles.radioLabel}
              />
              <Text variant="bodySmall" style={styles.radioDescription}>
                Only you can view your profile
              </Text>
            </RadioButton.Group>
          </List.Section>

          <List.Section>
            <List.Subheader>Display Preferences</List.Subheader>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              Choose what information to show on your public profile
            </Text>

            <List.Item
              title="Show Review History"
              description="Display your reviews on your profile"
              left={(props) => <List.Icon {...props} icon="history" />}
              right={() => (
                <List.Icon
                  icon={showReviewHistory ? 'toggle-switch' : 'toggle-switch-off-outline'}
                  color={showReviewHistory ? paperTheme.colors.primary : undefined}
                />
              )}
              onPress={() => setShowReviewHistory(!showReviewHistory)}
            />
            <Divider />

            <List.Item
              title="Show Favorites"
              description="Display your favorite oysters on your profile"
              left={(props) => <List.Icon {...props} icon="heart" />}
              right={() => (
                <List.Icon
                  icon={showFavorites ? 'toggle-switch' : 'toggle-switch-off-outline'}
                  color={showFavorites ? paperTheme.colors.primary : undefined}
                />
              )}
              onPress={() => setShowFavorites(!showFavorites)}
            />
            <Divider />

            <List.Item
              title="Show Statistics"
              description="Display your review stats and badge on your profile"
              left={(props) => <List.Icon {...props} icon="chart-bar" />}
              right={() => (
                <List.Icon
                  icon={showStatistics ? 'toggle-switch' : 'toggle-switch-off-outline'}
                  color={showStatistics ? paperTheme.colors.primary : undefined}
                />
              )}
              onPress={() => setShowStatistics(!showStatistics)}
            />
          </List.Section>

          <Banner
            visible={true}
            icon="information"
            style={styles.banner}
          >
            <Text variant="bodySmall">
              Note: Your reviews and ratings are always visible to maintain the integrity of our
              community ratings system. Privacy settings only affect your profile page.
            </Text>
          </Banner>

          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            icon="content-save"
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            Save Privacy Settings
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 8,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 22,
  },
  sectionDescription: {
    paddingHorizontal: 20,
    marginBottom: 8,
    lineHeight: 20,
  },
  radioItem: {
    paddingVertical: 8,
  },
  radioLabel: {
    fontWeight: '600',
  },
  radioDescription: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    lineHeight: 18,
  },
  banner: {
    marginHorizontal: 16,
    marginVertical: 16,
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 8,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
});
