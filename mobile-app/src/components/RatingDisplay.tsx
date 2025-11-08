/**
 * RatingDisplay Component
 *
 * Reusable rating visualization with multiple display modes.
 * Converts 0-10 backend scores to 0-5 star display.
 */

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scoreToVerdict, scoreToStars } from '../utils/ratingUtils';

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_CONFIG = {
  small: { fontSize: 14, starSize: 14, emojiSize: 16 },
  medium: { fontSize: 18, starSize: 16, emojiSize: 24 },
  large: { fontSize: 22, starSize: 18, emojiSize: 32 },
} as const;

const RATING_COLORS = {
  LOVE_IT: '#10b981',
  LIKE_IT: '#3b82f6',
  OKAY: '#f59e0b',
  MEH: '#ef4444',
} as const;

const COLORS = {
  STAR_FILLED: '#fbbf24',
  STAR_EMPTY: '#d1d5db',
  TEXT_PRIMARY: '#2c3e50',
  TEXT_SECONDARY: '#6b7280',
  TEXT_MUTED: '#9ca3af',
  BACKGROUND: '#f9fafb',
  BAR_BACKGROUND: '#e5e7eb',
} as const;

const RATING_THRESHOLDS = {
  LOVE_IT: 3.5,
  LIKE_IT: 2.5,
  OKAY: 1.5,
} as const;

const STAR_CONFIG = {
  MAX_STARS: 5,
  HALF_THRESHOLD: 0.5,
  STAR_FULL: '★',
  STAR_HALF: '½',
  STAR_EMPTY: '☆',
} as const;

// ============================================================================
// TYPES
// ============================================================================

type DisplaySize = 'small' | 'medium' | 'large';

interface RatingDisplayProps {
  readonly overallScore: number;
  readonly totalReviews: number;
  readonly size?: DisplaySize;
  readonly showDetails?: boolean;
}

interface RatingBreakdownProps {
  readonly avgRating: number;
  readonly totalReviews: number;
  readonly ratingBreakdown?: {
    loveIt: number;
    likeIt: number;
    okay: number;
    meh: number;
  };
}

interface RatingBarProps {
  readonly label: string;
  readonly count: number;
  readonly total: number;
  readonly color: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getRatingLabel(value: number): string {
  if (value >= RATING_THRESHOLDS.LOVE_IT) return 'Love It';
  if (value >= RATING_THRESHOLDS.LIKE_IT) return 'Like It';
  if (value >= RATING_THRESHOLDS.OKAY) return 'Okay';
  return 'Meh';
}

function getRatingColor(value: number): string {
  if (value >= RATING_THRESHOLDS.LOVE_IT) return RATING_COLORS.LOVE_IT;
  if (value >= RATING_THRESHOLDS.LIKE_IT) return RATING_COLORS.LIKE_IT;
  if (value >= RATING_THRESHOLDS.OKAY) return RATING_COLORS.OKAY;
  return RATING_COLORS.MEH;
}

// ============================================================================
// RATING DISPLAY COMPONENT
// ============================================================================

export const RatingDisplay = memo<RatingDisplayProps>(({
  overallScore,
  totalReviews,
  size = 'medium',
  showDetails = true,
}) => {
  const currentSize = SIZE_CONFIG[size];

  const stars = useMemo(() => scoreToStars(overallScore), [overallScore]);
  const fullStars = useMemo(() => Math.floor(stars), [stars]);
  const hasHalfStar = useMemo(() => stars % 1 >= STAR_CONFIG.HALF_THRESHOLD, [stars]);
  const emptyStars = useMemo(() => STAR_CONFIG.MAX_STARS - fullStars - (hasHalfStar ? 1 : 0), [fullStars, hasHalfStar]);

  const verdict = useMemo(() => scoreToVerdict(overallScore), [overallScore]);

  if (totalReviews === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.noReviews, { fontSize: currentSize.fontSize - 2 }]}>
          No reviews yet
        </Text>
      </View>
    );
  }

  if (size === 'small') {
    return (
      <View style={styles.container}>
        <View style={styles.starsContainer}>
          {Array.from({ length: fullStars }).map((_, i) => (
            <Text key={`full-${i}`} style={[styles.star, { fontSize: currentSize.starSize }]}>
              {STAR_CONFIG.STAR_FULL}
            </Text>
          ))}
          {hasHalfStar && (
            <Text style={[styles.star, { fontSize: currentSize.starSize }]}>{STAR_CONFIG.STAR_HALF}</Text>
          )}
          {Array.from({ length: emptyStars }).map((_, i) => (
            <Text key={`empty-${i}`} style={[styles.starEmpty, { fontSize: currentSize.starSize }]}>
              {STAR_CONFIG.STAR_EMPTY}
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
});

RatingDisplay.displayName = 'RatingDisplay';

// ============================================================================
// RATING BREAKDOWN COMPONENT
// ============================================================================

export const RatingBreakdown = memo<RatingBreakdownProps>(({
  avgRating,
  totalReviews,
  ratingBreakdown,
}) => {
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
          <RatingBar label="Love It" count={ratingBreakdown.loveIt} total={totalReviews} color={RATING_COLORS.LOVE_IT} />
          <RatingBar label="Like It" count={ratingBreakdown.likeIt} total={totalReviews} color={RATING_COLORS.LIKE_IT} />
          <RatingBar label="Okay" count={ratingBreakdown.okay} total={totalReviews} color={RATING_COLORS.OKAY} />
          <RatingBar label="Meh" count={ratingBreakdown.meh} total={totalReviews} color={RATING_COLORS.MEH} />
        </View>
      )}
    </View>
  );
});

RatingBreakdown.displayName = 'RatingBreakdown';

// ============================================================================
// RATING BAR COMPONENT
// ============================================================================

const RatingBar = memo<RatingBarProps>(({ label, count, total, color }) => {
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
});

RatingBar.displayName = 'RatingBar';

// ============================================================================
// STYLES
// ============================================================================

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
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 2,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    color: COLORS.STAR_FILLED,
  },
  starEmpty: {
    color: COLORS.STAR_EMPTY,
  },
  emoji: {
    marginRight: 8,
  },
  verdictContainer: {
    marginRight: 8,
  },
  verdictText: {
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  scoreText: {
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  reviewCount: {
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 4,
  },
  noReviews: {
    color: COLORS.TEXT_MUTED,
    fontStyle: 'italic',
  },
  breakdownContainer: {
    padding: 16,
    backgroundColor: COLORS.BACKGROUND,
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
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  noReviewsText: {
    textAlign: 'center',
    color: COLORS.TEXT_SECONDARY,
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
    backgroundColor: COLORS.BAR_BACKGROUND,
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
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
  },
});
