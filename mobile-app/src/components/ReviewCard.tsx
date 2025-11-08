/**
 * ReviewCard Component
 *
 * Interactive review display with voting, editing, and credibility badges.
 */

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Review } from '../types/Oyster';
import { voteApi, reviewApi } from '../services/api';
import { useTheme, Theme } from '../context/ThemeContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  AGREE_BG_LIGHT: '#27ae6010',
  AGREE_BG_DARK: '#27ae6020',
  DISAGREE_BG_LIGHT: '#e74c3c10',
  DISAGREE_BG_DARK: '#e74c3c20',
  DEFAULT_BADGE: '#95a5a6',
  WHITE: '#fff',
  AGREE_INDICATOR: '#27ae60',
  DISAGREE_INDICATOR: '#e74c3c',
} as const;

const STYLES_CONFIG = {
  CARD_PADDING: 15,
  CARD_RADIUS: 8,
  CARD_MARGIN_BOTTOM: 10,
  BADGE_PADDING_H: 8,
  BADGE_PADDING_V: 3,
  BADGE_RADIUS: 10,
  BADGE_OPACITY: '20',
  ACTION_BUTTON_MIN_WIDTH: 60,
  VOTE_ICON_SCALE: 1.2,
  DISABLED_OPACITY: 0.6,
} as const;

const HAPTICS = {
  VOTE: Haptics.ImpactFeedbackStyle.Light,
  DELETE: Haptics.NotificationFeedbackType.Success,
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface ReviewCardProps {
  readonly review: Review;
  readonly userVote: boolean | null;
  readonly onVoteChange: () => void;
  readonly currentUserId?: string;
  readonly onEdit?: (review: Review) => void;
  readonly onDelete?: () => void;
}

interface CredibilityBadge {
  readonly level: string;
  readonly color: string;
  readonly icon: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatRatingText(rating: string): string {
  return rating.replace('_', ' ');
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ReviewCard = memo<ReviewCardProps>(({
  review,
  userVote,
  onVoteChange,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  const { theme, isDark } = useTheme();
  const [currentVote, setCurrentVote] = useState<boolean | null>(userVote);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [credibilityBadge, setCredibilityBadge] = useState<CredibilityBadge | null>(null);

  const isOwnReview = useMemo(
    () => currentUserId !== undefined && review.userId === currentUserId,
    [currentUserId, review.userId]
  );

  const styles = useStyles(theme, isDark);

  useEffect(() => {
    const fetchCredibility = async () => {
      try {
        const data = await voteApi.getUserCredibility(review.userId);
        setCredibilityBadge(data.badge);
      } catch (error) {
        if (__DEV__) {
          console.error('❌ [ReviewCard] Error fetching credibility:', error);
        }
      }
    };

    fetchCredibility();
  }, [review.userId]);

  const handleVote = useCallback(async (isAgree: boolean) => {
    Haptics.impactAsync(HAPTICS.VOTE);

    try {
      setVoting(true);

      if (currentVote === isAgree) {
        await voteApi.removeVote(review.id);
        setCurrentVote(null);
      } else {
        await voteApi.vote(review.id, isAgree);
        setCurrentVote(isAgree);
      }

      onVoteChange();
    } catch (error: any) {
      console.error('❌ [ReviewCard] Error voting:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  }, [currentVote, review.id, onVoteChange]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await reviewApi.delete(review.id);
              Haptics.notificationAsync(HAPTICS.DELETE);
              onDelete?.();
            } catch (error: any) {
              console.error('❌ [ReviewCard] Error deleting review:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete review');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [review.id, onDelete]);

  const credibilityColor = credibilityBadge?.color || COLORS.DEFAULT_BADGE;
  const credibilityDisplay = credibilityBadge?.icon
    ? `${credibilityBadge.icon} ${credibilityBadge.level}`
    : credibilityBadge?.level || '';

  const showCredibilityBadge = credibilityBadge && credibilityBadge.level !== 'Standard';

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewHeaderLeft}>
          <Text style={styles.reviewRating}>{formatRatingText(review.rating)}</Text>
          {showCredibilityBadge && (
            <View style={[styles.credibilityBadge, { backgroundColor: `${credibilityColor}${STYLES_CONFIG.BADGE_OPACITY}` }]}>
              <Text style={[styles.credibilityText, { color: credibilityColor }]}>
                {credibilityDisplay}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.reviewHeaderRight}>
          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
          {isOwnReview && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit?.(review)}
                disabled={deleting}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={COLORS.DISAGREE_INDICATOR} />
                ) : (
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {review.notes && (
        <Text style={styles.reviewNotes}>{review.notes}</Text>
      )}

      <View style={styles.voteContainer}>
        <View style={styles.voteButtons}>
          <TouchableOpacity
            style={[
              styles.voteButton,
              currentVote === true && styles.voteButtonActive,
              voting && styles.voteButtonDisabled,
            ]}
            onPress={() => handleVote(true)}
            disabled={voting}
          >
            {voting && currentVote === true ? (
              <ActivityIndicator size="small" color={COLORS.AGREE_INDICATOR} />
            ) : (
              <>
                <Text style={[
                  styles.voteButtonIcon,
                  currentVote === true && styles.voteButtonIconActive
                ]}>
                  👍
                </Text>
                <Text style={[
                  styles.voteButtonText,
                  currentVote === true && styles.voteButtonTextActive
                ]}>
                  Agree ({review.agreeCount || 0})
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.voteButton,
              currentVote === false && styles.voteButtonActiveDisagree,
              voting && styles.voteButtonDisabled,
            ]}
            onPress={() => handleVote(false)}
            disabled={voting}
          >
            {voting && currentVote === false ? (
              <ActivityIndicator size="small" color={COLORS.DISAGREE_INDICATOR} />
            ) : (
              <>
                <Text style={[
                  styles.voteButtonIcon,
                  currentVote === false && styles.voteButtonIconActive
                ]}>
                  👎
                </Text>
                <Text style={[
                  styles.voteButtonText,
                  currentVote === false && styles.voteButtonTextActiveDisagree
                ]}>
                  Disagree ({review.disagreeCount || 0})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

ReviewCard.displayName = 'ReviewCard';

// ============================================================================
// STYLES
// ============================================================================

const useStyles = (theme: Theme, isDark: boolean) => useMemo(() => StyleSheet.create({
  reviewCard: {
    backgroundColor: theme.colors.cardBackground,
    padding: STYLES_CONFIG.CARD_PADDING,
    borderRadius: STYLES_CONFIG.CARD_RADIUS,
    marginBottom: STYLES_CONFIG.CARD_MARGIN_BOTTOM,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  reviewRating: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    textTransform: 'capitalize',
  },
  credibilityBadge: {
    paddingHorizontal: STYLES_CONFIG.BADGE_PADDING_H,
    paddingVertical: STYLES_CONFIG.BADGE_PADDING_V,
    borderRadius: STYLES_CONFIG.BADGE_RADIUS,
  },
  credibilityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reviewHeaderRight: {
    alignItems: 'flex-end',
  },
  reviewDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    minWidth: STYLES_CONFIG.ACTION_BUTTON_MIN_WIDTH,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 11,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: COLORS.WHITE,
  },
  reviewNotes: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  voteContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  voteLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  voteButtonActive: {
    backgroundColor: isDark ? COLORS.AGREE_BG_DARK : COLORS.AGREE_BG_LIGHT,
    borderColor: theme.colors.success,
  },
  voteButtonActiveDisagree: {
    backgroundColor: isDark ? COLORS.DISAGREE_BG_DARK : COLORS.DISAGREE_BG_LIGHT,
    borderColor: theme.colors.error,
  },
  voteButtonDisabled: {
    opacity: STYLES_CONFIG.DISABLED_OPACITY,
  },
  voteButtonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  voteButtonIconActive: {
    transform: [{ scale: STYLES_CONFIG.VOTE_ICON_SCALE }],
  },
  voteButtonText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  voteButtonTextActive: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  voteButtonTextActiveDisagree: {
    color: theme.colors.error,
    fontWeight: '600',
  },
}), [theme, isDark]);
