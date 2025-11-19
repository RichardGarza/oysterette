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
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  ActivityIndicator,
  Appbar,
} from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { reviewApi, userApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Review } from '../types/Oyster';
import { EmptyState } from '../components/EmptyState';
import { authStorage } from '../services/auth';

export default function ReviewsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark, paperTheme } = useTheme();
  const userId = route.params?.userId;
  const userName = route.params?.userName;
  const isViewingOwnReviews = !userId;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReviews = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (userId) {
        // Viewing friend's reviews
        const data = await reviewApi.getPublicUserReviews(userId);
        setReviews(data || []);
      } else {
        // Viewing own reviews - use getMyReviews which returns paginated response
        const reviewHistory = await userApi.getMyReviews({ 
          page: 1, 
          limit: 100, 
          sortBy: 'createdAt' 
        });
        setReviews(reviewHistory.reviews || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews. Please try again.');
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useFocusEffect(
    useCallback(() => {
      loadReviews(true);
    }, [loadReviews])
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
      marginBottom: 12,
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    reviewHeaderLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    oysterName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    reviewRating: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      textTransform: 'capitalize',
    },
    deleteButton: {
      // Paper IconButton handles styling
    },
    reviewNotes: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    reviewFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    reviewDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    reviewVotes: {
      fontSize: 12,
      color: theme.colors.textSecondary,
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
            onRefresh={() => loadReviews(true)}
            tintColor={theme.colors.primary}
          />
        }
      >
        {reviews.length > 0 ? (
          reviews.map((review) => {
            const isOwnReview = isViewingOwnReviews && currentUserId && review.userId === currentUserId;
            return (
              <Card
                key={review.id}
                mode="elevated"
                style={styles.reviewCard}
                onPress={() => handleReviewPress(review)}
              >
                <Card.Content>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewHeaderLeft}>
                      <Text variant="titleMedium" style={styles.oysterName}>
                        {review.oyster?.name || 'Unknown Oyster'}
                      </Text>
                      <Text variant="bodyMedium" style={styles.reviewRating}>
                        {review.rating.replace('_', ' ')}
                      </Text>
                    </View>
                    {isOwnReview && (
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={(event) => handleDeleteReview(review, event)}
                        style={styles.deleteButton}
                      />
                    )}
                  </View>
                  {review.notes && (
                    <Text variant="bodyMedium" style={styles.reviewNotes} numberOfLines={3}>
                      {review.notes}
                    </Text>
                  )}
                  <View style={styles.reviewFooter}>
                    <Text variant="bodySmall" style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                    {(review.agreeCount > 0 || review.disagreeCount > 0) && (
                      <Text variant="bodySmall" style={styles.reviewVotes}>
                        👍 {review.agreeCount || 0} · 👎 {review.disagreeCount || 0}
                      </Text>
                    )}
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

