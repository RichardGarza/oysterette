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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { OysterListScreenNavigationProp } from '../navigation/types';
import { oysterApi } from '../services/api';
import { favoritesStorage } from '../services/favorites';
import { Oyster } from '../types/Oyster';
import { RatingDisplay } from '../components/RatingDisplay';
import { EmptyState } from '../components/EmptyState';
import { OysterCardSkeleton } from '../components/OysterCardSkeleton';

export default function OysterListScreen() {
  const navigation = useNavigation<OysterListScreenNavigationProp>();
  const [oysters, setOysters] = useState<Oyster[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    fetchOysters();
    loadFavorites();
  }, []);

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
          <View style={styles.speciesContainer}>
            <Text style={styles.species}>{item.species}</Text>
          </View>
        </View>
      </View>

      <View style={styles.originContainer}>
        <Text style={styles.origin}>{item.origin}</Text>
      </View>

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
            <Text style={styles.title}>Oyster Collection</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
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
          <Text style={styles.title}>Oyster Collection</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    color: '#2c3e50',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
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
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: '#e8f4f8',
    borderColor: '#3498db',
  },
  filterTabText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#3498db',
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  listContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#2c3e50',
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
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  species: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  originContainer: {
    marginBottom: 8,
  },
  origin: {
    fontSize: 14,
    color: '#555',
  },
  ratingContainer: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  notes: {
    fontSize: 13,
    color: '#7f8c8d',
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
    borderTopColor: '#ecf0f1',
    flexWrap: 'wrap',
  },
  attributeItem: {
    alignItems: 'center',
    minWidth: '18%',
  },
  attributeLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginBottom: 4,
    textAlign: 'center',
  },
  attributeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
  reviewCount: {
    fontSize: 12,
    color: '#27ae60',
    marginTop: 8,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffe5e5',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#e74c3c',
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
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
});
