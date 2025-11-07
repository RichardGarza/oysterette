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
  FlatList,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HomeScreenNavigationProp } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { authStorage } from '../services/auth';
import { favoritesStorage } from '../services/favorites';
import { recommendationApi } from '../services/api';
import { Oyster } from '../types/Oyster';
import RecommendedOysterCard from '../components/RecommendedOysterCard';

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme, loadUserTheme } = useTheme();
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Oyster[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
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
        // Load recommendations
        loadRecommendations();
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

  const loadRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const recs = await recommendationApi.getRecommendations(5);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Silent fail - recommendations are optional
    } finally {
      setLoadingRecommendations(false);
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>
          Discover, review, and track your favorite oysters
        </Text>

        {/* Recommendations Section - Only show if logged in */}
        {isLoggedIn && (
          <View style={styles.recommendationsSection}>
            {loadingRecommendations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading recommendations...</Text>
              </View>
            ) : recommendations.length === 0 ? (
              // Empty State - No baseline profile set
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Get Personalized Recommendations!</Text>
                <Text style={styles.emptyStateText}>
                  You haven't set your flavor profile yet! Tell us your ideal oyster attributes to get personalized recommendations.
                </Text>
                <TouchableOpacity
                  style={styles.setProfileButton}
                  onPress={() => navigation.navigate('SetFlavorProfile')}
                >
                  <Text style={styles.setProfileButtonText}>Set Flavor Profile</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Show Recommendations
              <View>
                <Text style={styles.sectionTitle}>Recommended for You</Text>
                <FlatList
                  data={recommendations}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <RecommendedOysterCard
                      oyster={item}
                      onPress={() => navigation.navigate('OysterDetail', { oysterId: item.id })}
                    />
                  )}
                  contentContainerStyle={styles.recommendationsList}
                />
              </View>
            )}
          </View>
        )}

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
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      alignItems: 'center',
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
    recommendationsSection: {
      width: '100%',
      marginBottom: 24,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    loadingText: {
      marginLeft: 10,
      fontSize: 14,
      color: colors.textSecondary,
    },
    emptyState: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    emptyStateText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
    },
    setProfileButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 20,
    },
    setProfileButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    recommendationsList: {
      paddingRight: 12,
    },
  });
