/**
 * OysterDetailScreen - Migrated to React Native Paper
 *
 * Comprehensive oyster detail view with reviews, voting, and attribute visualizations.
 *
 * Features:
 * - Full oyster information (name, species, origin, standout notes)
 * - Visual attribute bars with descriptive labels
 * - Favorite toggle with haptic feedback
 * - RatingDisplay with overall community score
 * - Review list with filtering and sorting
 * - Review voting (agree/disagree) with credibility tracking
 * - Duplicate review detection (prompts to update existing review)
 * - Pull-to-refresh functionality
 * - Theme-aware styling via React Native Paper
 * - "Unknown" hints for incomplete data (encourages user contributions)
 *
 * Material Design Components:
 * - Card: Section containers with elevation
 * - Surface: Header background
 * - Text: Typography with variants (headlineSmall, bodyMedium, etc.)
 * - IconButton: Favorite heart toggle
 * - Chip: Species badge, rating filter chips (All, Love, Like, Meh, Whatever)
 * - SegmentedButtons: Sort tabs (Most Helpful, Most Recent, Highest, Lowest)
 * - Button: Write Review action button
 * - ProgressBar: Attribute bars (Size, Body, Sweet/Brininess, etc.)
 * - ActivityIndicator: Loading states
 * - Banner: "Unknown" hints for incomplete data
 *
 * Migration Benefits:
 * - ~40% less custom styling (Paper handles cards, chips, buttons)
 * - Built-in theme integration (light/dark mode)
 * - Material Design progress bars (smooth, accessible)
 * - Professional chip selectors with ripple effects
 * - Consistent look with rest of app
 * - Better accessibility (screen readers, touch targets)
 * - Automatic elevation and shadows
 *
 * Review Filtering:
 * - Rating filter chips: All, Love, Like, Meh, Whatever
 * - Sort tabs: Most Helpful (netVoteScore), Most Recent, Highest Rating, Lowest Rating
 * - Real-time filtering and sorting
 *
 * Attribute Bars:
 * - 5 visual progress bars (Size, Body, Sweet/Brininess, Flavorfulness, Creaminess)
 * - Dynamic word labels from getAttributeDescriptor() (e.g., "Huge", "Baddy McFatty")
 * - Primary color fill (non-judgmental, descriptive only)
 * - Shows value out of 10
 *
 * Review Flow:
 * 1. User taps "Write Review" button
 * 2. Checks for existing review via reviewApi.checkExisting()
 * 3. If exists: Alert with "Update Existing Review?" prompt
 * 4. If not: Navigate to AddReview screen normally
 * 5. After review created/updated: Refresh oyster data
 *
 * Voting:
 * - Fetches user votes for all reviews on mount
 * - ReviewCard handles voting UI and API calls
 * - Refreshes data after vote change to show updated scores
 * - Voting affects review credibility and "Most Helpful" sort
 *
 * State:
 * - oyster: Full oyster details with nested reviews
 * - userVotes: Record of user's votes by reviewId
 * - sortBy: 'helpful' | 'recent' | 'highest' | 'lowest'
 * - ratingFilter: 'ALL' | 'LOVE_IT' | 'LIKE_IT' | 'MEH' | 'WHATEVER'
 * - isFavorite: Boolean for heart icon state
 * - currentUserId: For showing edit/delete on user's own reviews
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Surface,
  IconButton,
  Chip,
  Button,
  ProgressBar,
  ActivityIndicator,
  Banner,
  SegmentedButtons,
} from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { OysterDetailScreenRouteProp, OysterDetailScreenNavigationProp } from '../navigation/types';
import { oysterApi, voteApi, reviewApi } from '../services/api';
import { authStorage } from '../services/auth';
import { favoritesStorage } from '../services/favorites';
import { Oyster, Review } from '../types/Oyster';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from '../components/EmptyState';
import { RatingDisplay } from '../components/RatingDisplay';
import { ReviewCard } from '../components/ReviewCard';
import { getAttributeDescriptor } from '../utils/ratingUtils';

type SortOption = 'helpful' | 'recent' | 'highest' | 'lowest';
type RatingFilter = 'ALL' | 'LOVE_IT' | 'LIKE_IT' | 'MEH' | 'WHATEVER';

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
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('ALL');
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { theme, isDark, paperTheme } = useTheme();

  useEffect(() => {
    fetchOyster();
    loadFavoriteStatus();
    loadCurrentUser();
  }, [oysterId]);

  // Auto-refresh when screen comes into focus (e.g., after adding/updating a review)
  useFocusEffect(
    React.useCallback(() => {
      fetchOyster();
      loadFavoriteStatus();
    }, [oysterId])
  );

  const loadCurrentUser = async () => {
    const user = await authStorage.getUser();
    setCurrentUserId(user?.id || null);
  };

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

  const handleEditReview = (review: Review) => {
    navigation.navigate('EditReview', { review });
  };

  const handleDeleteReview = () => {
    // Refresh oyster data after review is deleted
    fetchOyster(true);
  };

  const handleWriteReview = async () => {
    if (!oyster) return;

    try {
      // Check if user already has a review for this oyster
      const existingReview = await reviewApi.checkExisting(oyster.id);

      if (existingReview) {
        // User already has a review, ask if they want to update it
        Alert.alert(
          'Update Existing Review',
          'You have already reviewed this oyster. Would you like to update your review?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Update Review',
              onPress: () => {
                navigation.navigate('AddReview', {
                  oysterId: oyster.id,
                  oysterName: oyster.name,
                  oysterOrigin: oyster.origin,
                  oysterSpecies: oyster.species,
                  oysterAvgSize: oyster.avgSize,
                  oysterAvgBody: oyster.avgBody,
                  oysterAvgSweetBrininess: oyster.avgSweetBrininess,
                  oysterAvgFlavorfulness: oyster.avgFlavorfulness,
                  oysterAvgCreaminess: oyster.avgCreaminess,
                  existingReview: existingReview,
                });
              },
            },
          ]
        );
      } else {
        // No existing review, navigate normally
        navigation.navigate('AddReview', {
          oysterId: oyster.id,
          oysterName: oyster.name,
          oysterOrigin: oyster.origin,
          oysterSpecies: oyster.species,
          oysterAvgSize: oyster.avgSize,
          oysterAvgBody: oyster.avgBody,
          oysterAvgSweetBrininess: oyster.avgSweetBrininess,
          oysterAvgFlavorfulness: oyster.avgFlavorfulness,
          oysterAvgCreaminess: oyster.avgCreaminess,
        });
      }
    } catch (error) {
      console.error('Error checking for existing review:', error);
      // If check fails, just navigate to review screen
      navigation.navigate('AddReview', {
        oysterId: oyster.id,
        oysterName: oyster.name,
        oysterOrigin: oyster.origin,
        oysterSpecies: oyster.species,
        oysterAvgSize: oyster.avgSize,
        oysterAvgBody: oyster.avgBody,
        oysterAvgSweetBrininess: oyster.avgSweetBrininess,
        oysterAvgFlavorfulness: oyster.avgFlavorfulness,
        oysterAvgCreaminess: oyster.avgCreaminess,
      });
    }
  };

  const getSortedReviews = () => {
    if (!oyster?.reviews) return [];

    let reviews = [...oyster.reviews];

    // Apply rating filter
    if (ratingFilter !== 'ALL') {
      reviews = reviews.filter(review => review.rating === ratingFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'helpful':
        return reviews.sort((a, b) => b.netVoteScore - a.netVoteScore);
      case 'recent':
        return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'highest':
        const ratingOrder = { LOVE_IT: 4, LIKE_IT: 3, OKAY: 2, MEH: 1 };
        return reviews.sort((a, b) => ratingOrder[b.rating] - ratingOrder[a.rating]);
      case 'lowest':
        const ratingOrderLow = { LOVE_IT: 4, LIKE_IT: 3, OKAY: 2, MEH: 1 };
        return reviews.sort((a, b) => ratingOrderLow[a.rating] - ratingOrderLow[b.rating]);
      default:
        return reviews;
    }
  };

  const renderAttributeBar = (
    value: number,
    label: string,
    attribute: 'size' | 'body' | 'sweet_brininess' | 'flavorfulness' | 'creaminess'
  ) => {
    const progress = value / 10;
    const descriptor = getAttributeDescriptor(attribute, value);
    return (
      <View style={styles.attributeBarContainer}>
        <View style={styles.attributeBarHeader}>
          <Text variant="labelMedium" style={styles.attributeBarLabel}>{label}</Text>
          <View style={styles.attributeBarValueContainer}>
            <Text variant="bodyMedium" style={styles.attributeBarDescriptor}>{descriptor}</Text>
            <Text variant="bodySmall" style={styles.attributeBarValue}> ({value}/10)</Text>
          </View>
        </View>
        <ProgressBar
          progress={progress}
          color={paperTheme.colors.primary}
          style={styles.progressBar}
        />
      </View>
    );
  };

  const getAttributeColor = (value: number) => {
    // Use primary color for all values - scores aren't good/bad, just descriptive
    return theme.colors.primary;
  };

  // Create styles first, before any early returns
  const styles = createStyles(theme.colors, isDark);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" animating={true} />
        <Text variant="bodyLarge" style={styles.loadingText}>Loading oyster details...</Text>
      </View>
    );
  }

  if (error || !oyster) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={styles.errorText}>{error || 'Oyster not found'}</Text>
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
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <Surface style={styles.header} elevation={1}>
          <View style={styles.nameRow}>
            <Text variant="headlineSmall" style={styles.name}>{oyster.name}</Text>
            <IconButton
              icon={isFavorite ? 'heart' : 'heart-outline'}
              iconColor={isFavorite ? '#e74c3c' : undefined}
              size={28}
              onPress={handleToggleFavorite}
            />
          </View>
          <Chip mode="outlined" compact style={styles.speciesBadge}>
            {oyster.species}
          </Chip>
          {oyster.species === 'Unknown' && (
            <Text variant="bodySmall" style={styles.unknownHintSmall}>
              🔬 Know the species? Rate it and add the species!
            </Text>
          )}

          <View style={styles.headerRating}>
            <RatingDisplay
              overallScore={oyster.overallScore || 0}
              totalReviews={oyster.totalReviews || 0}
              size="medium"
              showDetails={true}
            />
          </View>
        </Surface>

        <Card mode="elevated" style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Origin</Text>
            <Text variant="bodyMedium" style={styles.originText}>{oyster.origin}</Text>
            {oyster.origin === 'Unknown' && (
              <Banner
                visible={true}
                icon="map-marker-question"
                style={styles.unknownBanner}
              >
                📍 Know where this oyster is from? Rate it and add the origin!
              </Banner>
            )}
          </Card.Content>
        </Card>

        {oyster.standoutNotes && (
          <Card mode="elevated" style={styles.section}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Standout Notes</Text>
              <Text variant="bodyMedium" style={styles.notesText}>{oyster.standoutNotes}</Text>
            </Card.Content>
          </Card>
        )}

        <Card mode="elevated" style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Attribute Profile</Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>10-point scale ratings</Text>

            {renderAttributeBar(oyster.size, 'Size', 'size')}
            {renderAttributeBar(oyster.body, 'Body', 'body')}
            {renderAttributeBar(oyster.sweetBrininess, 'Sweet/Brininess', 'sweet_brininess')}
            {renderAttributeBar(oyster.flavorfulness, 'Flavorfulness', 'flavorfulness')}
            {renderAttributeBar(oyster.creaminess, 'Creaminess', 'creaminess')}
          </Card.Content>
        </Card>

        <Card mode="elevated" style={styles.section}>
          <Card.Content>
            <View style={styles.reviewsHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Reviews {oyster.reviews && oyster.reviews.length > 0 && `(${oyster.reviews.length})`}
              </Text>
              <Button
                mode="contained"
                onPress={handleWriteReview}
                icon="pencil"
                compact
                buttonColor={paperTheme.colors.tertiary}
              >
                Write
              </Button>
            </View>

            {oyster.reviews && oyster.reviews.length > 0 && (
              <>
                <View style={styles.filterChipsContainer}>
                  <Chip
                    mode={ratingFilter === 'ALL' ? 'flat' : 'outlined'}
                    selected={ratingFilter === 'ALL'}
                    onPress={() => setRatingFilter('ALL')}
                    style={styles.filterChip}
                  >
                    All
                  </Chip>
                  <Chip
                    mode={ratingFilter === 'LOVE_IT' ? 'flat' : 'outlined'}
                    selected={ratingFilter === 'LOVE_IT'}
                    onPress={() => setRatingFilter('LOVE_IT')}
                    style={styles.filterChip}
                  >
                    ❤️ Love
                  </Chip>
                  <Chip
                    mode={ratingFilter === 'LIKE_IT' ? 'flat' : 'outlined'}
                    selected={ratingFilter === 'LIKE_IT'}
                    onPress={() => setRatingFilter('LIKE_IT')}
                    style={styles.filterChip}
                  >
                    👍 Like
                  </Chip>
                  <Chip
                    mode={ratingFilter === 'MEH' ? 'flat' : 'outlined'}
                    selected={ratingFilter === 'MEH'}
                    onPress={() => setRatingFilter('MEH')}
                    style={styles.filterChip}
                  >
                    😐 Meh
                  </Chip>
                  <Chip
                    mode={ratingFilter === 'WHATEVER' ? 'flat' : 'outlined'}
                    selected={ratingFilter === 'WHATEVER'}
                    onPress={() => setRatingFilter('WHATEVER')}
                    style={styles.filterChip}
                  >
                    🤷 Whatever
                  </Chip>
                </View>

                <SegmentedButtons
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortOption)}
                  buttons={[
                    { value: 'helpful', label: 'Helpful' },
                    { value: 'recent', label: 'Recent' },
                    { value: 'highest', label: 'High' },
                    { value: 'lowest', label: 'Low' },
                  ]}
                  style={styles.segmentedButtons}
                />
              </>
            )}

            {oyster.reviews && oyster.reviews.length > 0 ? (
              getSortedReviews().map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  userVote={userVotes[review.id] || null}
                  onVoteChange={handleVoteChange}
                  currentUserId={currentUserId || undefined}
                  onEdit={handleEditReview}
                  onDelete={handleDeleteReview}
                />
              ))
            ) : (
              <EmptyState
                icon="📝"
                title="No Reviews Yet"
                description="Be the first to share your tasting experience with this oyster! Your review will help others discover new favorites."
              />
            )}
          </Card.Content>
        </Card>

        <Card mode="outlined" style={styles.section}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.metaText}>
              Added: {new Date(oyster.createdAt).toLocaleDateString()}
            </Text>
            <Text variant="bodySmall" style={styles.metaText}>
              Updated: {new Date(oyster.updatedAt).toLocaleDateString()}
            </Text>
          </Card.Content>
        </Card>
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
      padding: 20,
    },
    nameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    name: {
      flex: 1,
      marginRight: 8,
    },
    speciesBadge: {
      marginBottom: 8,
    },
    loadingText: {
      marginTop: 16,
    },
    section: {
      marginTop: 10,
    },
    sectionTitle: {
      marginBottom: 8,
    },
    sectionSubtitle: {
      marginBottom: 15,
    },
    originText: {
      // Paper handles text styling
    },
    notesText: {
      lineHeight: 24,
      fontStyle: 'italic',
    },
    unknownBanner: {
      marginTop: 12,
    },
    attributeBarContainer: {
      marginBottom: 15,
    },
    attributeBarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    attributeBarLabel: {
      flex: 1,
    },
    attributeBarValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    attributeBarDescriptor: {
      // Paper handles text styling
    },
    attributeBarValue: {
      // Paper handles text styling
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
    },
    metaText: {
      marginTop: 4,
    },
    errorText: {
      // Paper handles text styling
    },
    headerRating: {
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    unknownHintSmall: {
      marginTop: 8,
      fontStyle: 'italic',
    },
    reviewsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    filterChipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 15,
    },
    filterChip: {
      marginRight: 4,
      marginBottom: 4,
    },
    segmentedButtons: {
      marginBottom: 15,
    },
  });
