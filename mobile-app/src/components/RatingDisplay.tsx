import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
  const stars = (overallScore / 10) * 5;
  const fullStars = Math.floor(stars);
  const hasHalfStar = stars % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  // Get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 8) return '#10b981'; // green
    if (score >= 6) return '#f59e0b'; // yellow/orange
    if (score >= 4) return '#ef4444'; // red
    return '#9ca3af'; // gray
  };

  const sizeStyles = {
    small: { fontSize: 14, starSize: 12 },
    medium: { fontSize: 16, starSize: 14 },
    large: { fontSize: 20, starSize: 18 },
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

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <Text
          style={[
            styles.score,
            { fontSize: currentSize.fontSize, color: getScoreColor(overallScore) },
          ]}
        >
          {overallScore.toFixed(1)}
        </Text>
        <Text style={[styles.outOf, { fontSize: currentSize.fontSize - 4 }]}>/10</Text>
      </View>

      {showDetails && (
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
      )}

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
    lovedIt: number;
    likedIt: number;
    meh: number;
    hatedIt: number;
  };
}

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  avgRating,
  totalReviews,
  ratingBreakdown,
}) => {
  const getRatingLabel = (value: number): string => {
    if (value >= 3.5) return 'Loved It';
    if (value >= 2.5) return 'Liked It';
    if (value >= 1.5) return 'Meh';
    return 'Hated It';
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
          <RatingBar label="Loved It" count={ratingBreakdown.lovedIt} total={totalReviews} color="#10b981" />
          <RatingBar label="Liked It" count={ratingBreakdown.likedIt} total={totalReviews} color="#3b82f6" />
          <RatingBar label="Meh" count={ratingBreakdown.meh} total={totalReviews} color="#f59e0b" />
          <RatingBar label="Hated It" count={ratingBreakdown.hatedIt} total={totalReviews} color="#ef4444" />
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
    marginLeft: 8,
  },
  star: {
    color: '#fbbf24',
  },
  starEmpty: {
    color: '#d1d5db',
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
