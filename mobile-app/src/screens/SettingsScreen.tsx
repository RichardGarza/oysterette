import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, ThemeMode } from '../context/ThemeContext';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const [userName, setUserName] = useState('Guest User');
  const [userEmail, setUserEmail] = useState('guest@oysterette.com');

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
              await AsyncStorage.removeItem('@oysterette_token');
              // Navigate to Home or Login screen
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

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.card}>
          <View style={styles.profileItem}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{userName}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.profileItem}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{userEmail}</Text>
          </View>
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

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

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
      marginBottom: 12,
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
  });
