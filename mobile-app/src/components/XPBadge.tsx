/**
 * XP Badge Component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar, useTheme } from 'react-native-paper';

interface XPBadgeProps {
  readonly xp: number;
  readonly level: number;
  readonly compact?: boolean;
}

const getXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(level - 1, 1.5));
};

export const XPBadge: React.FC<XPBadgeProps> = React.memo(({ xp, level, compact = false }) => {
  const theme = useTheme();

  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpInLevel = xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progress = xpInLevel / xpNeeded;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={[styles.levelBadge, { backgroundColor: theme.colors.primary }]}>
          Lv {level}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium">Level {level}</Text>
        <Text variant="bodySmall" style={styles.xpText}>
          {xpInLevel} / {xpNeeded} XP
        </Text>
      </View>
      <ProgressBar progress={progress} style={styles.progressBar} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpText: {
    opacity: 0.7,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
