/**
 * OysterCardSkeleton Component
 *
 * Loading placeholder that matches OysterListScreen card layout.
 *
 * Features:
 * - Animated skeleton boxes using Skeleton component
 * - Matches exact layout of oyster card:
 *   - Header (name + species badge)
 *   - Origin text
 *   - Rating display
 *   - Notes preview (2 lines)
 *   - 5 attribute scores
 *   - Review count
 * - Card styling with shadow and rounded corners
 * - Used during initial load and pull-to-refresh
 *
 * Layout Structure:
 * 1. Header row:
 *    - Left: Oyster name placeholder (60% width, 24px height)
 *    - Right: Species badge (80px width, 24px height)
 * 2. Origin placeholder (40% width, 16px height)
 * 3. Rating placeholder (120px width, 20px height)
 * 4. Notes placeholder (100% width, 36px height for 2 lines)
 * 5. Attributes row (5 items, evenly spaced):
 *    - Each: Label (40px) + Value (30px)
 * 6. Review count (80px width, 14px height)
 *
 * Skeleton Animation:
 * - Uses Skeleton component for pulsing effect
 * - Opacity oscillates 0.3 → 1.0 → 0.3 (800ms each)
 * - Creates loading shimmer effect
 * - Consistent gray color (#e0e0e0)
 *
 * Styling:
 * - White background
 * - 12px border radius
 * - 15px padding
 * - 15px bottom margin
 * - Shadow: iOS (opacity 0.1, radius 4) / Android (elevation 3)
 *
 * Used In:
 * - OysterListScreen: Shows 5 skeletons during initial load
 * - TopOystersScreen: Shows 5 skeletons during initial load
 *
 * Design Pattern:
 * - Matches real card dimensions exactly
 * - Provides visual continuity during loading
 * - Reduces perceived wait time
 * - Better UX than spinner for list views
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';

export function OysterCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width="60%" height={24} borderRadius={4} />
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>

      {/* Origin */}
      <Skeleton width="40%" height={16} borderRadius={4} style={styles.spacing} />

      {/* Rating */}
      <Skeleton width={120} height={20} borderRadius={4} style={styles.spacing} />

      {/* Notes */}
      <Skeleton width="100%" height={36} borderRadius={4} style={styles.spacing} />

      {/* Attributes */}
      <View style={styles.attributesContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.attributeItem}>
            <Skeleton width={40} height={12} borderRadius={4} />
            <Skeleton width={30} height={16} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Review count */}
      <Skeleton width={80} height={14} borderRadius={4} style={styles.spacing} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
});
