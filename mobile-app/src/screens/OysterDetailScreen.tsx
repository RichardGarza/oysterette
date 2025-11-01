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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation } from '@react-navigation/native';
import { OysterDetailScreenRouteProp, OysterDetailScreenNavigationProp } from '../navigation/types';
import { oysterApi, voteApi } from '../services/api';
import { favoritesStorage } from '../services/favorites';
import { Oyster } from '../types/Oyster';
import { RatingDisplay, RatingBreakdown } from '../components/RatingDisplay';
import { ReviewCard } from '../components/ReviewCard';
import { EmptyState } from '../components/EmptyState';

type SortOption = 'helpful' | 'recent' | 'highest' | 'lowest';

export default function OysterDetailScreen() {
  const route = useRoute<OysterDetailScreenRouteProp>();
  const navigation = useNavigation<OysterDetailScreenNavigationProp>();
  const { oysterId } = route.params;
  const [oyster, setOyster] = useState<Oyster | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, boolean | null>>({});
  const [sortBy, setSortBy] = useState<SortOption>('helpful');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchOyster();
    loadFavoriteStatus();
  }, [oysterId]);

  const loadFavoriteStatus = async () => {
    const favorited = await favoritesStorage.isFavorite(oysterId);
    setIsFavorite(favorited);
  };

  const fetchOyster = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await oysterApi.getById(oysterId);
      setOyster(data);

      // Fetch user votes for all reviews
      if (data && data.reviews && data.reviews.length > 0) {
        try {
          const reviewIds = data.reviews.map(r => r.id);
          const votes = await voteApi.getUserVotes(reviewIds);
          setUserVotes(votes);
        } catch (voteError) {
          console.error('Error fetching votes:', voteError);
          // Continue even if votes fail
        }
      }
    } catch (err) {
      setError('Failed to load oyster details');
      console.error('Error fetching oyster:', err);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    fetchOyster(true);
  };

  const handleVoteChange = () => {
    // Refresh oyster data when a vote changes
    fetchOyster(true);
  };

  const handleToggleFavorite = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = await favoritesStorage.toggleFavorite(oysterId);
    setIsFavorite(newState);
  };

  const getSortedReviews = () => {
    if (!oyster?.reviews) return [];

    const reviews = [...oyster.reviews];

    switch (sortBy) {
      case 'helpful':
        return reviews.sort((a, b) => b.netVoteScore - a.netVoteScore);
      case 'recent':
        return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'highest':
        const ratingOrder = { LOVED_IT: 4, LIKED_IT: 3, MEH: 2, HATED_IT: 1 };
        return reviews.sort((a, b) => ratingOrder[b.rating] - ratingOrder[a.rating]);
      case 'lowest':
        const ratingOrderLow = { LOVED_IT: 4, LIKED_IT: 3, MEH: 2, HATED_IT: 1 };
        return reviews.sort((a, b) => ratingOrderLow[a.rating] - ratingOrderLow[b.rating]);
      default:
        return reviews;
    }
  };

  const renderAttributeBar = (value: number, label: string) => {
    const percentage = (value / 10) * 100;
    return (
      <View style={styles.attributeBarContainer}>
        <View style={styles.attributeBarHeader}>
          <Text style={styles.attributeBarLabel}>{label}</Text>
          <Text style={styles.attributeBarValue}>{value}/10</Text>
        </View>
        <View style={styles.attributeBarTrack}>
          <View
            style={[
              styles.attributeBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: getAttributeColor(value)
              }
            ]}
          />
        </View>
      </View>
    );
  };

  const getAttributeColor = (value: number) => {
    if (value <= 3) return '#e74c3c';
    if (value <= 7) return '#f39c12';
    return '#27ae60';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (error || !oyster) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Oyster not found'}</Text>
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
            onRefresh={onRefresh}
            tintColor="#3498db"
            colors={['#3498db']}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{oyster.name}</Text>
            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={styles.favoriteButton}
            >
              <Text style={styles.favoriteIcon}>
                {isFavorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.speciesBadge}>
            <Text style={styles.speciesText}>{oyster.species}</Text>
          </View>
          {oyster.species === 'Unknown' && (
            <Text style={styles.unknownHintSmall}>
              🔬 Know the species? Rate it and help us complete this entry!
            </Text>
          )}

          <View style={styles.headerRating}>
            <RatingDisplay
              overallScore={oyster.overallScore}
              totalReviews={oyster.totalReviews}
              size="large"
              showDetails={true}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Origin</Text>
          <Text style={styles.originText}>{oyster.origin}</Text>
          {oyster.origin === 'Unknown' && (
            <Text style={styles.unknownHint}>
              📍 Know where this oyster is from? Rate it and add the origin!
            </Text>
          )}
        </View>

        {oyster.standoutNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Standout Notes</Text>
            <Text style={styles.notesText}>{oyster.standoutNotes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attribute Profile</Text>
          <Text style={styles.sectionSubtitle}>10-point scale ratings</Text>

          {renderAttributeBar(oyster.size, 'Size (1=Tiny → 10=Huge)')}
          {renderAttributeBar(oyster.body, 'Body (1=Thin → 10=Fat)')}
          {renderAttributeBar(oyster.sweetBrininess, 'Sweet/Brininess (1=Sweet → 10=Salty)')}
          {renderAttributeBar(oyster.flavorfulness, 'Flavorfulness (1=Boring → 10=Bold)')}
          {renderAttributeBar(oyster.creaminess, 'Creaminess (1=None → 10=Creamy)')}
        </View>

        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>
              Reviews {oyster.reviews && oyster.reviews.length > 0 && `(${oyster.reviews.length})`}
            </Text>
            <TouchableOpacity
              style={styles.writeReviewButton}
              onPress={() => navigation.navigate('AddReview', {
                oysterId: oyster.id,
                oysterName: oyster.name
              })}
            >
              <Text style={styles.writeReviewButtonText}>✍️ Write Review</Text>
            </TouchableOpacity>
          </View>

          {oyster.reviews && oyster.reviews.length > 0 && (
            <View style={styles.sortTabs}>
              <TouchableOpacity
                style={[styles.sortTab, sortBy === 'helpful' && styles.sortTabActive]}
                onPress={() => setSortBy('helpful')}
              >
                <Text style={[styles.sortTabText, sortBy === 'helpful' && styles.sortTabTextActive]}>
                  Most Helpful
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortTab, sortBy === 'recent' && styles.sortTabActive]}
                onPress={() => setSortBy('recent')}
              >
                <Text style={[styles.sortTabText, sortBy === 'recent' && styles.sortTabTextActive]}>
                  Most Recent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortTab, sortBy === 'highest' && styles.sortTabActive]}
                onPress={() => setSortBy('highest')}
              >
                <Text style={[styles.sortTabText, sortBy === 'highest' && styles.sortTabTextActive]}>
                  Highest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortTab, sortBy === 'lowest' && styles.sortTabActive]}
                onPress={() => setSortBy('lowest')}
              >
                <Text style={[styles.sortTabText, sortBy === 'lowest' && styles.sortTabTextActive]}>
                  Lowest
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {oyster.reviews && oyster.reviews.length > 0 ? (
            getSortedReviews().map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                userVote={userVotes[review.id] ?? null}
                onVoteChange={handleVoteChange}
              />
            ))
          ) : (
            <EmptyState
              icon="📝"
              title="No Reviews Yet"
              description="Be the first to share your tasting experience with this oyster! Your review will help others discover new favorites."
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.metaText}>
            Added: {new Date(oyster.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.metaText}>
            Updated: {new Date(oyster.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
    marginLeft: 10,
  },
  favoriteIcon: {
    fontSize: 28,
  },
  speciesBadge: {
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  speciesText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
  },
  originText: {
    fontSize: 16,
    color: '#555',
  },
  notesText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  attributeBarContainer: {
    marginBottom: 15,
  },
  attributeBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  attributeBarLabel: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  attributeBarValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  attributeBarTrack: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  attributeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    textTransform: 'capitalize',
  },
  reviewDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  reviewNotes: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  metaText: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 5,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
  },
  headerRating: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  unknownHint: {
    fontSize: 13,
    color: '#f39c12',
    fontStyle: 'italic',
    marginTop: 8,
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  unknownHintSmall: {
    fontSize: 12,
    color: '#f39c12',
    fontStyle: 'italic',
    marginTop: 8,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  writeReviewButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  writeReviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sortTabs: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  sortTabActive: {
    borderBottomColor: '#3498db',
  },
  sortTabText: {
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  sortTabTextActive: {
    color: '#3498db',
    fontWeight: '600',
  },
});
