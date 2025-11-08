/**
 * OysterListScreen
 *
 * Main oyster browsing screen with search, filtering, and favorites.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Appbar,
  Menu,
  Divider,
} from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { OysterListScreenNavigationProp, RootStackParamList } from '../navigation/types';
import { oysterApi } from '../services/api';
import { favoritesStorage } from '../services/favorites';
import { authStorage } from '../services/auth';
import { Oyster } from '../types/Oyster';
import { RatingDisplay } from '../components/RatingDisplay';
import { EmptyState } from '../components/EmptyState';
import { OysterCardSkeleton } from '../components/OysterCardSkeleton';
import { useTheme } from '../context/ThemeContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  FAVORITE_HEART: '#e74c3c',
} as const;

const SIZES = {
  ICON_SMALL: 20,
  ICON_MEDIUM: 28,
  LOGO_WIDTH: 150,
  LOGO_HEIGHT: 40,
} as const;

const SPACING = {
  PADDING_LARGE: 20,
  PADDING_MEDIUM: 15,
  PADDING_SMALL: 12,
  MARGIN_BOTTOM_LARGE: 15,
  MARGIN_BOTTOM_MEDIUM: 12,
  MARGIN_BOTTOM_SMALL: 10,
  MARGIN_TOP_MEDIUM: 15,
  MARGIN_TOP_SMALL: 10,
  MARGIN_RIGHT_SMALL: 8,
  GAP_MEDIUM: 10,
  BORDER_RADIUS: 12,
  BADGE_TOP: -4,
  BADGE_RIGHT: -4,
} as const;

const BORDERS = {
  WIDTH: 1,
} as const;

const SCROLL = {
  OFFSET_TOP: 0,
} as const;

const ATTRIBUTE_SCALE = {
  MAX: 10,
} as const;

const SKELETON = {
  COUNT: 5,
} as const;

const TEXT = {
  MAX_LINES_TITLE: 1,
  MAX_LINES_NOTES: 2,
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export default function OysterListScreen() {
  const navigation = useNavigation<OysterListScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'OysterList'>>();
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
  const [menuVisible, setMenuVisible] = useState(false);

  // Ref for scrolling to top when filters change
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Set initial search query from navigation params
    if (route.params?.searchQuery) {
      setSearchQuery(route.params.searchQuery);
    }
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

  const checkAuth = useCallback(async () => {
    const token = await authStorage.getToken();
    setIsLoggedIn(!!token);
  }, []);

  const loadFavorites = useCallback(async () => {
    const favs = await favoritesStorage.getFavorites();
    setFavorites(new Set(favs));
  }, []);

  const fetchOysters = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Build filter params
      const params: Record<string, string> = {};
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
      if (__DEV__) {
        console.error('❌ [OysterListScreen] Error fetching oysters:', err);
      }
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [selectedSortBy, sortDirection, sweetness, size, body, flavorfulness, creaminess]);

  const onRefresh = useCallback(() => {
    fetchOysters(true);
  }, [fetchOysters]);

  const handleToggleFavorite = useCallback(async (oysterId: string, e: any) => {
    e.stopPropagation();
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
  }, []);

  const handleLogout = useCallback(async () => {
    setMenuVisible(false);
    await authStorage.clearAuth();
    setIsLoggedIn(false);
    navigation.navigate('Home');
  }, [navigation]);

  const handleSearch = useCallback(async (query: string) => {
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
      if (__DEV__) {
        console.error('❌ [OysterListScreen] Error searching oysters:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchOysters]);

  const getFilteredOysters = useMemo(() => {
    if (!showFavoritesOnly) {
      return oysters;
    }
    return oysters.filter(oyster => favorites.has(oyster.id));
  }, [oysters, showFavoritesOnly, favorites]);

  const getActiveFilterCount = useMemo(() => {
    let count = 0;
    if (sweetness) count++;
    if (size) count++;
    if (body) count++;
    if (flavorfulness) count++;
    if (creaminess) count++;
    return count;
  }, [sweetness, size, body, flavorfulness, creaminess]);

  const clearAllFilters = useCallback(() => {
    setSweetness('');
    setSize('');
    setBody('');
    setFlavorfulness('');
    setCreaminess('');
    setSelectedSortBy('name');
    setSortDirection('asc');
  }, []);

  const handleSortByClick = useCallback((sortValue: string) => {
    if (selectedSortBy === sortValue) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSelectedSortBy(sortValue);
      setSortDirection(sortValue === 'name' ? 'asc' : 'desc');
    }
  }, [selectedSortBy]);

  const sortOptions = useMemo(() => [
    { value: 'name', label: 'Name' },
    { value: 'rating', label: 'Rating' },
    { value: 'size', label: 'Size' },
    { value: 'sweetness', label: 'Sweetness' },
    { value: 'creaminess', label: 'Creaminess' },
    { value: 'flavorfulness', label: 'Flavor' },
    { value: 'body', label: 'Body' },
  ], []);

  const attributeFilters = useMemo(() => [
    { key: 'sweetness', state: sweetness, setState: setSweetness, low: 'Sweet', high: 'Briny' },
    { key: 'size', state: size, setState: setSize, low: 'Small', high: 'Big' },
    { key: 'body', state: body, setState: setBody, low: 'Thin', high: 'Fat' },
    { key: 'flavorfulness', state: flavorfulness, setState: setFlavorfulness, low: 'Mild', high: 'Bold' },
    { key: 'creaminess', state: creaminess, setState: setCreaminess, low: 'No Cream', high: 'All the Cream' },
  ], [sweetness, size, body, flavorfulness, creaminess]);

  const styles = useMemo(
    () => createStyles(theme.colors, isDark),
    [theme.colors, isDark]
  );

  const renderOysterItem = useCallback(({ item }: { item: Oyster }) => (
    <Card
      mode="elevated"
      style={styles.card}
      onPress={() => navigation.navigate('OysterDetail', { oysterId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.oysterName} numberOfLines={TEXT.MAX_LINES_TITLE}>
            {item.name}
          </Text>
          <View style={styles.headerRight}>
            <IconButton
              icon={favorites.has(item.id) ? 'heart' : 'heart-outline'}
              iconColor={favorites.has(item.id) ? COLORS.FAVORITE_HEART : undefined}
              size={SIZES.ICON_SMALL}
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
        <Text variant="bodySmall" style={styles.notes} numberOfLines={TEXT.MAX_LINES_NOTES}>
          {item.standoutNotes}
        </Text>
      )}

      <View style={styles.attributesContainer}>
        <View style={styles.attributeItem}>
          <Text variant="labelSmall" style={styles.attributeLabel}>Size</Text>
          <Text variant="bodyMedium" style={styles.attributeValue}>{item.size}/{ATTRIBUTE_SCALE.MAX}</Text>
        </View>
        <View style={styles.attributeItem}>
          <Text variant="labelSmall" style={styles.attributeLabel}>Body</Text>
          <Text variant="bodyMedium" style={styles.attributeValue}>{item.body}/{ATTRIBUTE_SCALE.MAX}</Text>
        </View>
        <View style={styles.attributeItem}>
          <Text variant="labelSmall" style={styles.attributeLabel}>Sweet/Briny</Text>
          <Text variant="bodyMedium" style={styles.attributeValue}>{item.sweetBrininess}/{ATTRIBUTE_SCALE.MAX}</Text>
        </View>
        <View style={styles.attributeItem}>
          <Text variant="labelSmall" style={styles.attributeLabel}>Flavor</Text>
          <Text variant="bodyMedium" style={styles.attributeValue}>{item.flavorfulness}/{ATTRIBUTE_SCALE.MAX}</Text>
        </View>
        <View style={styles.attributeItem}>
          <Text variant="labelSmall" style={styles.attributeLabel}>Creamy</Text>
          <Text variant="bodyMedium" style={styles.attributeValue}>{item.creaminess}/{ATTRIBUTE_SCALE.MAX}</Text>
        </View>
      </View>

        {item._count && (
          <Text variant="bodySmall" style={styles.reviewCount}>
            {item._count.reviews} {item._count.reviews === 1 ? 'review' : 'reviews'}
          </Text>
        )}
      </Card.Content>
    </Card>
  ), [navigation, favorites, handleToggleFavorite, styles]);


  if (loading && oysters.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header elevated>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoSmall}
            resizeMode="contain"
          />
          <Appbar.Content title="" />
        </Appbar.Header>
        <View style={styles.segmentedContainer}>
          <SegmentedButtons
            value={showFavoritesOnly ? 'favorites' : 'all'}
            onValueChange={(value) => setShowFavoritesOnly(value === 'favorites')}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'favorites', label: '❤️ Favorites' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>
        <View style={styles.listContainer}>
          {Array.from({ length: SKELETON.COUNT }).map((_, i) => (
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
      </View>

      <View style={styles.segmentedContainer}>
          <SegmentedButtons
            value={showFavoritesOnly ? 'favorites' : 'all'}
            onValueChange={(value) => setShowFavoritesOnly(value === 'favorites')}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'favorites', label: '❤️ Favorites' },
            ]}
            style={styles.segmentedButtons}
          />
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
                onValueChange={(value) => filter.setState(value === filter.state ? '' : value as any)}
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

            {getActiveFilterCount > 0 && (
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
        data={getFilteredOysters}
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
        size={SIZES.ICON_MEDIUM}
        onPress={() => navigation.navigate('AddOyster')}
        style={styles.fab}
        iconColor={paperTheme.colors.onPrimary}
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
      padding: SPACING.PADDING_LARGE,
      borderBottomWidth: BORDERS.WIDTH,
      borderBottomColor: colors.border,
    },
    logo: {
      width: SIZES.LOGO_WIDTH,
      height: SIZES.LOGO_HEIGHT,
      alignSelf: 'center',
      marginBottom: SPACING.MARGIN_BOTTOM_LARGE,
    },
    topRow: {
      flexDirection: 'row',
      marginBottom: SPACING.MARGIN_BOTTOM_LARGE,
      gap: SPACING.GAP_MEDIUM,
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
      top: SPACING.BADGE_TOP,
      right: SPACING.BADGE_RIGHT,
    },
    searchBar: {
      marginBottom: 0,
    },
    filterSection: {
      marginTop: SPACING.MARGIN_TOP_MEDIUM,
      paddingTop: SPACING.MARGIN_TOP_MEDIUM,
      borderTopWidth: BORDERS.WIDTH,
      borderTopColor: colors.border,
    },
    filterSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: SPACING.MARGIN_BOTTOM_SMALL,
      marginTop: SPACING.MARGIN_TOP_SMALL,
    },
    chipScrollView: {
      marginBottom: SPACING.MARGIN_BOTTOM_SMALL,
    },
    filterChip: {
      marginRight: SPACING.MARGIN_RIGHT_SMALL,
    },
    clearFiltersButton: {
      marginTop: SPACING.MARGIN_TOP_SMALL,
    },
    attributeFilterRow: {
      marginBottom: SPACING.MARGIN_BOTTOM_MEDIUM,
    },
    attributeFilterButton: {
      flex: 1,
    },
  listContainer: {
    padding: SPACING.PADDING_MEDIUM,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: SPACING.BORDER_RADIUS,
    padding: SPACING.PADDING_MEDIUM,
    marginBottom: SPACING.MARGIN_BOTTOM_LARGE,
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
