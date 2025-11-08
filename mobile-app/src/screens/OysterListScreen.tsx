/**
 * OysterListScreen - Migrated to React Native Paper
 *
 * Main oyster browsing screen with comprehensive filtering and search capabilities.
 *
 * Features:
 * - Real-time fuzzy search with backend integration
 * - Advanced attribute-based filtering with binary choices
 * - Bidirectional sorting with visual indicators
 * - Expandable/collapsible filter section
 * - All/Favorites view toggle
 * - Pull-to-refresh functionality
 * - Haptic feedback on favorite toggle
 * - Skeleton loading states
 * - Empty states for different scenarios (no favorites, no search results, etc.)
 * - Auto-clear filters when searching (search overrides filters)
 * - Back button navigation to Home (prevents app exit)
 * - Theme-aware styling via React Native Paper
 *
 * Material Design Components:
 * - Card: Elevated oyster cards with onPress
 * - Searchbar: Built-in search input with icon
 * - SegmentedButtons: All/Favorites toggle
 * - Chip: Sort option selectors with selected state
 * - ToggleButton.Row: Binary attribute filters (Sweet/Briny, Small/Big, etc.)
 * - IconButton: Filter toggle, favorite hearts, FAB
 * - Badge: Active filter count indicator
 * - Button: Clear all filters action
 * - Banner: Error messages with retry action
 * - Text: Typography with variants
 *
 * Migration Benefits:
 * - ~50% less custom styling (Paper handles most UI)
 * - Built-in theme integration (light/dark mode)
 * - Material Design ripple effects
 * - Better accessibility (screen readers, touch targets)
 * - Consistent look with rest of app
 * - Automatic elevation and shadows
 * - Professional search bar with built-in icons
 *
 * Filters:
 * - Sort By: name, rating, size, sweetness, creaminess, flavorfulness, body
 * - Sort Direction: asc/desc with visual arrow indicators (↑/↓)
 * - Attribute Filters (binary low/high):
 *   - Sweetness: Sweet (<4) vs Briny (>6)
 *   - Size: Small (<4) vs Big (>6)
 *   - Body: Thin (<4) vs Fat (>6)
 *   - Flavorfulness: Mild (<4) vs Bold (>6)
 *   - Creaminess: No Cream (<4) vs All the Cream (>6)
 * - Active filter count badge on filter button
 * - Clear All Filters button (appears when filters active)
 *
 * State Management:
 * - oysters: Full list from backend (filtered by API params)
 * - favorites: Local set of favorited oyster IDs
 * - showFavoritesOnly: Client-side filter for favorites view
 * - selectedSortBy/sortDirection: Active sort values
 * - sweetness/size/body/flavorfulness/creaminess: Attribute filter values
 * - showFilters: Toggle for expandable filter section
 *
 * Flow:
 * 1. Loads oysters on mount
 * 2. Re-fetches oysters when filters change (useEffect)
 * 3. Checks auth status on screen focus
 * 4. Syncs favorites with local storage
 * 5. Client-side filtering for favorites view
 *
 * Card Display:
 * - Oyster name with favorite heart icon
 * - Species badge (if not "Unknown")
 * - Origin (if not "Unknown")
 * - RatingDisplay component with overall score
 * - Standout notes preview (2 lines max)
 * - 5 attribute scores (Size, Body, Sweet/Briny, Flavor, Creamy)
 * - Review count
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
  Image,
  BackHandler,
} from 'react-native';
import {
  Text,
  Card,
  Searchbar,
  Chip,
  SegmentedButtons,
  IconButton,
  Badge,
  Button,
  Banner,
  ToggleButton,
  ActivityIndicator,
} from 'react-native-paper';
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
  const { theme, isDark, paperTheme } = useTheme();
  const [oysters, setOysters] = useState<Oyster[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Filter states
  const [selectedSortBy, setSelectedSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sweetness, setSweetness] = useState<'low' | 'high' | ''>('');
  const [size, setSize] = useState<'low' | 'high' | ''>('');
  const [body, setBody] = useState<'low' | 'high' | ''>('');
  const [flavorfulness, setFlavorfulness] = useState<'low' | 'high' | ''>('');
  const [creaminess, setCreaminess] = useState<'low' | 'high' | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  // Ref for scrolling to top when filters change
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchOysters();
    loadFavorites();
    checkAuth();
  }, []);

  useEffect(() => {
    // Refetch when filters change and scroll to top
    if (!loading) {
      fetchOysters();
      // Scroll to top of list when filters change
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [selectedSortBy, sortDirection, sweetness, size, body, flavorfulness, creaminess]);

  useFocusEffect(
    React.useCallback(() => {
      checkAuth();
    }, [])
  );

  // Handle Android back button - navigate to Home instead of exiting app
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('Home');
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [navigation]);

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

      // Build filter params
      const params: any = {};
      if (selectedSortBy) params.sortBy = selectedSortBy;
      if (sortDirection) params.sortDirection = sortDirection;
      if (sweetness) params.sweetness = sweetness;
      if (size) params.size = size;
      if (body) params.body = body;
      if (flavorfulness) params.flavorfulness = flavorfulness;
      if (creaminess) params.creaminess = creaminess;

      const data = await oysterApi.getAll(params);
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

    // Clear all filters when user starts searching
    if (query.trim() !== '') {
      setSweetness('');
      setSize('');
      setBody('');
      setFlavorfulness('');
      setCreaminess('');
    }

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

  const getActiveFilterCount = () => {
    let count = 0;
    if (sweetness) count++;
    if (size) count++;
    if (body) count++;
    if (flavorfulness) count++;
    if (creaminess) count++;
    return count;
  };

  const clearAllFilters = () => {
    setSweetness('');
    setSize('');
    setBody('');
    setFlavorfulness('');
    setCreaminess('');
    setSelectedSortBy('name');
    setSortDirection('asc');
  };

  const handleSortByClick = (sortValue: string) => {
    if (selectedSortBy === sortValue) {
      // Toggle direction if clicking same sort option
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New sort option - set default direction
      setSelectedSortBy(sortValue);
      setSortDirection(sortValue === 'name' ? 'asc' : 'desc');
    }
  };

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'rating', label: 'Rating' },
    { value: 'size', label: 'Size' },
    { value: 'sweetness', label: 'Sweetness' },
    { value: 'creaminess', label: 'Creaminess' },
    { value: 'flavorfulness', label: 'Flavor' },
    { value: 'body', label: 'Body' },
  ];

  const attributeFilters = [
    { key: 'sweetness', state: sweetness, setState: setSweetness, low: 'Sweet', high: 'Briny' },
    { key: 'size', state: size, setState: setSize, low: 'Small', high: 'Big' },
    { key: 'body', state: body, setState: setBody, low: 'Thin', high: 'Fat' },
    { key: 'flavorfulness', state: flavorfulness, setState: setFlavorfulness, low: 'Mild', high: 'Bold' },
    { key: 'creaminess', state: creaminess, setState: setCreaminess, low: 'No Cream', high: 'All the Cream' },
  ];

  const styles = createStyles(theme.colors, isDark);

  const renderOysterItem = ({ item }: { item: Oyster }) => (
    <Card
      mode="elevated"
      style={styles.card}
      onPress={() => navigation.navigate('OysterDetail', { oysterId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.oysterName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.headerRight}>
            <IconButton
              icon={favorites.has(item.id) ? 'heart' : 'heart-outline'}
              iconColor={favorites.has(item.id) ? '#e74c3c' : undefined}
              size={20}
              onPress={(e) => {
                e.stopPropagation();
                handleToggleFavorite(item.id, e);
              }}
              style={styles.favoriteButton}
            />
            {item.species && item.species !== 'Unknown' && (
              <Chip mode="outlined" compact style={styles.speciesChip}>
                {item.species}
              </Chip>
            )}
          </View>
        </View>

        {item.origin && item.origin !== 'Unknown' && (
          <Text variant="bodySmall" style={styles.origin}>{item.origin}</Text>
        )}

      <View style={styles.ratingContainer}>
        <RatingDisplay
          overallScore={item.overallScore}
          totalReviews={item.totalReviews}
          size="small"
        />
      </View>

      {item.standoutNotes && (
        <Text variant="bodySmall" style={styles.notes} numberOfLines={2}>
          {item.standoutNotes}
        </Text>
      )}

      <View style={styles.attributesContainer}>
        <View style={styles.attributeItem}>
          <Text variant="labelSmall" style={styles.attributeLabel}>Size</Text>
          <Text variant="bodyMedium" style={styles.attributeValue}>{item.size}/10</Text>
        </View>
        <View style={styles.attributeItem}>
          <Text variant="labelSmall" style={styles.attributeLabel}>Body</Text>
          <Text variant="bodyMedium" style={styles.attributeValue}>{item.body}/10</Text>
        </View>
        <View style={styles.attributeItem}>
          <Text variant="labelSmall" style={styles.attributeLabel}>Sweet/Briny</Text>
          <Text variant="bodyMedium" style={styles.attributeValue}>{item.sweetBrininess}/10</Text>
        </View>
        <View style={styles.attributeItem}>
          <Text variant="labelSmall" style={styles.attributeLabel}>Flavor</Text>
          <Text variant="bodyMedium" style={styles.attributeValue}>{item.flavorfulness}/10</Text>
        </View>
        <View style={styles.attributeItem}>
          <Text variant="labelSmall" style={styles.attributeLabel}>Creamy</Text>
          <Text variant="bodyMedium" style={styles.attributeValue}>{item.creaminess}/10</Text>
        </View>
      </View>

        {item._count && (
          <Text variant="bodySmall" style={styles.reviewCount}>
            {item._count.reviews} {item._count.reviews === 1 ? 'review' : 'reviews'}
          </Text>
        )}
      </Card.Content>
    </Card>
  );


  if (loading && oysters.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.topRow}>
            <SegmentedButtons
              value={showFavoritesOnly ? 'favorites' : 'all'}
              onValueChange={(value) => setShowFavoritesOnly(value === 'favorites')}
              buttons={[
                { value: 'all', label: 'All' },
                { value: 'favorites', label: '❤️ Favorites' },
              ]}
              style={styles.segmentedButtons}
            />

            <IconButton
              icon="filter"
              mode="contained"
              size={20}
              onPress={() => setShowFilters(!showFilters)}
              style={styles.filterIconButton}
            />
            {getActiveFilterCount() > 0 && (
              <Badge style={styles.filterBadge}>{getActiveFilterCount()}</Badge>
            )}
          </View>

          <Searchbar
            placeholder="Search oysters..."
            value={searchQuery}
            onChangeText={handleSearch}
            style={styles.searchBar}
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
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.topRow}>
          <SegmentedButtons
            value={showFavoritesOnly ? 'favorites' : 'all'}
            onValueChange={(value) => setShowFavoritesOnly(value === 'favorites')}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'favorites', label: '❤️ Favorites' },
            ]}
            style={styles.segmentedButtons}
          />

          <IconButton
            icon="filter"
            mode="contained"
            size={20}
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterIconButton}
          />
          {getActiveFilterCount() > 0 && (
            <Badge style={styles.filterBadge}>{getActiveFilterCount()}</Badge>
          )}
        </View>

        <Searchbar
          placeholder="Search oysters..."
          value={searchQuery}
          onChangeText={handleSearch}
          style={styles.searchBar}
        />

        {showFilters && (
          <View style={styles.filterSection}>
            <Text variant="titleSmall" style={styles.filterSectionTitle}>Sort By</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
              {sortOptions.map((option) => (
                <Chip
                  key={option.value}
                  mode={selectedSortBy === option.value ? 'flat' : 'outlined'}
                  selected={selectedSortBy === option.value}
                  onPress={() => handleSortByClick(option.value)}
                  style={styles.filterChip}
                >
                  {option.label}{selectedSortBy === option.value && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </Chip>
              ))}
            </ScrollView>

            {attributeFilters.map((filter) => (
              <ToggleButton.Row
                key={filter.key}
                value={filter.state}
                onValueChange={(value) => filter.setState(value === filter.state ? '' : value)}
                style={styles.attributeFilterRow}
              >
                <ToggleButton
                  icon={() => <Text variant="bodyMedium">{filter.low}</Text>}
                  value="low"
                  style={styles.attributeFilterButton}
                />
                <ToggleButton
                  icon={() => <Text variant="bodyMedium">{filter.high}</Text>}
                  value="high"
                  style={styles.attributeFilterButton}
                />
              </ToggleButton.Row>
            ))}

            {getActiveFilterCount() > 0 && (
              <Button
                mode="outlined"
                onPress={clearAllFilters}
                icon="close"
                style={styles.clearFiltersButton}
                textColor={paperTheme.colors.error}
              >
                Clear All Filters
              </Button>
            )}
          </View>
        )}
      </View>

      {error && (
        <Banner
          visible={true}
          icon="alert-circle"
          actions={[
            {
              label: 'Retry',
              onPress: () => fetchOysters(),
            },
          ]}
          style={styles.errorBanner}
        >
          {error}
        </Banner>
      )}

      <FlatList
        ref={flatListRef}
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

      <IconButton
        icon="plus"
        mode="contained"
        size={28}
        onPress={() => navigation.navigate('AddOyster')}
        style={styles.fab}
        iconColor="#fff"
      />
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
    logo: {
      width: 150,
      height: 40,
      alignSelf: 'center',
      marginBottom: 15,
    },
    topRow: {
      flexDirection: 'row',
      marginBottom: 15,
      gap: 10,
      alignItems: 'center',
    },
    segmentedButtons: {
      flex: 1,
    },
    filterIconButton: {
      margin: 0,
    },
    filterBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
    },
    searchBar: {
      marginBottom: 0,
    },
    filterSection: {
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    filterSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
      marginTop: 10,
    },
    chipScrollView: {
      marginBottom: 10,
    },
    filterChip: {
      marginRight: 8,
    },
    clearFiltersButton: {
      marginTop: 10,
    },
    attributeFilterRow: {
      marginBottom: 12,
    },
    attributeFilterButton: {
      flex: 1,
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
  speciesChip: {
    height: 24,
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
  errorBanner: {
    marginHorizontal: 15,
    marginVertical: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.success,
  },
});
