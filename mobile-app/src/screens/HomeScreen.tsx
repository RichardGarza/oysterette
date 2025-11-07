/**
 * HomeScreen
 *
 * App entry point and landing screen with authentication check.
 *
 * Features:
 * - Animated logo display with dual-logo transition (900ms fade)
 * - Automatic authentication check on mount and focus
 * - Auto-login via stored JWT token
 * - Theme loading from user preferences
 * - Favorites sync after successful login
 * - Dynamic button text based on auth state
 * - Loading screen with larger logo (384px)
 * - Back navigation disabled (prevents going back to loading)
 *
 * Flow:
 * 1. Shows loading screen with logo
 * 2. Checks for stored auth token
 * 3. Auto-logs in if valid token exists
 * 4. Loads user theme preferences
 * 5. Syncs favorites from server
 * 6. Shows "Browse Oysters" or "All Oysters" button based on auth
 *
 * State:
 * - checking: Initial auth check in progress
 * - isLoggedIn: User authentication status
 * - showLoading: Transition loading state
 * - fadeAnim: Animated value for logo transitions
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HomeScreenNavigationProp } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { authStorage } from '../services/auth';
import { favoritesStorage } from '../services/favorites';
import { authApi } from '../services/api';

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme, loadUserTheme } = useTheme();
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const styles = createStyles(theme.colors);

  useEffect(() => {
    checkAuth();
  }, []);

  // Re-check auth when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkAuth();
    });
    return unsubscribe;
  }, [navigation]);

  const checkAuth = async () => {
    try {
      const token = await authStorage.getToken();
      const user = await authStorage.getUser();

      if (token && user) {
        // User is logged in, load their theme
        loadUserTheme(user);
        // Sync favorites on app start
        favoritesStorage.syncWithBackend();
        setIsLoggedIn(true);
        setChecking(false);
      } else {
        // No auth, show home screen
        setIsLoggedIn(false);
        setChecking(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsLoggedIn(false);
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await authStorage.clearAuth();
    setIsLoggedIn(false);
  };

  const handleBrowseOysters = () => {
    setShowLoading(true);

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Navigate after 0.9 seconds with fade out
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        navigation.navigate('OysterList');
        setShowLoading(false);
      });
    }, 900);
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.subtitle, { marginTop: 20 }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {showLoading && (
        <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
        </Animated.View>
      )}

      <View style={styles.content}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>
          Discover, review, and track your favorite oysters
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleBrowseOysters}
        >
          <Text style={styles.buttonText}>{isLoggedIn ? 'All Oysters' : 'Browse Oysters'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.topOystersButton]}
          onPress={() => navigation.navigate('TopOysters')}
        >
          <Text style={styles.buttonText}>🏆 Top Oysters</Text>
        </TouchableOpacity>

        {isLoggedIn ? (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleLogout}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Log Out
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Log In
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Explore oyster varieties from around the world with our 10-point
            attribute system. Create an account to add reviews and track your
            favorite oysters.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    logo: {
      width: 192,
      height: 192,
      marginBottom: 20,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    loadingLogo: {
      width: 384,
      height: 384,
    },
    title: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 40,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 40,
      paddingVertical: 15,
      borderRadius: 25,
      marginBottom: 15,
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    topOystersButton: {
      backgroundColor: colors.warning,
    },
    secondaryButton: {
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.primary,
      marginBottom: 30,
    },
    secondaryButtonText: {
      color: colors.primary,
    },
    infoContainer: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 10,
      marginTop: 20,
    },
    infoText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
  });
