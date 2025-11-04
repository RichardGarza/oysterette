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
  const [currentVote, setCurrentVote] = useState<boolean | null>(userVote);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [credibilityBadge, setCredibilityBadge] = useState<CredibilityBadge | null>(null);

  const isOwnReview = currentUserId && review.userId === currentUserId;

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

const styles = StyleSheet.create({
  reviewCard: {
    backgroundColor: '#f8f9fa',
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
    color: '#3498db',
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
    color: '#7f8c8d',
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
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
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
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  voteContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 4,
  },
  voteLabel: {
    fontSize: 12,
    color: '#7f8c8d',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  voteButtonActive: {
    backgroundColor: '#27ae6010',
    borderColor: '#27ae60',
  },
  voteButtonActiveDisagree: {
    backgroundColor: '#e74c3c10',
    borderColor: '#e74c3c',
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
    color: '#555',
    fontWeight: '500',
  },
  voteButtonTextActive: {
    color: '#27ae60',
    fontWeight: '600',
  },
  voteButtonTextActiveDisagree: {
    color: '#e74c3c',
    fontWeight: '600',
  },
});
