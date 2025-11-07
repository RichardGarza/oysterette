/**
 * ReviewCard Component
 *
 * Interactive review display with voting, editing, and credibility system.
 *
 * Features:
 * - Overall rating display (LOVE_IT, LIKE_IT, MEH, WHATEVER)
 * - Optional tasting notes text
 * - Agree/Disagree voting buttons with counts
 * - Credibility badge for reviewer (Novice, Trusted, Expert)
 * - Edit/Delete buttons for own reviews
 * - Haptic feedback on interactions
 * - Loading states for vote and delete actions
 * - Theme-aware styling
 * - Date display (formatted)
 *
 * Props:
 * - review: Review object with all data
 * - userVote: true (agree) | false (disagree) | null (no vote)
 * - onVoteChange: Callback to refresh parent after vote change
 * - currentUserId?: Current logged-in user's ID
 * - onEdit?: Callback to navigate to edit screen
 * - onDelete?: Callback after successful deletion
 *
 * Voting System:
 * - Agree button (👍): Green when active
 * - Disagree button (👎): Red when active
 * - Shows current vote counts (agreeCount, disagreeCount)
 * - Clicking same button removes vote
 * - Clicking opposite button changes vote
 * - Haptic feedback on tap
 * - API calls: voteApi.vote() and voteApi.removeVote()
 * - Optimistic UI: Updates local state before server confirmation
 *
 * Credibility Badge:
 * - Fetched from voteApi.getUserCredibility(userId)
 * - Only shown if level !== 'Standard'
 * - Colored background with matching text
 * - Examples:
 *   - 🌟 Novice (Bronze)
 *   - ⭐ Trusted (Silver)
 *   - 🏆 Expert (Gold)
 *
 * Edit/Delete Actions (Own Reviews Only):
 * - Edit button: Calls onEdit callback with review object
 * - Delete button: Shows confirmation alert
 * - Delete flow:
 *   1. Shows "Are you sure?" alert
 *   2. Calls reviewApi.delete(reviewId)
 *   3. Shows success haptic feedback
 *   4. Calls onDelete callback
 * - Loading spinner shown during delete
 *
 * Layout:
 * - Header: Rating + Credibility badge | Date + Actions
 * - Notes: Optional multiline text
 * - Footer: Vote buttons (bordered, separated)
 *
 * State:
 * - currentVote: Local copy of userVote prop
 * - voting: Boolean for vote in progress
 * - deleting: Boolean for delete in progress
 * - credibilityBadge: Fetched badge data (level, color, icon)
 *
 * Theme Support:
 * - Uses dynamic theme colors from ThemeContext
 * - Vote button active states adapt to theme
 * - Border and background colors theme-aware
 */

import React, { useState } from 'react';
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
import { useTheme } from '../context/ThemeContext';

interface ReviewCardProps {
  review: Review;
  userVote: boolean | null; // true = agree, false = disagree, null = no vote
  onVoteChange: () => void; // Callback to refresh votes after change
  currentUserId?: string; // Current logged-in user's ID
  onEdit?: (review: Review) => void; // Callback to edit review
  onDelete?: () => void; // Callback after delete
}

interface CredibilityBadge {
  level: string;
  color: string;
  icon: string;
}

export function ReviewCard({ review, userVote, onVoteChange, currentUserId, onEdit, onDelete }: ReviewCardProps) {
  const { theme, isDark } = useTheme();
  const [currentVote, setCurrentVote] = useState<boolean | null>(userVote);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [credibilityBadge, setCredibilityBadge] = useState<CredibilityBadge | null>(null);

  const isOwnReview = currentUserId && review.userId === currentUserId;
  const styles = createStyles(theme.colors, isDark);

  // Fetch reviewer credibility on mount
  React.useEffect(() => {
    fetchCredibility();
  }, []);

  const fetchCredibility = async () => {
    try {
      const data = await voteApi.getUserCredibility(review.userId);
      setCredibilityBadge(data.badge);
    } catch (error) {
      console.error('Error fetching credibility:', error);
    }
  };

  const handleVote = async (isAgree: boolean) => {
    // Trigger haptic feedback immediately for responsive feel
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      setVoting(true);

      // If clicking the same vote, remove it
      if (currentVote === isAgree) {
        await voteApi.removeVote(review.id);
        setCurrentVote(null);
      } else {
        // Cast or update vote
        await voteApi.vote(review.id, isAgree);
        setCurrentVote(isAgree);
      }

      onVoteChange(); // Trigger refresh to update counts
    } catch (error: any) {
      console.error('Error voting:', error);
      alert(error.response?.data?.error || 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  const getCredibilityColor = () => {
    if (!credibilityBadge) return '#95a5a6';
    return credibilityBadge.color;
  };

  const getCredibilityDisplay = () => {
    if (!credibilityBadge) return '';
    return credibilityBadge.icon ? `${credibilityBadge.icon} ${credibilityBadge.level}` : credibilityBadge.level;
  };

  const handleDelete = () => {
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
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              if (onDelete) onDelete();
            } catch (error: any) {
              console.error('Error deleting review:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete review');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewHeaderLeft}>
          <Text style={styles.reviewRating}>{review.rating.replace('_', ' ')}</Text>
          {credibilityBadge && credibilityBadge.level !== 'Standard' && (
            <View style={[styles.credibilityBadge, { backgroundColor: `${getCredibilityColor()}20` }]}>
              <Text style={[styles.credibilityText, { color: getCredibilityColor() }]}>
                {getCredibilityDisplay()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.reviewHeaderRight}>
          <Text style={styles.reviewDate}>
            {new Date(review.createdAt).toLocaleDateString()}
          </Text>
          {isOwnReview && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit && onEdit(review)}
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
                  <ActivityIndicator size="small" color="#e74c3c" />
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

      {/* Vote Buttons */}
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
              <ActivityIndicator size="small" color="#27ae60" />
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
              <ActivityIndicator size="small" color="#e74c3c" />
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
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    reviewCard: {
      backgroundColor: colors.cardBackground,
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
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
      color: colors.primary,
      textTransform: 'capitalize',
    },
    credibilityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
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
      color: colors.textSecondary,
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
      backgroundColor: colors.primary,
    },
    deleteButton: {
      backgroundColor: colors.error,
      minWidth: 60,
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 11,
      color: '#fff',
      fontWeight: '600',
    },
    deleteButtonText: {
      color: '#fff',
    },
    reviewNotes: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    voteContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
      marginTop: 4,
    },
    voteLabel: {
      fontSize: 12,
      color: colors.textSecondary,
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
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    voteButtonActive: {
      backgroundColor: isDark ? '#27ae6020' : '#27ae6010',
      borderColor: colors.success,
    },
    voteButtonActiveDisagree: {
      backgroundColor: isDark ? '#e74c3c20' : '#e74c3c10',
      borderColor: colors.error,
    },
    voteButtonDisabled: {
      opacity: 0.6,
    },
    voteButtonIcon: {
      fontSize: 14,
      marginRight: 6,
    },
    voteButtonIconActive: {
      transform: [{ scale: 1.2 }],
    },
    voteButtonText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    voteButtonTextActive: {
      color: colors.success,
      fontWeight: '600',
    },
    voteButtonTextActiveDisagree: {
      color: colors.error,
      fontWeight: '600',
    },
  });
