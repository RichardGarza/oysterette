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
  FlatList,
  ScrollView,
  BackHandler,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Button,
  Text,
  ActivityIndicator,
  Card,
  Surface,
  Searchbar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { HomeScreenNavigationProp } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { authStorage } from '../services/auth';
import { favoritesStorage } from '../services/favorites';
import { recommendationApi, userApi, oysterApi } from '../services/api';
import { Oyster } from '../types/Oyster';
import RecommendedOysterCard from '../components/RecommendedOysterCard';

// ============================================================================
// CONSTANTS
// ============================================================================

const LOGO_SIZES = {
  NORMAL: 256,
} as const;

const RECOMMENDATIONS_LIMIT = 5;

const LAST_UPDATED = '02:15 PM';
const TOP_RATED_LIMIT = 5;

// ============================================================================
// COMPONENT
// ============================================================================

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme, loadUserTheme, paperTheme } = useTheme();
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [recommendations, setRecommendations] = useState<Oyster[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [topRated, setTopRated] = useState<Oyster[]>([]);
  const [userStats, setUserStats] = useState({ reviews: 0, favorites: 0, oystersTried: 0 });
  const [totalOysters, setTotalOysters] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');


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
      // Use hybrid recommendations for best results (combines attribute + collaborative)
      const recs = await recommendationApi.getHybrid(RECOMMENDATIONS_LIMIT);
      setRecommendations(recs);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [HomeScreen] Error loading recommendations:', error);
      }
      // Fallback to attribute-based if hybrid fails
      try {
        const fallbackRecs = await recommendationApi.getRecommendations(RECOMMENDATIONS_LIMIT);
        setRecommendations(fallbackRecs);
      } catch (fallbackError) {
        if (__DEV__) {
          console.error('❌ [HomeScreen] Fallback recommendations also failed:', fallbackError);
        }
      }
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);

  const loadTopRated = useCallback(async () => {
    try {
      const data = await oysterApi.getAll();
      setTotalOysters(data.length);
      const sorted = data
        .filter(oyster => oyster.totalReviews > 0)
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, TOP_RATED_LIMIT);
      setTopRated(sorted);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [HomeScreen] Error loading top rated:', error);
      }
    }
  }, []);

  const loadUserStats = useCallback(async () => {
    try {
      const profile = await userApi.getProfile();
      setUserStats({
        reviews: profile.stats?.totalReviews || 0,
        favorites: profile.stats?.totalFavorites || 0,
        oystersTried: profile.stats?.totalReviews || 0,
      });
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [HomeScreen] Error loading user stats:', error);
      }
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = await authStorage.getToken();
      const user = await authStorage.getUser();

      if (token && user) {
        await loadUserTheme(user);
        favoritesStorage.syncWithBackend();
        setIsLoggedIn(true);
        setChecking(false);
        loadRecommendations();
        loadUserStats();
      } else {
        setIsLoggedIn(false);
        setChecking(false);
      }
      loadTopRated();
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [HomeScreen] Error checking auth:', error);
      }
      setIsLoggedIn(false);
      setChecking(false);
    }
  }, [loadUserTheme, loadRecommendations, loadUserStats, loadTopRated]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', checkAuth);
    return unsubscribe;
  }, [navigation, checkAuth]);

  const handleLogout = useCallback(async () => {
    await authStorage.clearAuth();
    setIsLoggedIn(false);
  }, []);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      navigation.navigate('OysterList', { searchQuery: searchQuery.trim() });
      setSearchQuery('');
    }
  }, [searchQuery, navigation]);

  const handleBrowseOysters = useCallback(() => {
    navigation.navigate('OysterList');
  }, [navigation]);

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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text variant="headlineSmall" style={styles.welcome}>
          Welcome to Oysterette
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Discover and review oysters from around the world
        </Text>

        {/* Search Bar */}
        <Searchbar
          placeholder="Search oysters..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          onIconPress={handleSearch}
          style={styles.searchBar}
        />

        {/* Quick Stats */}
        {isLoggedIn && (
          <View style={styles.statsContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile' as any)} activeOpacity={0.7}>
              <Surface style={styles.statCard} elevation={1}>
                <Text variant="headlineSmall" style={styles.statNumber}>{userStats.reviews}</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Reviews</Text>
              </Surface>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('OysterList' as any)} activeOpacity={0.7}>
              <Surface style={styles.statCard} elevation={1}>
                <Text variant="headlineSmall" style={styles.statNumber}>{userStats.favorites}</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Favorites</Text>
              </Surface>
            </TouchableOpacity>
          </View>
        )}

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

        {/* Top Rated This Week */}
        {topRated.length > 0 && (
          <View style={styles.topRatedSection}>
            <Text variant="headlineSmall" style={styles.sectionTitle}>
              Top Rated Oysters
            </Text>
            <FlatList
              data={topRated}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RecommendedOysterCard
                  oyster={item}
                  onPress={() => navigation.navigate('OysterDetail', { oysterId: item.id })}
                />
              )}
              contentContainerStyle={styles.topRatedList}
            />
          </View>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsContainer}>
          <Text variant="headlineSmall" style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <Card mode="elevated" style={styles.actionCard} onPress={handleBrowseOysters}>
              <Card.Content style={styles.actionCardContent}>
                <Text variant="headlineMedium" style={styles.actionIcon}>🔍</Text>
                <Text variant="titleMedium" style={styles.actionTitle}>Browse All</Text>
              </Card.Content>
            </Card>

            <Card mode="elevated" style={styles.actionCard} onPress={() => navigation.navigate('ScanMenu')}>
              <Card.Content style={styles.actionCardContent}>
                <Text variant="headlineMedium" style={styles.actionIcon}>📸</Text>
                <Text variant="titleMedium" style={styles.actionTitle}>Scan Menu</Text>
              </Card.Content>
            </Card>

            {isLoggedIn && (
              <Card mode="elevated" style={styles.actionCard} onPress={() => navigation.navigate('Friends')}>
                <Card.Content style={styles.actionCardContent}>
                  <Text variant="headlineMedium" style={styles.actionIcon}>👥</Text>
                  <Text variant="titleMedium" style={styles.actionTitle}>Friends</Text>
                </Card.Content>
              </Card>
            )}

            <Card mode="elevated" style={styles.actionCard} onPress={() => navigation.navigate('TopOysters')}>
              <Card.Content style={styles.actionCardContent}>
                <Text variant="headlineMedium" style={styles.actionIcon}>🏆</Text>
                <Text variant="titleMedium" style={styles.actionTitle}>Top Oysters</Text>
              </Card.Content>
            </Card>

            <Card mode="elevated" style={styles.actionCard} onPress={() => navigation.navigate('AddOyster')}>
              <Card.Content style={styles.actionCardContent}>
                <Text variant="headlineMedium" style={styles.actionIcon}>➕</Text>
                <Text variant="titleMedium" style={styles.actionTitle}>Add Oyster</Text>
              </Card.Content>
            </Card>

            {isLoggedIn ? (
              <Card mode="elevated" style={styles.actionCard} onPress={() => navigation.navigate('Profile')}>
                <Card.Content style={styles.actionCardContent}>
                  <Text variant="headlineMedium" style={styles.actionIcon}>👤</Text>
                  <Text variant="titleMedium" style={styles.actionTitle}>My Profile</Text>
                </Card.Content>
              </Card>
            ) : (
              <Card mode="elevated" style={styles.actionCard} onPress={() => navigation.navigate('Login')}>
                <Card.Content style={styles.actionCardContent}>
                  <Text variant="headlineMedium" style={styles.actionIcon}>🔐</Text>
                  <Text variant="titleMedium" style={styles.actionTitle}>Log In</Text>
                </Card.Content>
              </Card>
            )}
          </View>
        </View>

{!isLoggedIn && (
          <Card mode="outlined" style={styles.infoCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.infoText}>
                Explore oyster varieties from around the world with our 10-point
                attribute system. Create an account to add reviews and track your
                favorite oysters.
              </Text>
            </Card.Content>
          </Card>
        )}

        <View style={styles.timestampContainer}>
          <Text variant="bodySmall" style={styles.timestamp}>
            Last Updated: {LAST_UPDATED}
          </Text>
        </View>
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
  loadingText: {
    marginTop: 20,
  },
  welcome: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  searchBar: {
    width: '100%',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statCardFull: {
    flex: 1,
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    opacity: 0.7,
  },
  topRatedSection: {
    width: '100%',
    marginBottom: 24,
  },
  topRatedList: {
    paddingRight: 12,
    paddingBottom: 8,
  },
  quickActionsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    minHeight: 100,
  },
  actionCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionTitle: {
    textAlign: 'center',
  },
  buttonContent: {
    paddingVertical: 8,
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
  timestampContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  timestamp: {
    opacity: 0.6,
  },
});
