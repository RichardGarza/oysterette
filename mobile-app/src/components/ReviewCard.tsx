/**
 * ReviewCard Component
 *
 * Interactive review display with voting, editing, and credibility badges.
 */

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { Card, Text, IconButton, Chip, Button, ActivityIndicator, Dialog, Portal, Snackbar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { Review } from '../types/Oyster';
import { voteApi, reviewApi, getXPStats } from '../services/api';
import { useTheme, Theme } from '../context/ThemeContext';
import { useXPNotification } from '../context/XPNotificationContext';
import { authStorage } from '../services/auth';

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
  const { showXPGain, showLevelUp } = useXPNotification();
  const [currentVote, setCurrentVote] = useState<boolean | null>(userVote);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [credibilityBadge, setCredibilityBadge] = useState<CredibilityBadge | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

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

        // Check for level up after voting
        try {
          const xpStats = await getXPStats();
          const oldLevel = await authStorage.getItem('lastLevel');
          const newLevel = xpStats.level;

          if (oldLevel && parseInt(oldLevel) < newLevel) {
            showLevelUp(newLevel);
            await authStorage.setItem('lastLevel', newLevel.toString());
          } else if (!oldLevel) {
            await authStorage.setItem('lastLevel', newLevel.toString());
          }
        } catch (error) {
          if (__DEV__) {
            console.error('❌ [ReviewCard] Error checking level up:', error);
          }
        }

        showXPGain(2, 'Vote on review');
      }

      onVoteChange();
    } catch (error: any) {
      console.error('❌ [ReviewCard] Error voting:', error);
      setSnackbarMessage(error.response?.data?.error || 'Failed to submit vote');
      setSnackbarVisible(true);
    } finally {
      setVoting(false);
    }
  }, [currentVote, review.id, onVoteChange]);

  const handleDeletePress = useCallback(() => {
    setDeleteDialogVisible(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      setDeleteDialogVisible(false);
      setDeleting(true);
      await reviewApi.delete(review.id);
      Haptics.notificationAsync(HAPTICS.DELETE);
      onDelete?.();
    } catch (error: any) {
      console.error('❌ [ReviewCard] Error deleting review:', error);
      setSnackbarMessage(error.response?.data?.error || 'Failed to delete review');
      setSnackbarVisible(true);
    } finally {
      setDeleting(false);
    }
  }, [review.id, onDelete]);

  const credibilityColor = credibilityBadge?.color || COLORS.DEFAULT_BADGE;
  const credibilityDisplay = credibilityBadge?.icon
    ? `${credibilityBadge.icon} ${credibilityBadge.level}`
    : credibilityBadge?.level || '';

  const showCredibilityBadge = credibilityBadge && credibilityBadge.level !== 'Standard';

  return (
    <Card style={styles.reviewCard}>
      <Card.Content>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewHeaderLeft}>
            <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
              {formatRatingText(review.rating)}
            </Text>
            {showCredibilityBadge && (
              <Chip
                compact
                style={{ backgroundColor: `${credibilityColor}${STYLES_CONFIG.BADGE_OPACITY}` }}
                textStyle={{ color: credibilityColor, fontSize: 10 }}
              >
                {credibilityDisplay}
              </Chip>
            )}
          </View>
          <View style={styles.reviewHeaderRight}>
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
              {formatDate(review.createdAt)}
            </Text>
            {isOwnReview && (
              <View style={styles.actionButtons}>
                <IconButton
                  icon="pencil"
                  size={16}
                  onPress={() => onEdit?.(review)}
                  disabled={deleting}
                />
                <IconButton
                  icon="delete"
                  size={16}
                  iconColor={theme.colors.error}
                  onPress={handleDeletePress}
                  disabled={deleting}
                  loading={deleting}
                />
              </View>
            )}
          </View>
        </View>

        {review.notes && (
          <Text variant="bodyMedium" style={{ color: theme.colors.text, marginTop: 8 }}>
            {review.notes}
          </Text>
        )}

        <View style={styles.voteContainer}>
          <View style={styles.voteButtons}>
            <Button
              mode={currentVote === true ? 'contained' : 'outlined'}
              onPress={() => handleVote(true)}
              disabled={voting}
              loading={voting && currentVote === true}
              icon="thumb-up"
              style={styles.voteButton}
              contentStyle={styles.voteButtonContent}
              buttonColor={currentVote === true ? theme.colors.success : undefined}
            >
              Agree ({review.agreeCount || 0})
            </Button>

            <Button
              mode={currentVote === false ? 'contained' : 'outlined'}
              onPress={() => handleVote(false)}
              disabled={voting}
              loading={voting && currentVote === false}
              icon="thumb-down"
              style={styles.voteButton}
              contentStyle={styles.voteButtonContent}
              buttonColor={currentVote === false ? theme.colors.error : undefined}
            >
              Disagree ({review.disagreeCount || 0})
            </Button>
          </View>
        </View>
      </Card.Content>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Review</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete this review? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDeleteConfirm} textColor={theme.colors.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </Card>
  );
});

ReviewCard.displayName = 'ReviewCard';

// ============================================================================
// STYLES
// ============================================================================

const useStyles = (theme: Theme, isDark: boolean) => useMemo(() => StyleSheet.create({
  reviewCard: {
    marginBottom: STYLES_CONFIG.CARD_MARGIN_BOTTOM,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  reviewHeaderRight: {
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: -8,
    marginRight: -12,
  },
  voteContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    marginTop: 12,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voteButton: {
    flex: 1,
  },
  voteButtonContent: {
    paddingVertical: 4,
  },
}), [theme, isDark]);
