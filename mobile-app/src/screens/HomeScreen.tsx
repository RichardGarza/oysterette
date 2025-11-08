/**
 * HomeScreen
 *
 * Landing screen with auth check, personalized recommendations, and logo transitions.
 */

import React, { useEffect, useState, useCallback } from 'react';
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

// ============================================================================
// CONSTANTS
// ============================================================================

const ANIMATION_CONFIG = {
  FADE_DURATION: 300,
  TRANSITION_DELAY: 900,
} as const;

const LOGO_SIZES = {
  NORMAL: 256,
  LOADING: 384,
} as const;

const RECOMMENDATIONS_LIMIT = 5;

// ============================================================================
// COMPONENT
// ============================================================================

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
  }, [checkAuth]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', checkAuth);
    return unsubscribe;
  }, [navigation, checkAuth]);

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

  const loadRecommendations = useCallback(async () => {
    try {
      setLoadingRecommendations(true);
      const recs = await recommendationApi.getRecommendations(RECOMMENDATIONS_LIMIT);
      setRecommendations(recs);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [HomeScreen] Error loading recommendations:', error);
      }
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = await authStorage.getToken();
      const user = await authStorage.getUser();

      if (token && user) {
        loadUserTheme(user);
        favoritesStorage.syncWithBackend();
        setIsLoggedIn(true);
        setChecking(false);
        loadRecommendations();
      } else {
        setIsLoggedIn(false);
        setChecking(false);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [HomeScreen] Error checking auth:', error);
      }
      setIsLoggedIn(false);
      setChecking(false);
    }
  }, [loadUserTheme, loadRecommendations]);

  const handleLogout = useCallback(async () => {
    await authStorage.clearAuth();
    setIsLoggedIn(false);
  }, []);

  const handleBrowseOysters = useCallback(() => {
    setShowLoading(true);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATION_CONFIG.FADE_DURATION,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: ANIMATION_CONFIG.FADE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        navigation.navigate('OysterList');
        setShowLoading(false);
      });
    }, ANIMATION_CONFIG.TRANSITION_DELAY);
  }, [fadeAnim, navigation]);

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

        {isLoggedIn && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Profile')}
            style={styles.button}
            icon="account"
            contentStyle={styles.buttonContent}
          >
            My Profile
          </Button>
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

        {!isLoggedIn && (
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
    width: LOGO_SIZES.NORMAL,
    height: LOGO_SIZES.NORMAL,
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
    width: LOGO_SIZES.LOADING,
    height: LOGO_SIZES.LOADING,
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
    overflow: 'visible',
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
    paddingBottom: 20,
    overflow: 'visible',
  },
});
