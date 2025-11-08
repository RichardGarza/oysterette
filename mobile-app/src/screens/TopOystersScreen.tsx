/**
 * TopOystersScreen - Migrated to React Native Paper
 *
 * Leaderboard display of highest-rated oysters by the community.
 *
 * Features:
 * - Top 50 oysters sorted by overallScore (descending)
 * - Rank badges (#1, #2, #3, etc.)
 * - Filters out oysters with zero reviews
 * - Pull-to-refresh functionality
 * - Skeleton loading states
 * - Numeric rating display (e.g., "8.5/10") + star visualization
 * - RatingDisplay component for scores
 * - Tappable cards navigate to detail view
 * - Theme-aware styling via React Native Paper
 * - Accessible via "🏆 Top Oysters" button on HomeScreen
 *
 * Material Design Components:
 * - Card: Elevated oyster cards with onPress
 * - Chip: Species badges
 * - Text: Typography with variants
 * - Banner: Error messages
 * - Button: Retry button in error banner
 * - Surface: Rank badges
 * - Divider: Section separators
 *
 * Migration Benefits:
 * - Theme awareness (light/dark mode support)
 * - Material Design cards with proper elevation
 * - Chip component for species badges (built-in styling)
 * - Banner for errors (dismissible, action button)
 * - Automatic theme colors
 * - ~40% less custom styling
 * - Better accessibility
 * - Ripple effects on cards
 *
 * Ranking Algorithm:
 * 1. Fetches all oysters from backend
 * 2. Filters to only oysters with totalReviews > 0
 * 3. Sorts by overallScore (highest first)
 * 4. Takes top 50 results
 * 5. Displays with rank badges (#1-#50)
 *
 * State:
 * - oysters: Top 50 oysters array
 * - loading: Initial fetch in progress
 * - refreshing: Pull-to-refresh in progress
 * - error: Error message string or null
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Chip,
  Banner,
  Button,
  Surface,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { OysterListScreenNavigationProp } from '../navigation/types';
import { oysterApi } from '../services/api';
import { Oyster } from '../types/Oyster';
import { RatingDisplay } from '../components/RatingDisplay';
import { OysterCardSkeleton } from '../components/OysterCardSkeleton';
import { useTheme } from '../context/ThemeContext';

export default function TopOystersScreen() {
  const navigation = useNavigation<OysterListScreenNavigationProp>();
  const { paperTheme } = useTheme();
  const [oysters, setOysters] = useState<Oyster[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopOysters();
  }, []);

  const fetchTopOysters = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch all oysters and sort by overallScore
      const data = await oysterApi.getAll();
      const sorted = data
        .filter(oyster => oyster.totalReviews > 0) // Only show oysters with reviews
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, 50); // Top 50

      setOysters(sorted);
    } catch (err) {
      setError('Failed to load top oysters');
      console.error('Error fetching top oysters:', err);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    fetchTopOysters(true);
  };

  const renderOysterItem = ({ item, index }: { item: Oyster; index: number }) => (
    <Card
      mode="elevated"
      style={styles.card}
      onPress={() => navigation.navigate('OysterDetail', { oysterId: item.id })}
    >
      <Card.Content style={styles.cardInner}>
        <Surface style={[styles.rankBadge, { backgroundColor: paperTheme.colors.primary }]} elevation={2}>
          <Text variant="titleMedium" style={[styles.rankText, { color: paperTheme.colors.onPrimary }]}>
            #{index + 1}
          </Text>
        </Surface>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.oysterName} numberOfLines={1}>
              {item.name}
            </Text>
            <Chip mode="outlined" compact style={styles.speciesChip}>
              {item.species}
            </Chip>
          </View>

          <Text variant="bodySmall" style={styles.origin}>{item.origin}</Text>

          <View style={styles.ratingContainer}>
            <Text variant="titleLarge" style={[styles.scoreText, { color: paperTheme.colors.primary }]}>
              {item.overallScore.toFixed(1)}
            </Text>
            <Text variant="bodySmall" style={[styles.scoreLabel, { color: paperTheme.colors.onSurfaceVariant }]}>/10</Text>
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
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && oysters.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineMedium" style={styles.title}>Top Oysters</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Highest-rated by the community</Text>
        </Surface>
        <View style={styles.listContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <OysterCardSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <Surface style={styles.header} elevation={1}>
        <Text variant="headlineMedium" style={styles.title}>Top Oysters</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Highest-rated by the community</Text>
      </Surface>

      {error && (
        <Banner
          visible={true}
          icon="alert-circle"
          actions={[
            {
              label: 'Retry',
              onPress: () => fetchTopOysters(),
            },
          ]}
          style={styles.errorBanner}
        >
          {error}
        </Banner>
      )}

      <FlatList
        data={oysters}
        renderItem={renderOysterItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={paperTheme.colors.primary}
            colors={[paperTheme.colors.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    marginBottom: 5,
  },
  subtitle: {
    // Paper handles styling
  },
  listContainer: {
    padding: 15,
  },
  card: {
    marginBottom: 15,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rankBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    // Color applied dynamically via theme
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  oysterName: {
    flex: 1,
  },
  speciesChip: {
    height: 28,
  },
  origin: {
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    gap: 4,
  },
  scoreText: {
    fontWeight: '700',
    // Color applied dynamically via theme
  },
  scoreLabel: {
    marginRight: 8,
    // Color applied dynamically via theme
  },
  notes: {
    fontStyle: 'italic',
    lineHeight: 16,
  },
  errorBanner: {
    marginHorizontal: 15,
    marginTop: 10,
  },
});
