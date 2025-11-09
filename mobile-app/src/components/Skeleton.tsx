/**
 * Skeleton Component
 *
 * Animated loading placeholder with pulsing effect.
 */

import React, { useEffect, useRef, memo } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

// ============================================================================
// CONSTANTS
// ============================================================================

const ANIMATION_CONFIG = {
  MIN_OPACITY: 0.3,
  MAX_OPACITY: 1,
  DURATION: 800,
} as const;

const DEFAULT_PROPS = {
  WIDTH: '100%' as const,
  BORDER_RADIUS: 4,
} as const;

const SKELETON_COLOR = '#e0e0e0';

// ============================================================================
// TYPES
// ============================================================================

interface SkeletonProps {
  readonly width?: number | string;
  readonly height: number;
  readonly borderRadius?: number;
  readonly style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Skeleton = memo(({
  width = DEFAULT_PROPS.WIDTH,
  height,
  borderRadius = DEFAULT_PROPS.BORDER_RADIUS,
  style,
}: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(ANIMATION_CONFIG.MIN_OPACITY)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: ANIMATION_CONFIG.MAX_OPACITY,
          duration: ANIMATION_CONFIG.DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: ANIMATION_CONFIG.MIN_OPACITY,
          duration: ANIMATION_CONFIG.DURATION,
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
          width,
          height,
          borderRadius,
          opacity,
        } as any,
        style,
      ]}
    />
  );
});

Skeleton.displayName = 'Skeleton';

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: SKELETON_COLOR,
  },
});
