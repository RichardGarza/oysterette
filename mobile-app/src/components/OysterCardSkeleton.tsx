/**
 * OysterCardSkeleton Component
 *
 * Animated loading placeholder matching oyster card layout.
 */

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_CONFIG = {
  BACKGROUND: '#fff',
  BORDER_RADIUS: 12,
  PADDING: 15,
  MARGIN_BOTTOM: 15,
  SHADOW_COLOR: '#000',
  SHADOW_OFFSET: { width: 0, height: 2 },
  SHADOW_OPACITY: 0.1,
  SHADOW_RADIUS: 4,
  ELEVATION: 3,
} as const;

const SKELETON_CONFIG = {
  HEADER_NAME_WIDTH: '60%',
  HEADER_BADGE_WIDTH: 80,
  ORIGIN_WIDTH: '40%',
  RATING_WIDTH: 120,
  NOTES_WIDTH: '100%',
  ATTRIBUTE_LABEL_WIDTH: 40,
  ATTRIBUTE_VALUE_WIDTH: 30,
  REVIEW_COUNT_WIDTH: 80,
  ATTRIBUTE_COUNT: 5,
} as const;

const HEIGHTS = {
  HEADER: 24,
  ORIGIN: 16,
  RATING: 20,
  NOTES: 36,
  ATTRIBUTE_LABEL: 12,
  ATTRIBUTE_VALUE: 16,
  REVIEW_COUNT: 14,
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export const OysterCardSkeleton = memo(() => {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton
          width={SKELETON_CONFIG.HEADER_NAME_WIDTH}
          height={HEIGHTS.HEADER}
          borderRadius={4}
        />
        <Skeleton
          width={SKELETON_CONFIG.HEADER_BADGE_WIDTH}
          height={HEIGHTS.HEADER}
          borderRadius={12}
        />
      </View>

      {/* Origin */}
      <Skeleton
        width={SKELETON_CONFIG.ORIGIN_WIDTH}
        height={HEIGHTS.ORIGIN}
        borderRadius={4}
        style={styles.spacing}
      />

      {/* Rating */}
      <Skeleton
        width={SKELETON_CONFIG.RATING_WIDTH}
        height={HEIGHTS.RATING}
        borderRadius={4}
        style={styles.spacing}
      />

      {/* Notes */}
      <Skeleton
        width={SKELETON_CONFIG.NOTES_WIDTH}
        height={HEIGHTS.NOTES}
        borderRadius={4}
        style={styles.spacing}
      />

      {/* Attributes */}
      <View style={styles.attributesContainer}>
        {Array.from({ length: SKELETON_CONFIG.ATTRIBUTE_COUNT }).map((_, i) => (
          <View key={i} style={styles.attributeItem}>
            <Skeleton
              width={SKELETON_CONFIG.ATTRIBUTE_LABEL_WIDTH}
              height={HEIGHTS.ATTRIBUTE_LABEL}
              borderRadius={4}
            />
            <Skeleton
              width={SKELETON_CONFIG.ATTRIBUTE_VALUE_WIDTH}
              height={HEIGHTS.ATTRIBUTE_VALUE}
              borderRadius={4}
              style={styles.attributeValueSpacing}
            />
          </View>
        ))}
      </View>

      {/* Review count */}
      <Skeleton
        width={SKELETON_CONFIG.REVIEW_COUNT_WIDTH}
        height={HEIGHTS.REVIEW_COUNT}
        borderRadius={4}
        style={styles.spacing}
      />
    </View>
  );
});

OysterCardSkeleton.displayName = 'OysterCardSkeleton';

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_CONFIG.BACKGROUND,
    borderRadius: CARD_CONFIG.BORDER_RADIUS,
    padding: CARD_CONFIG.PADDING,
    marginBottom: CARD_CONFIG.MARGIN_BOTTOM,
    shadowColor: CARD_CONFIG.SHADOW_COLOR,
    shadowOffset: CARD_CONFIG.SHADOW_OFFSET,
    shadowOpacity: CARD_CONFIG.SHADOW_OPACITY,
    shadowRadius: CARD_CONFIG.SHADOW_RADIUS,
    elevation: CARD_CONFIG.ELEVATION,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  spacing: {
    marginBottom: 8,
  },
  attributesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    marginBottom: 8,
  },
  attributeItem: {
    alignItems: 'center',
    minWidth: '18%',
  },
  attributeValueSpacing: {
    marginTop: 4,
  },
});
