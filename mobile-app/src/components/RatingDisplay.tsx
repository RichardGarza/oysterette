/**
 * RatingDisplay Component
 *
 * Reusable rating visualization with multiple display modes.
 * Converts 0-10 backend scores to 0-5 star display.
 */

import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import { scoreToVerdict, scoreToStars } from '../utils/ratingUtils';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();

  if (totalReviews === 0) {
    return (
      <Surface style={styles.breakdownContainer}>
        <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
          No ratings yet. Be the first to review!
        </Text>
      </Surface>
    );
  }

  return (
    <Surface style={styles.breakdownContainer}>
      <View style={styles.avgRatingContainer}>
        <Text variant="displaySmall" style={{ color: getRatingColor(avgRating), fontWeight: '700' }}>
          {avgRating.toFixed(1)}
        </Text>
        <Text variant="titleMedium" style={{ color: theme.colors.text, marginTop: 4 }}>
          {getRatingLabel(avgRating)}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary, marginTop: 2 }}>
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
    </Surface>
  );
});

RatingBreakdown.displayName = 'RatingBreakdown';

// ============================================================================
// RATING BAR COMPONENT
// ============================================================================

const RatingBar = memo<RatingBarProps>(({ label, count, total, color }) => {
  const progress = total > 0 ? count / total : 0;

  return (
    <View style={styles.ratingBarContainer}>
      <Text variant="bodySmall" style={styles.ratingBarLabel}>{label}</Text>
      <ProgressBar
        progress={progress}
        color={color}
        style={styles.progressBar}
      />
      <Text variant="bodySmall" style={styles.ratingBarCount}>{count}</Text>
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
    borderRadius: 8,
  },
  avgRatingContainer: {
    alignItems: 'center',
    marginBottom: 16,
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
    width: 70,
    marginRight: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  ratingBarCount: {
    width: 30,
    textAlign: 'right',
    fontWeight: '600',
  },
});
