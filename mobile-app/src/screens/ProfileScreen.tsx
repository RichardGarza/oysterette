import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { authStorage } from '../services/auth';
import { reviewApi, voteApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Review } from '../types/Oyster';
import { EmptyState } from '../components/EmptyState';

interface CredibilityData {
  credibilityScore: number;
  badge: {
    level: string;
    color: string;
    icon: string;
  };
  totalAgrees: number;
  totalDisagrees: number;
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [joinDate, setJoinDate] = useState<Date | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [credibility, setCredibility] = useState<CredibilityData | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const user = await authStorage.getUser();
      if (!user) {
        navigation.navigate('Login');
        return;
      }

      setUserName(user.name);
      setUserEmail(user.email);
      setUserId(user.id);
      setJoinDate(new Date(user.createdAt));

      // Fetch user's reviews
      const userReviews = await reviewApi.getUserReviews();
      setReviews(userReviews);

      // Fetch credibility data
      const credData = await voteApi.getUserCredibility(user.id);
      setCredibility(credData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleReviewPress = (review: Review) => {
    if (review.oyster?.id) {
      navigation.navigate('OysterDetail', { oysterId: review.oyster.id });
    }
  };

  const getCredibilityColor = () => {
    if (!credibility) return theme.colors.textSecondary;
    return credibility.badge.color;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const styles = createStyles(theme.colors, isDark);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          <Text style={styles.joinDate}>Member since {formatDate(joinDate)}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{reviews.length}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>

          {credibility && (
            <>
              <View style={styles.statCard}>
                <View style={styles.credibilityBadge}>
                  <Text style={[styles.badgeText, { color: getCredibilityColor() }]}>
                    {credibility.badge.icon} {credibility.badge.level}
                  </Text>
                </View>
                <Text style={styles.statLabel}>Credibility</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {credibility.totalAgrees + credibility.totalDisagrees}
                </Text>
                <Text style={styles.statLabel}>Votes Received</Text>
              </View>
            </>
          )}
        </View>

        {/* Vote Breakdown */}
        {credibility && (credibility.totalAgrees > 0 || credibility.totalDisagrees > 0) && (
          <View style={styles.voteBreakdownCard}>
            <Text style={styles.sectionTitle}>Vote Breakdown</Text>
            <View style={styles.voteBreakdown}>
              <View style={styles.voteItem}>
                <Text style={styles.voteEmoji}>👍</Text>
                <Text style={styles.voteCount}>{credibility.totalAgrees}</Text>
                <Text style={styles.voteLabel}>Agrees</Text>
              </View>
              <View style={styles.voteItem}>
                <Text style={styles.voteEmoji}>👎</Text>
                <Text style={styles.voteCount}>{credibility.totalDisagrees}</Text>
                <Text style={styles.voteLabel}>Disagrees</Text>
              </View>
            </View>
          </View>
        )}

        {/* Review History */}
        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>Review History</Text>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <TouchableOpacity
                key={review.id}
                style={styles.reviewCard}
                onPress={() => handleReviewPress(review)}
              >
                <View style={styles.reviewHeader}>
                  <Text style={styles.oysterName}>
                    {review.oyster?.name || 'Unknown Oyster'}
                  </Text>
                  <Text style={styles.reviewRating}>{review.rating.replace('_', ' ')}</Text>
                </View>
                {review.notes && (
                  <Text style={styles.reviewNotes} numberOfLines={2}>
                    {review.notes}
                  </Text>
                )}
                <View style={styles.reviewFooter}>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                  {(review.agreeCount > 0 || review.disagreeCount > 0) && (
                    <Text style={styles.reviewVotes}>
                      👍 {review.agreeCount || 0} · 👎 {review.disagreeCount || 0}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyState
              icon="📝"
              title="No Reviews Yet"
              description="You haven't written any reviews yet. Start exploring oysters and share your tasting experiences!"
              actionLabel="Browse Oysters"
              onAction={() => navigation.navigate('OysterList')}
            />
          )}
        </View>
      </ScrollView>
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
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 20,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#fff',
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    joinDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    credibilityBadge: {
      marginBottom: 4,
    },
    badgeText: {
      fontSize: 18,
      fontWeight: '600',
    },
    voteBreakdownCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    voteBreakdown: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 12,
    },
    voteItem: {
      alignItems: 'center',
    },
    voteEmoji: {
      fontSize: 32,
      marginBottom: 8,
    },
    voteCount: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    voteLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    reviewSection: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    reviewCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    oysterName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    reviewRating: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      textTransform: 'capitalize',
    },
    reviewNotes: {
      fontSize: 14,
      color: colors.textSecondary,
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
      color: colors.textSecondary,
    },
    reviewVotes: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
