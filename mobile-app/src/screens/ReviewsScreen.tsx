/**
 * ReviewsScreen
 *
 * Displays all reviews for a user (own or friend's profile).
 * Can be accessed from ProfileScreen by clicking the Reviews stat card.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  ActivityIndicator,
  Appbar,
} from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { reviewApi, userApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Review } from '../types/Oyster';
import { EmptyState } from '../components/EmptyState';
import { authStorage } from '../services/auth';
import { favoritesStorage } from '../services/favorites';
import { useProfileReviews, usePublicProfileReviews } from '../hooks/useQueries';

export default function ReviewsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark, paperTheme } = useTheme();
  const userId = route.params?.userId;
  const userName = route.params?.userName;
  const isViewingOwnReviews = !userId;

  // React Query hooks - conditionally fetch own or public reviews
  const {
    data: ownReviewsData,
    isLoading: ownLoading,
    refetch: refetchOwnReviews
  } = useProfileReviews({ page: 1, limit: 100, sortBy: 'createdAt' });

  const {
    data: publicReviewsData,
    isLoading: publicLoading,
    refetch: refetchPublicReviews
  } = usePublicProfileReviews(userId || '');

  // Use appropriate data based on viewing context
  const loading = isViewingOwnReviews ? ownLoading : publicLoading;
  const refetchReviews = isViewingOwnReviews ? refetchOwnReviews : refetchPublicReviews;

  // Handle different data structures:
  // - Own reviews: { reviews: Review[], total, page, pages }
  // - Public reviews: Review[]
  const reviews = isViewingOwnReviews
    ? (ownReviewsData?.reviews || [])
    : (publicReviewsData || []);

  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const loadFavorites = useCallback(async () => {
    const favs = await favoritesStorage.getFavorites();
    setFavorites(new Set(favs));
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      refetchReviews();
      loadFavorites();
    }, [refetchReviews, loadFavorites])
  );

  const handleReviewPress = (review: Review) => {
    if (review.oyster?.id) {
      navigation.navigate('OysterDetail', { oysterId: review.oyster.id });
    }
  };

  const handleDeleteReview = async (review: Review, event: any) => {
    event.stopPropagation();

    Alert.alert(
      'Delete Review',
      `Are you sure you want to delete your review for "${review.oyster?.name || 'this oyster'}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reviewApi.delete(review.id);
              setReviews(prevReviews => prevReviews.filter(r => r.id !== review.id));
              Alert.alert('Success', 'Review deleted successfully');
            } catch (error) {
              console.error('Error deleting review:', error);
              Alert.alert('Error', 'Failed to delete review. Please try again.');
            }
          },
        },
      ]
    );
  };

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentUserId = async () => {
      if (isViewingOwnReviews) {
        const user = await authStorage.getUser();
        setCurrentUserId(user?.id || null);
      }
    };
    loadCurrentUserId();
  }, [isViewingOwnReviews]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: paperTheme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    reviewCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadowColor,
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
      color: theme.colors.text,
      flex: 1,
      marginRight: 10,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    userRating: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
      textTransform: 'capitalize',
    },
    favoriteButton: {
      padding: 4,
    },
    deleteButton: {
      padding: 4,
    },
    species: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    origin: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    notes: {
      fontSize: 13,
      color: theme.colors.textSecondary,
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
      borderTopColor: theme.colors.border,
      flexWrap: 'wrap',
    },
    attributeItem: {
      alignItems: 'center',
      minWidth: '18%',
    },
    attributeLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      marginBottom: 4,
      textAlign: 'center',
    },
    attributeValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      color: theme.colors.textSecondary,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} iconColor="#fff" />
          <Appbar.Content 
            title={isViewingOwnReviews ? 'My Reviews' : `${userName || 'User'}'s Reviews`}
            titleStyle={{ color: '#fff', fontWeight: 'bold' }}
          />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" animating={true} />
          <Text variant="bodyLarge" style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} iconColor="#fff" />
        <Appbar.Content 
          title={isViewingOwnReviews ? 'My Reviews' : `${userName || 'User'}'s Reviews`}
          titleStyle={{ color: '#fff', fontWeight: 'bold' }}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refetchReviews();
              setRefreshing(false);
            }}
            tintColor={theme.colors.primary}
          />
        }
      >
        {reviews.length > 0 ? (
          reviews.map((review) => {
            const isOwnReview = isViewingOwnReviews && currentUserId && review.userId === currentUserId;
            const oyster = review.oyster;
            if (!oyster) return null;

            return (
              <Card
                key={review.id}
                mode="elevated"
                style={styles.reviewCard}
                onPress={() => handleReviewPress(review)}
              >
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium" style={styles.oysterName} numberOfLines={2}>
                      {oyster.name}
                    </Text>
                    <View style={styles.headerRight}>
                      <Text variant="bodyMedium" style={styles.userRating}>
                        {review.rating.replace('_', ' ')}
                      </Text>
                      {oyster.id && (
                        <IconButton
                          icon={favorites.has(oyster.id) ? 'heart' : 'heart-outline'}
                          iconColor={favorites.has(oyster.id) ? '#e74c3c' : undefined}
                          size={20}
                          onPress={(e) => handleToggleFavorite(oyster.id, e)}
                          style={styles.favoriteButton}
                        />
                      )}
                      {isOwnReview && (
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={(event) => handleDeleteReview(review, event)}
                          style={styles.deleteButton}
                        />
                      )}
                    </View>
                  </View>

                  {oyster.species && oyster.species !== 'Unknown' && (
                    <Text variant="bodySmall" style={styles.species}>{oyster.species}</Text>
                  )}

                  {oyster.origin && oyster.origin !== 'Unknown' && (
                    <Text variant="bodySmall" style={styles.origin}>{oyster.origin}</Text>
                  )}

                  {oyster.standoutNotes && (
                    <Text variant="bodySmall" style={styles.notes} numberOfLines={2}>
                      {oyster.standoutNotes}
                    </Text>
                  )}

                  <View style={styles.attributesContainer}>
                    <View style={styles.attributeItem}>
                      <Text variant="labelSmall" style={styles.attributeLabel}>Size</Text>
                      <Text variant="bodyMedium" style={styles.attributeValue}>{review.size || 5}/10</Text>
                    </View>
                    <View style={styles.attributeItem}>
                      <Text variant="labelSmall" style={styles.attributeLabel}>Body</Text>
                      <Text variant="bodyMedium" style={styles.attributeValue}>{review.body || 5}/10</Text>
                    </View>
                    <View style={styles.attributeItem}>
                      <Text variant="labelSmall" style={styles.attributeLabel}>Brine</Text>
                      <Text variant="bodyMedium" style={styles.attributeValue}>{review.sweetBrininess || 5}/10</Text>
                    </View>
                    <View style={styles.attributeItem}>
                      <Text variant="labelSmall" style={styles.attributeLabel}>Flavor</Text>
                      <Text variant="bodyMedium" style={styles.attributeValue}>{review.flavorfulness || 5}/10</Text>
                    </View>
                    <View style={styles.attributeItem}>
                      <Text variant="labelSmall" style={styles.attributeLabel}>Cream</Text>
                      <Text variant="bodyMedium" style={styles.attributeValue}>{review.creaminess || 5}/10</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        ) : (
          <EmptyState
            icon="📝"
            title="No Reviews Yet"
            description={
              isViewingOwnReviews
                ? "You haven't written any reviews yet. Start exploring oysters and share your tasting experiences!"
                : `${userName || 'This user'} hasn't written any reviews yet.`
            }
            actionLabel={isViewingOwnReviews ? "Browse Oysters" : undefined}
            onAction={isViewingOwnReviews ? () => navigation.navigate('OysterList') : undefined}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

