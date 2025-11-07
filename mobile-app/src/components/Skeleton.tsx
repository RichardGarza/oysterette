/**
 * Skeleton Component
 *
 * Low-level animated loading placeholder primitive.
 *
 * Features:
 * - Configurable width, height, and border radius
 * - Smooth pulsing animation (opacity 0.3 ↔ 1.0)
 * - 800ms fade duration per direction
 * - Infinite loop animation
 * - Uses native driver for performance
 * - Optional custom styles via style prop
 *
 * Props:
 * - width?: number | string (default: '100%') - Can be px or percentage
 * - height: number (required) - Height in pixels
 * - borderRadius?: number (default: 4) - Corner radius
 * - style?: ViewStyle - Additional styles (margin, etc.)
 *
 * Animation Sequence:
 * 1. Start at opacity 0.3
 * 2. Fade to opacity 1.0 over 800ms
 * 3. Fade back to opacity 0.3 over 800ms
 * 4. Repeat infinitely
 * 5. Cleanup on unmount
 *
 * Usage Examples:
 *
 * 1. Full-width text placeholder:
 *    <Skeleton width="100%" height={16} borderRadius={4} />
 *
 * 2. Fixed-width badge:
 *    <Skeleton width={80} height={24} borderRadius={12} />
 *
 * 3. Square avatar placeholder:
 *    <Skeleton width={50} height={50} borderRadius={25} />
 *
 * 4. With margin:
 *    <Skeleton width="60%" height={20} borderRadius={4} style={{ marginTop: 8 }} />
 *
 * Implementation Details:
 * - Uses Animated.View for smooth transitions
 * - useNativeDriver: true for better performance
 * - Animated.loop ensures infinite animation
 * - useRef prevents animation restarts on re-render
 * - Cleanup function stops animation on unmount
 *
 * Styling:
 * - Background color: #e0e0e0 (light gray)
 * - No shadows or borders (parent component handles)
 *
 * Used By:
 * - OysterCardSkeleton: Composes multiple skeletons for card layout
 * - Can be used directly for custom skeleton layouts
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
});
