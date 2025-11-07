/**
 * RatingDisplay Component
 *
 * Reusable rating visualization component with multiple display modes.
 *
 * Features:
 * - Three size variants: small, medium, large
 * - Small mode: 5-star display with review count
 * - Medium/Large mode: Emoji + verdict word + score + review count
 * - Converts 0-10 backend score to 0-5 star display
 * - Handles zero reviews gracefully
 * - Uses utility functions from ratingUtils.ts
 *
 * Props:
 * - overallScore: 0-10 score from backend (40% rating + 60% attributes)
 * - totalReviews: Number of reviews for this oyster
 * - size?: 'small' | 'medium' | 'large' (default: 'medium')
 * - showDetails?: boolean (default: true) - Show review count
 *
 * Display Modes:
 * 1. Small (List View):
 *    - 5 stars (full/half/empty)
 *    - Review count in parentheses (e.g., "(23)")
 *    - Star sizes: 14px
 * 2. Medium (Detail View):
 *    - Emoji (24px) + Verdict word + Score/10
 *    - Review count (e.g., "(23 reviews)")
 *    - Font size: 18px
 * 3. Large:
 *    - Same as medium but larger
 *    - Emoji: 32px, Font: 22px
 *
 * Star Conversion:
 * - Backend score: 0-10
 * - Display score: 0-5 stars (score / 2)
 * - Half star: If decimal ≥ 0.5
 * - Examples:
 *   - 8.6 → 4.3 stars → ★★★★½
 *   - 7.2 → 3.6 stars → ★★★☆
 *
 * Verdict Mapping (from ratingUtils):
 * - 9-10: 🏆 "Outstanding"
 * - 8-8.9: ⭐ "Excellent"
 * - 7-7.9: 😊 "Very Good"
 * - 6-6.9: 👍 "Good"
 * - 5-5.9: 🆗 "Decent"
 * - 4-4.9: 😐 "Mediocre"
 * - 0-3.9: 👎 "Poor"
 *
 * Zero Reviews:
 * - Shows "No reviews yet" instead of score
 * - Styled as italic, secondary color
 *
 * Used In:
 * - OysterListScreen cards (small mode)
 * - OysterDetailScreen header (medium mode)
 * - TopOystersScreen cards (small mode)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scoreToVerdict, scoreToStars } from '../utils/ratingUtils';

interface RatingDisplayProps {
  overallScore: number;
  totalReviews: number;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  overallScore,
  totalReviews,
  size = 'medium',
  showDetails = true,
}) => {
  // Convert 0-10 score to 0-5 stars for display
  const stars = scoreToStars(overallScore);
  const fullStars = Math.floor(stars);
  const hasHalfStar = stars % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  // Get verdict (emoji + word) based on score
  const verdict = scoreToVerdict(overallScore);

  const sizeStyles = {
    small: { fontSize: 14, starSize: 14, emojiSize: 16 },
    medium: { fontSize: 18, starSize: 16, emojiSize: 24 },
    large: { fontSize: 22, starSize: 18, emojiSize: 32 },
  };

  const currentSize = sizeStyles[size];

  // Don't show rating if there are no reviews
  if (totalReviews === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.noReviews, { fontSize: currentSize.fontSize - 2 }]}>
          No reviews yet
        </Text>
      </View>
    );
  }

  // Small size: Show only stars (list view)
  if (size === 'small') {
    return (
      <View style={styles.container}>
        <View style={styles.starsContainer}>
          {[...Array(fullStars)].map((_, i) => (
            <Text key={`full-${i}`} style={[styles.star, { fontSize: currentSize.starSize }]}>
              ★
            </Text>
          ))}
          {hasHalfStar && (
            <Text style={[styles.star, { fontSize: currentSize.starSize }]}>½</Text>
          )}
          {[...Array(emptyStars)].map((_, i) => (
            <Text key={`empty-${i}`} style={[styles.starEmpty, { fontSize: currentSize.starSize }]}>
              ☆
            </Text>
          ))}
        </View>
        {showDetails && (
          <Text style={[styles.reviewCount, { fontSize: currentSize.fontSize - 2 }]}>
            ({totalReviews})
          </Text>
        )}
      </View>
    );
  }

  // Medium/Large size: Show emoji + verdict word (detail view)
  return (
    <View style={styles.container}>
      <Text style={[styles.emoji, { fontSize: currentSize.emojiSize }]}>
        {verdict.emoji}
      </Text>
      <View style={styles.verdictContainer}>
        <Text style={[styles.verdictText, { fontSize: currentSize.fontSize }]}>
          {verdict.verdict}
        </Text>
        <Text style={[styles.scoreText, { fontSize: currentSize.fontSize - 4 }]}>
          {overallScore.toFixed(1)}/10
        </Text>
      </View>
      {showDetails && (
        <Text style={[styles.reviewCount, { fontSize: currentSize.fontSize - 4 }]}>
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </Text>
      )}
    </View>
  );
};

interface RatingBreakdownProps {
  avgRating: number;
  totalReviews: number;
  ratingBreakdown?: {
    loveIt: number;
    likeIt: number;
    meh: number;
    whatever: number;
  };
}

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  avgRating,
  totalReviews,
  ratingBreakdown,
}) => {
  const getRatingLabel = (value: number): string => {
    if (value >= 3.5) return 'Love It';
    if (value >= 2.5) return 'Like It';
    if (value >= 1.5) return 'Meh';
    return 'Whatever';
  };

  const getRatingColor = (value: number): string => {
    if (value >= 3.5) return '#10b981';
    if (value >= 2.5) return '#3b82f6';
    if (value >= 1.5) return '#f59e0b';
    return '#ef4444';
  };

  if (totalReviews === 0) {
    return (
      <View style={styles.breakdownContainer}>
        <Text style={styles.noReviewsText}>No ratings yet. Be the first to review!</Text>
      </View>
    );
  }

  return (
    <View style={styles.breakdownContainer}>
      <View style={styles.avgRatingContainer}>
        <Text style={[styles.avgRatingValue, { color: getRatingColor(avgRating) }]}>
          {avgRating.toFixed(1)}
        </Text>
        <Text style={styles.avgRatingLabel}>{getRatingLabel(avgRating)}</Text>
        <Text style={styles.avgRatingCount}>
          {totalReviews} {totalReviews === 1 ? 'rating' : 'ratings'}
        </Text>
      </View>

      {ratingBreakdown && (
        <View style={styles.barsContainer}>
          <RatingBar label="Love It" count={ratingBreakdown.loveIt} total={totalReviews} color="#10b981" />
          <RatingBar label="Like It" count={ratingBreakdown.likeIt} total={totalReviews} color="#3b82f6" />
          <RatingBar label="Meh" count={ratingBreakdown.meh} total={totalReviews} color="#f59e0b" />
          <RatingBar label="Whatever" count={ratingBreakdown.whatever} total={totalReviews} color="#ef4444" />
        </View>
      )}
    </View>
  );
};

interface RatingBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

const RatingBar: React.FC<RatingBarProps> = ({ label, count, total, color }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <View style={styles.ratingBarContainer}>
      <Text style={styles.ratingBarLabel}>{label}</Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.ratingBarCount}>{count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  score: {
    fontWeight: '700',
  },
  outOf: {
    color: '#6b7280',
    marginLeft: 2,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    color: '#fbbf24',
  },
  starEmpty: {
    color: '#d1d5db',
  },
  emoji: {
    marginRight: 8,
  },
  verdictContainer: {
    marginRight: 8,
  },
  verdictText: {
    fontWeight: '700',
    color: '#2c3e50',
  },
  scoreText: {
    color: '#6b7280',
    marginTop: 2,
  },
  reviewCount: {
    color: '#6b7280',
    marginLeft: 4,
  },
  noReviews: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  breakdownContainer: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  avgRatingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avgRatingValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  avgRatingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  avgRatingCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  noReviewsText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
  barsContainer: {
    marginTop: 4,
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingBarLabel: {
    width: 80,
    fontSize: 12,
    color: '#374151',
    marginRight: 8,
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  ratingBarCount: {
    width: 30,
    textAlign: 'right',
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
});
