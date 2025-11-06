import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { OysterListScreenNavigationProp } from '../navigation/types';
import { oysterApi } from '../services/api';
import { favoritesStorage } from '../services/favorites';
import { authStorage } from '../services/auth';
import { Oyster } from '../types/Oyster';
import { RatingDisplay } from '../components/RatingDisplay';
import { EmptyState } from '../components/EmptyState';
import { OysterCardSkeleton } from '../components/OysterCardSkeleton';
import { useTheme } from '../context/ThemeContext';

export default function OysterListScreen() {
  const navigation = useNavigation<OysterListScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const [oysters, setOysters] = useState<Oyster[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchOysters();
    loadFavorites();
    checkAuth();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkAuth();
    }, [])
  );

  const checkAuth = async () => {
    const token = await authStorage.getToken();
    setIsLoggedIn(!!token);
  };

  const loadFavorites = async () => {
    const favs = await favoritesStorage.getFavorites();
    setFavorites(new Set(favs));
  };

  const fetchOysters = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await oysterApi.getAll();
      setOysters(data);
    } catch (err) {
      setError('Failed to load oysters. Please check your backend connection.');
      console.error('Error fetching oysters:', err);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    fetchOysters(true);
  };

  const handleToggleFavorite = async (oysterId: string, e: any) => {
    e.stopPropagation(); // Prevent card navigation
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = await favoritesStorage.toggleFavorite(oysterId);
    if (newState) {
      setFavorites(prev => new Set([...prev, oysterId]));
    } else {
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(oysterId);
        return next;
      });
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      fetchOysters();
      return;
    }

    try {
      setLoading(true);
      const data = await oysterApi.search(query);
      setOysters(data);
    } catch (err) {
      console.error('Error searching oysters:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOysters = () => {
    if (!showFavoritesOnly) {
      return oysters;
    }
    return oysters.filter(oyster => favorites.has(oyster.id));
  };

  const styles = createStyles(theme.colors, isDark);

  const renderOysterItem = ({ item }: { item: Oyster }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('OysterDetail', { oysterId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.oysterName}>{item.name}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={(e) => handleToggleFavorite(item.id, e)}
            style={styles.favoriteButton}
          >
            <Text style={styles.favoriteIcon}>
              {favorites.has(item.id) ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
          {item.species && item.species !== 'Unknown' && (
            <View style={styles.speciesContainer}>
              <Text style={styles.species}>{item.species}</Text>
            </View>
          )}
        </View>
      </View>

      {item.origin && item.origin !== 'Unknown' && (
        <View style={styles.originContainer}>
          <Text style={styles.origin}>{item.origin}</Text>
        </View>
      )}

      <View style={styles.ratingContainer}>
        <RatingDisplay
          overallScore={item.overallScore}
          totalReviews={item.totalReviews}
          size="small"
        />
      </View>

      {item.standoutNotes && (
        <Text style={styles.notes} numberOfLines={2}>
          {item.standoutNotes}
        </Text>
      )}

      <View style={styles.attributesContainer}>
        <View style={styles.attributeItem}>
          <Text style={styles.attributeLabel}>Size</Text>
          <Text style={styles.attributeValue}>{item.size}/10</Text>
        </View>
        <View style={styles.attributeItem}>
          <Text style={styles.attributeLabel}>Body</Text>
          <Text style={styles.attributeValue}>{item.body}/10</Text>
        </View>
        <View style={styles.attributeItem}>
          <Text style={styles.attributeLabel}>Sweet/Briny</Text>
          <Text style={styles.attributeValue}>{item.sweetBrininess}/10</Text>
        </View>
        <View style={styles.attributeItem}>
          <Text style={styles.attributeLabel}>Flavor</Text>
          <Text style={styles.attributeValue}>{item.flavorfulness}/10</Text>
        </View>
        <View style={styles.attributeItem}>
          <Text style={styles.attributeLabel}>Creamy</Text>
          <Text style={styles.attributeValue}>{item.creaminess}/10</Text>
        </View>
      </View>

      {item._count && (
        <Text style={styles.reviewCount}>
          {item._count.reviews} {item._count.reviews === 1 ? 'review' : 'reviews'}
        </Text>
      )}
    </TouchableOpacity>
  );


  if (loading && oysters.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {!isLoggedIn && (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.title}>Oyster Collection</Text>
            <View style={styles.placeholderRight} />
          </View>

          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[styles.filterTab, !showFavoritesOnly && styles.filterTabActive]}
              onPress={() => setShowFavoritesOnly(false)}
            >
              <Text style={[styles.filterTabText, !showFavoritesOnly && styles.filterTabTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, showFavoritesOnly && styles.filterTabActive]}
              onPress={() => setShowFavoritesOnly(true)}
            >
              <Text style={[styles.filterTabText, showFavoritesOnly && styles.filterTabTextActive]}>
                ❤️ Favorites
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search oysters..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <View style={styles.listContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <OysterCardSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {!isLoggedIn && (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Oyster Collection</Text>
          <View style={styles.placeholderRight} />
        </View>

        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, !showFavoritesOnly && styles.filterTabActive]}
            onPress={() => setShowFavoritesOnly(false)}
          >
            <Text style={[styles.filterTabText, !showFavoritesOnly && styles.filterTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, showFavoritesOnly && styles.filterTabActive]}
            onPress={() => setShowFavoritesOnly(true)}
          >
            <Text style={[styles.filterTabText, showFavoritesOnly && styles.filterTabTextActive]}>
              ❤️ Favorites
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search oysters..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchOysters()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={getFilteredOysters()}
        renderItem={renderOysterItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          !loading && !error ? (
            showFavoritesOnly ? (
              <EmptyState
                icon="❤️"
                title="No Favorites Yet"
                description="You haven't added any oysters to your favorites. Tap the heart icon on an oyster to save it here!"
                actionLabel="View All Oysters"
                onAction={() => setShowFavoritesOnly(false)}
              />
            ) : searchQuery.trim() !== '' ? (
              <EmptyState
                icon="🔎"
                title="No Oysters Found"
                description={`No results for "${searchQuery}". Try a different search term or browse all oysters.`}
                actionLabel="Clear Search"
                onAction={() => handleSearch('')}
              />
            ) : (
              <EmptyState
                icon="🦪"
                title="No Oysters Available"
                description="The oyster collection is empty. Check back later or add the first oyster!"
              />
            )
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddOyster')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    },
    header: {
      backgroundColor: colors.card,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    loginButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    loginButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    placeholderRight: {
      width: 70,
    },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: isDark ? '#3a5a7a' : '#e8f4f8',
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: colors.inputBackground,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
  },
  listContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  oysterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  speciesContainer: {
    backgroundColor: isDark ? '#2c3e50' : '#e8f4f8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  species: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  originContainer: {
    marginBottom: 8,
  },
  origin: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  ratingContainer: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  notes: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 18,
  },
  attributesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexWrap: 'wrap',
  },
  attributeItem: {
    alignItems: 'center',
    minWidth: '18%',
  },
  attributeLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  attributeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.success,
    marginTop: 8,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: isDark ? '#4a2020' : '#ffe5e5',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.5 : 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  });
