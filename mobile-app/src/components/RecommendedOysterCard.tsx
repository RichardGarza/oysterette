/**
 * RecommendedOysterCard Component
 *
 * Horizontal card showing a recommended oyster with match percentage.
 *
 * Features:
 * - Compact horizontal layout optimized for scrolling
 * - Match percentage badge (e.g., "95% Match")
 * - Oyster name, origin, and species
 * - Overall score with star icon
 * - Theme-aware styling (light/dark mode)
 * - Platform-specific shadows
 * - Tap to navigate to oyster detail screen
 *
 * Props:
 * - oyster: Oyster object with similarity score (0-100) or null
 * - onPress: Callback when card is tapped
 *
 * Match Badge:
 * - Shows percentage if available (personalized recommendations)
 * - Shows "Top Rated" if no similarity (fallback recommendations)
 * - Color-coded: green for high match, yellow for medium, gray for fallback
 *
 * Card Layout:
 * - Width: 280px (good for horizontal scrolling)
 * - Height: Auto (compact)
 * - Border radius: 16px
 * - Padding: 16px
 *
 * Usage:
 * ```tsx
 * <RecommendedOysterCard
 *   oyster={oyster}
 *   onPress={() => navigation.navigate('OysterDetail', { oysterId: oyster.id })}
 * />
 * ```
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Oyster } from '../types/Oyster';

interface RecommendedOysterCardProps {
  oyster: Oyster & { similarity?: number | null; reason?: string };
  onPress: () => void;
}

export default function RecommendedOysterCard({ oyster, onPress }: RecommendedOysterCardProps) {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme.colors, isDark);

  // Determine match badge color and text
  const getMatchBadge = () => {
    if (oyster.similarity === null || oyster.similarity === undefined) {
      return { text: 'Top Rated', color: theme.colors.textSecondary };
    }

    const percentage = Math.round(oyster.similarity);

    // Color coding based on match quality
    if (percentage >= 80) {
      return { text: `${percentage}% Match`, color: '#10B981' }; // Green
    } else if (percentage >= 60) {
      return { text: `${percentage}% Match`, color: '#F59E0B' }; // Amber
    } else {
      return { text: `${percentage}% Match`, color: theme.colors.textSecondary }; // Gray
    }
  };

  const matchBadge = getMatchBadge();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Match Badge */}
      <View style={[styles.badge, { backgroundColor: `${matchBadge.color}15` }]}>
        <Text style={[styles.badgeText, { color: matchBadge.color }]}>
          {matchBadge.text}
        </Text>
      </View>

      {/* Oyster Info */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {oyster.name}
        </Text>

        <Text style={styles.details} numberOfLines={1}>
          {oyster.species} • {oyster.origin}
        </Text>

        {/* Overall Score - only show if oyster has reviews */}
        {oyster.totalReviews > 0 ? (
          <>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Overall:</Text>
              <Text style={styles.scoreValue}>{oyster.overallScore.toFixed(1)}</Text>
              <Text style={styles.scoreStar}>★</Text>
            </View>
            <Text style={styles.reviewCount}>
              {oyster.totalReviews} {oyster.totalReviews === 1 ? 'review' : 'reviews'}
            </Text>
          </>
        ) : (
          <Text style={styles.reviewCount}>No ratings yet</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    card: {
      width: 280,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginRight: 12,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      marginBottom: 12,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    content: {
      gap: 6,
    },
    name: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    details: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    scoreLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    scoreValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    scoreStar: {
      fontSize: 14,
      color: colors.primary,
    },
    reviewCount: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });
