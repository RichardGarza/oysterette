/**
 * TopOystersScreen
 *
 * Leaderboard of top 50 highest-rated oysters with pull-to-refresh.
 */

import React, { useState, useEffect, useCallback } from 'react';
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

// ============================================================================
// CONSTANTS
// ============================================================================

const TOP_OYSTERS_LIMIT = 50;
const SKELETON_COUNT = 5;

const RANK_BADGE_SIZE = 50;

// ============================================================================
// COMPONENT
// ============================================================================

export default function TopOystersScreen() {
  const navigation = useNavigation<OysterListScreenNavigationProp>();
  const { paperTheme } = useTheme();
  const [oysters, setOysters] = useState<Oyster[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopOysters = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await oysterApi.getAll();
      const sorted = data
        .filter(oyster => oyster.totalReviews > 0)
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, TOP_OYSTERS_LIMIT);

      setOysters(sorted);
    } catch (err) {
      setError('Failed to load top oysters');
      if (__DEV__) {
        console.error('❌ [TopOystersScreen] Error fetching top oysters:', err);
      }
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchTopOysters();
  }, [fetchTopOysters]);

  const onRefresh = useCallback(() => {
    fetchTopOysters(true);
  }, [fetchTopOysters]);

  const renderOysterItem = useCallback(({ item, index }: { item: Oyster; index: number }) => (
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
  ), [navigation, paperTheme]);

  if (loading && oysters.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineMedium" style={styles.title}>Top Oysters</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Highest-rated by the community</Text>
        </Surface>
        <View style={styles.listContainer}>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
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
    width: RANK_BADGE_SIZE,
    height: RANK_BADGE_SIZE,
    borderRadius: RANK_BADGE_SIZE / 2,
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
  },
  scoreLabel: {
    marginRight: 8,
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
