/**
 * OysterDetailScreen
 *
 * Comprehensive oyster detail view with reviews, voting, and attribute visualizations.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Appbar,
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

// ============================================================================
// CONSTANTS
// ============================================================================

const RATING_ORDER = {
  LOVE_IT: 4,
  LIKE_IT: 3,
  OKAY: 2,
  MEH: 1,
} as const;

const COLORS = {
  FAVORITE_HEART: '#e74c3c',
} as const;

const SIZES = {
  ICON_FAVORITE: 28,
  PROGRESS_BAR_HEIGHT: 8,
  PROGRESS_BAR_RADIUS: 4,
} as const;

const SPACING = {
  HEADER_PADDING: 20,
  SECTION_TOP: 10,
  SECTION_TITLE_BOTTOM: 8,
  SECTION_SUBTITLE_BOTTOM: 15,
  ATTRIBUTE_BAR_BOTTOM: 15,
  HEADER_VALUE_BOTTOM: 8,
  REVIEWS_HEADER_BOTTOM: 15,
  FILTER_CHIP_GAP: 8,
  FILTER_CHIP_RIGHT: 4,
  FILTER_CHIP_BOTTOM: 4,
  SEGMENTED_BOTTOM: 15,
  HEADER_RATING_TOP: 15,
  HEADER_RATING_PADDING: 15,
  SPECIES_BADGE_BOTTOM: 8,
  UNKNOWN_HINT_TOP: 8,
  UNKNOWN_BANNER_TOP: 12,
  LOADING_TEXT_TOP: 16,
  META_TEXT_TOP: 4,
  NAME_ROW_BOTTOM: 10,
  NAME_RIGHT: 8,
} as const;

const ATTRIBUTE_SCALE = {
  MIN: 0,
  MAX: 10,
} as const;

const BORDERS = {
  HEADER_RATING_WIDTH: 1,
} as const;

// ============================================================================
// TYPES
// ============================================================================

type SortOption = 'helpful' | 'recent' | 'highest' | 'lowest';
type RatingFilter = 'ALL' | 'LOVE_IT' | 'LIKE_IT' | 'OKAY' | 'MEH';

// ============================================================================
// COMPONENT
// ============================================================================

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

  const loadCurrentUser = useCallback(async () => {
    const user = await authStorage.getUser();
    setCurrentUserId(user?.id || null);
  }, []);

  const loadFavoriteStatus = useCallback(async () => {
    const favorited = await favoritesStorage.isFavorite(oysterId);
    setIsFavorite(favorited);
  }, [oysterId]);

  const fetchOyster = useCallback(async (isRefreshing = false) => {
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
          if (__DEV__) {
            console.error('❌ [OysterDetailScreen] Error fetching votes:', voteError);
          }
          // Continue even if votes fail
        }
      }
    } catch (err) {
      setError('Failed to load oyster details');
      if (__DEV__) {
        console.error('❌ [OysterDetailScreen] Error fetching oyster:', err);
      }
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [oysterId]);

  const onRefresh = useCallback(() => {
    fetchOyster(true);
  }, [fetchOyster]);

  const handleVoteChange = useCallback(() => {
    fetchOyster(true);
  }, [fetchOyster]);

  const handleToggleFavorite = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = await favoritesStorage.toggleFavorite(oysterId);
    setIsFavorite(newState);
  }, [oysterId]);

  const handleEditReview = useCallback((review: Review) => {
    navigation.navigate('EditReview', { review });
  }, [navigation]);

  const handleDeleteReview = useCallback(() => {
    fetchOyster(true);
  }, [fetchOyster]);

  const handleWriteReview = useCallback(async () => {
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
                // Only use seed data fallback if oyster has no reviews yet
                const hasNoReviews = oyster.totalReviews === 0;
                navigation.navigate('AddReview', {
                  oysterId: oyster.id,
                  oysterName: oyster.name,
                  oysterOrigin: oyster.origin,
                  oysterSpecies: oyster.species,
                  oysterAvgSize: oyster.avgSize ?? (hasNoReviews ? oyster.size : undefined),
                  oysterAvgBody: oyster.avgBody ?? (hasNoReviews ? oyster.body : undefined),
                  oysterAvgSweetBrininess: oyster.avgSweetBrininess ?? (hasNoReviews ? oyster.sweetBrininess : undefined),
                  oysterAvgFlavorfulness: oyster.avgFlavorfulness ?? (hasNoReviews ? oyster.flavorfulness : undefined),
                  oysterAvgCreaminess: oyster.avgCreaminess ?? (hasNoReviews ? oyster.creaminess : undefined),
                  existingReview: existingReview,
                });
              },
            },
          ]
        );
      } else {
        // No existing review, navigate normally
        // Only use seed data fallback if oyster has no reviews yet
        const hasNoReviews = oyster.totalReviews === 0;
        navigation.navigate('AddReview', {
          oysterId: oyster.id,
          oysterName: oyster.name,
          oysterOrigin: oyster.origin,
          oysterSpecies: oyster.species,
          oysterAvgSize: oyster.avgSize ?? (hasNoReviews ? oyster.size : undefined),
          oysterAvgBody: oyster.avgBody ?? (hasNoReviews ? oyster.body : undefined),
          oysterAvgSweetBrininess: oyster.avgSweetBrininess ?? (hasNoReviews ? oyster.sweetBrininess : undefined),
          oysterAvgFlavorfulness: oyster.avgFlavorfulness ?? (hasNoReviews ? oyster.flavorfulness : undefined),
          oysterAvgCreaminess: oyster.avgCreaminess ?? (hasNoReviews ? oyster.creaminess : undefined),
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [OysterDetailScreen] Error checking for existing review:', error);
      }
      // If check fails, just navigate to review screen
      navigation.navigate('AddReview', {
        oysterId: oyster.id,
        oysterName: oyster.name,
        oysterOrigin: oyster.origin,
        oysterSpecies: oyster.species,
        oysterAvgSize: oyster.avgSize ?? undefined,
        oysterAvgBody: oyster.avgBody ?? undefined,
        oysterAvgSweetBrininess: oyster.avgSweetBrininess ?? undefined,
        oysterAvgFlavorfulness: oyster.avgFlavorfulness ?? undefined,
        oysterAvgCreaminess: oyster.avgCreaminess ?? undefined,
      });
    }
  }, [oyster, navigation]);

  const getSortedReviews = useMemo(() => {
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
        return reviews.sort((a, b) => RATING_ORDER[b.rating] - RATING_ORDER[a.rating]);
      case 'lowest':
        return reviews.sort((a, b) => RATING_ORDER[a.rating] - RATING_ORDER[b.rating]);
      default:
        return reviews;
    }
  }, [oyster?.reviews, ratingFilter, sortBy]);

  const renderAttributeBar = useCallback((
    value: number,
    label: string,
    attribute: 'size' | 'body' | 'sweet_brininess' | 'flavorfulness' | 'creaminess'
  ) => {
    const progress = value / ATTRIBUTE_SCALE.MAX;
    const descriptor = getAttributeDescriptor(attribute, value);
    return (
      <View style={styles.attributeBarContainer}>
        <View style={styles.attributeBarHeader}>
          <Text variant="labelMedium" style={styles.attributeBarLabel}>{label}</Text>
          <View style={styles.attributeBarValueContainer}>
            <Text variant="bodyMedium" style={styles.attributeBarDescriptor}>{descriptor}</Text>
            <Text variant="bodySmall" style={styles.attributeBarValue}> ({value}/{ATTRIBUTE_SCALE.MAX})</Text>
          </View>
        </View>
        <ProgressBar
          progress={progress}
          color={paperTheme.colors.primary}
          style={styles.progressBar}
        />
      </View>
    );
  }, [paperTheme.colors.primary]);

  const styles = useMemo(
    () => createStyles(theme.colors, isDark),
    [theme.colors, isDark]
  );

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
        <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} iconColor="#fff" />
          <Appbar.Content 
            title={oyster.name} 
            subtitle={oyster.species}
            titleStyle={{ color: '#fff', fontWeight: 'bold' }}
            subtitleStyle={{ color: '#fff' }}
          />
          <Appbar.Action
            icon={isFavorite ? 'heart' : 'heart-outline'}
            iconColor={isFavorite ? COLORS.FAVORITE_HEART : '#fff'}
            onPress={handleToggleFavorite}
          />
        </Appbar.Header>

        <Card mode="elevated" style={styles.headerRating}>
          <Card.Content>
            <RatingDisplay
              overallScore={oyster.overallScore || 0}
              totalReviews={oyster.totalReviews || 0}
              size="medium"
              showDetails={true}
            />
            {oyster.species === 'Unknown' && (
              <Text variant="bodySmall" style={styles.unknownHintSmall}>
                🔬 Know the species? Rate it and add the species!
              </Text>
            )}
          </Card.Content>
        </Card>

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
                    mode={ratingFilter === 'OKAY' ? 'flat' : 'outlined'}
                    selected={ratingFilter === 'OKAY'}
                    onPress={() => setRatingFilter('OKAY')}
                    style={styles.filterChip}
                  >
                    👌 Okay
                  </Chip>
                  <Chip
                    mode={ratingFilter === 'MEH' ? 'flat' : 'outlined'}
                    selected={ratingFilter === 'MEH'}
                    onPress={() => setRatingFilter('MEH')}
                    style={styles.filterChip}
                  >
                    😐 Meh
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
              getSortedReviews.map((review) => (
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
      padding: SPACING.HEADER_PADDING,
    },
    nameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.NAME_ROW_BOTTOM,
    },
    name: {
      flex: 1,
      marginRight: SPACING.NAME_RIGHT,
    },
    speciesBadge: {
      marginBottom: SPACING.SPECIES_BADGE_BOTTOM,
    },
    loadingText: {
      marginTop: SPACING.LOADING_TEXT_TOP,
    },
    section: {
      marginTop: SPACING.SECTION_TOP,
    },
    sectionTitle: {
      marginBottom: SPACING.SECTION_TITLE_BOTTOM,
    },
    sectionSubtitle: {
      marginBottom: SPACING.SECTION_SUBTITLE_BOTTOM,
    },
    originText: {
      // Paper handles text styling
    },
    notesText: {
      lineHeight: 24,
      fontStyle: 'italic',
    },
    unknownBanner: {
      marginTop: SPACING.UNKNOWN_BANNER_TOP,
    },
    attributeBarContainer: {
      marginBottom: SPACING.ATTRIBUTE_BAR_BOTTOM,
    },
    attributeBarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.HEADER_VALUE_BOTTOM,
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
      height: SIZES.PROGRESS_BAR_HEIGHT,
      borderRadius: SIZES.PROGRESS_BAR_RADIUS,
    },
    metaText: {
      marginTop: SPACING.META_TEXT_TOP,
    },
    errorText: {
      // Paper handles text styling
    },
    headerRating: {
      marginTop: SPACING.HEADER_RATING_TOP,
      paddingTop: SPACING.HEADER_RATING_PADDING,
      borderTopWidth: BORDERS.HEADER_RATING_WIDTH,
      borderTopColor: colors.border,
    },
    unknownHintSmall: {
      marginTop: SPACING.UNKNOWN_HINT_TOP,
      fontStyle: 'italic',
    },
    reviewsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.REVIEWS_HEADER_BOTTOM,
    },
    filterChipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.FILTER_CHIP_GAP,
      marginBottom: SPACING.SECTION_SUBTITLE_BOTTOM,
    },
    filterChip: {
      marginRight: SPACING.FILTER_CHIP_RIGHT,
      marginBottom: SPACING.FILTER_CHIP_BOTTOM,
    },
    segmentedButtons: {
      marginBottom: SPACING.SEGMENTED_BOTTOM,
    },
  });
