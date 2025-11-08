/**
 * HomeScreen - Migrated to React Native Paper
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
 * - Exit confirmation dialog on Android back button press
 * - Theme-aware styling via React Native Paper
 *
 * Material Design Components:
 * - Button: Primary (contained) and secondary (outlined) buttons
 * - Text: Typography with variants (bodyLarge, headlineMedium, etc.)
 * - ActivityIndicator: Loading states
 * - Card: Recommendations empty state and info container
 * - Surface: Elevated card backgrounds
 *
 * Migration Benefits:
 * - Material Design ripple effects on buttons
 * - Consistent typography and spacing
 * - Built-in elevation for cards
 * - Better accessibility
 * - Icon support on buttons
 * - Automatic theme integration
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
  StyleSheet,
  SafeAreaView,
  Image,
  Animated,
  FlatList,
  ScrollView,
  BackHandler,
  Alert,
} from 'react-native';
import {
  Button,
  Text,
  ActivityIndicator,
  Card,
  Surface,
} from 'react-native-paper';
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
  const { theme, loadUserTheme, paperTheme } = useTheme();
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Oyster[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

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

  // Handle Android back button press - show exit confirmation
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Exit App?',
        'Are you sure you want to exit Oysterette?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Exit',
            onPress: () => BackHandler.exitApp(),
            style: 'destructive',
          },
        ],
        { cancelable: true }
      );
      return true; // Prevent default back button behavior
    });

    return () => backHandler.remove();
  }, []);

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
      <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" animating={true} />
          <Text variant="bodyLarge" style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      {showLoading && (
        <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim, backgroundColor: paperTheme.colors.background }]}>
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
        <Text variant="bodyLarge" style={styles.subtitle}>
          Discover, review, and track your favorite oysters
        </Text>

        {/* Recommendations Section - Only show if logged in */}
        {isLoggedIn && (
          <View style={styles.recommendationsSection}>
            {loadingRecommendations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" animating={true} />
                <Text variant="bodyMedium" style={styles.loadingRecommendationsText}>
                  Loading recommendations...
                </Text>
              </View>
            ) : recommendations.length === 0 ? (
              // Empty State - No baseline profile set
              <Card mode="elevated" style={styles.emptyStateCard}>
                <Card.Content>
                  <Text variant="headlineSmall" style={styles.emptyStateTitle}>
                    Get Personalized Recommendations!
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptyStateText}>
                    You haven't set your flavor profile yet! Tell us your ideal oyster attributes to get personalized recommendations.
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('SetFlavorProfile')}
                    style={styles.setProfileButton}
                    icon="tune"
                  >
                    Set Flavor Profile
                  </Button>
                </Card.Content>
              </Card>
            ) : (
              // Show Recommendations
              <View>
                <Text variant="headlineSmall" style={styles.sectionTitle}>
                  Recommended for You
                </Text>
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

        <Button
          mode="contained"
          onPress={handleBrowseOysters}
          style={styles.button}
          icon="magnify"
          contentStyle={styles.buttonContent}
        >
          {isLoggedIn ? 'All Oysters' : 'Browse Oysters'}
        </Button>

        <Button
          mode="contained"
          onPress={() => navigation.navigate('TopOysters')}
          style={styles.topOystersButton}
          icon="trophy"
          contentStyle={styles.buttonContent}
          buttonColor={paperTheme.colors.tertiary}
        >
          Top Oysters
        </Button>

        {isLoggedIn ? (
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.secondaryButton}
            icon="logout"
            contentStyle={styles.buttonContent}
          >
            Log Out
          </Button>
        ) : (
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Login')}
            style={styles.secondaryButton}
            icon="login"
            contentStyle={styles.buttonContent}
          >
            Log In
          </Button>
        )}

        <Card mode="outlined" style={styles.infoCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.infoText}>
              Explore oyster varieties from around the world with our 10-point
              attribute system. Create an account to add reviews and track your
              favorite oysters.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    width: 256,
    height: 256,
    marginBottom: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingLogo: {
    width: 384,
    height: 384,
  },
  loadingText: {
    marginTop: 20,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    marginBottom: 15,
    minWidth: 200,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  topOystersButton: {
    marginBottom: 15,
    minWidth: 200,
  },
  secondaryButton: {
    marginBottom: 30,
    minWidth: 200,
  },
  infoCard: {
    marginTop: 20,
    width: '100%',
  },
  infoText: {
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
  loadingRecommendationsText: {
    marginLeft: 10,
  },
  emptyStateCard: {
    width: '100%',
  },
  emptyStateTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  setProfileButton: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  recommendationsList: {
    paddingRight: 12,
  },
});
