/**
 * EmptyState Component
 *
 * Reusable empty state display with optional action button.
 *
 * Features:
 * - Large emoji icon (64px)
 * - Title and optional description
 * - Optional call-to-action button
 * - Theme-aware styling
 * - Centered layout with padding
 *
 * Props:
 * - icon?: string (default: '🔍') - Emoji to display
 * - title: string - Main message
 * - description?: string - Optional longer explanation
 * - actionLabel?: string - Button text (if provided)
 * - onAction?: () => void - Button callback (if provided)
 *
 * Usage Examples:
 *
 * 1. No Favorites:
 *    <EmptyState
 *      icon="❤️"
 *      title="No Favorites Yet"
 *      description="You haven't added any oysters to your favorites..."
 *      actionLabel="View All Oysters"
 *      onAction={() => setShowFavoritesOnly(false)}
 *    />
 *
 * 2. No Search Results:
 *    <EmptyState
 *      icon="🔎"
 *      title="No Oysters Found"
 *      description={`No results for "${searchQuery}". Try a different search...`}
 *      actionLabel="Clear Search"
 *      onAction={() => handleSearch('')}
 *    />
 *
 * 3. No Reviews:
 *    <EmptyState
 *      icon="📝"
 *      title="No Reviews Yet"
 *      description="Be the first to share your tasting experience..."
 *    />
 *
 * Layout:
 * - Centered vertically and horizontally
 * - Icon at top
 * - Title below icon (bold, 20px)
 * - Description below title (16px, secondary color)
 * - Action button at bottom (if provided)
 *
 * Button Styling:
 * - Primary color background
 * - White text
 * - Rounded (20px border radius)
 * - Padding: 24px horizontal, 12px vertical
 *
 * Used In:
 * - OysterListScreen (no favorites, no search results)
 * - OysterDetailScreen (no reviews)
 * - ProfileScreen (no reviews yet)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '🔍',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { theme } = useTheme();

  const styles = createStyles(theme.colors);

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
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      backgroundColor: colors.background,
    },
    icon: {
      fontSize: 64,
      marginBottom: 20,
      color: colors.text,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 10,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 20,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 20,
      marginTop: 10,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
