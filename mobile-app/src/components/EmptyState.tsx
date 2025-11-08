/**
 * EmptyState Component
 *
 * Reusable empty state display with optional action button.
 * Theme-aware with centered layout.
 */

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, Theme } from '../context/ThemeContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULTS = {
  ICON: '🔍',
  ICON_SIZE: 64,
  PADDING: 40,
  TITLE_SIZE: 20,
  DESCRIPTION_SIZE: 16,
  BUTTON_RADIUS: 20,
  BUTTON_PADDING_H: 24,
  BUTTON_PADDING_V: 12,
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface EmptyStateProps {
  readonly icon?: string;
  readonly title: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const EmptyState = memo(({
  icon = DEFAULTS.ICON,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

// ============================================================================
// STYLES
// ============================================================================

const useStyles = (theme: Theme) => useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DEFAULTS.PADDING,
    backgroundColor: theme.colors.background,
  },
  icon: {
    fontSize: DEFAULTS.ICON_SIZE,
    marginBottom: 20,
    color: theme.colors.text,
  },
  title: {
    fontSize: DEFAULTS.TITLE_SIZE,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: DEFAULTS.DESCRIPTION_SIZE,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: DEFAULTS.BUTTON_PADDING_H,
    paddingVertical: DEFAULTS.BUTTON_PADDING_V,
    borderRadius: DEFAULTS.BUTTON_RADIUS,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}), [theme]);
