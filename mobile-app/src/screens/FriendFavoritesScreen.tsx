/**
 * FriendFavoritesScreen
 *
 * Displays a friend's favorited oysters.
 * Shows empty state if they haven't favorited anything.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  Appbar,
  IconButton,
} from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Oyster } from '../types/Oyster';
import { EmptyState } from '../components/EmptyState';
import { favoritesStorage } from '../services/favorites';
import { usePublicProfileFavorites } from '../hooks/useQueries';

export default function FriendFavoritesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark, paperTheme } = useTheme();
  const { userId, userName } = route.params;

  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // React Query hook for friend's favorites
  const {
    data: friendFavorites = [],
    isLoading: loading,
    isError: error,
    refetch
  } = usePublicProfileFavorites(userId);

  const loadFavorites = useCallback(async () => {
    const favs = await favoritesStorage.getFavorites();
    setFavorites(new Set(favs));
  }, []);

  React.useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleToggleFavorite = useCallback(async (oysterId: string, e: any) => {
    e.stopPropagation();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = await favoritesStorage.toggleFavorite(oysterId);
    if (newState) {
      setFavorites(prev => new Set([...prev, oysterId]));
    } else {
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(oysterId);
        return next;
      });
    }
  }, []);

  const renderOysterItem = useCallback(({ item }: { item: Oyster }) => (
    <Card
      mode="elevated"
      style={styles.card}
      onPress={() => navigation.navigate('OysterDetail', { oysterId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.oysterName} numberOfLines={2}>
            {item.name}
          </Text>
          <IconButton
            icon={favorites.has(item.id) ? 'heart' : 'heart-outline'}
            iconColor={favorites.has(item.id) ? '#e74c3c' : undefined}
            size={20}
            onPress={(e) => handleToggleFavorite(item.id, e)}
            style={styles.favoriteButton}
          />
        </View>

        {item.species && item.species !== 'Unknown' && (
          <Text variant="bodySmall" style={styles.species}>{item.species}</Text>
        )}

        {item.origin && item.origin !== 'Unknown' && (
          <Text variant="bodySmall" style={styles.origin}>{item.origin}</Text>
        )}

        {item.standoutNotes && (
          <Text variant="bodySmall" style={styles.notes} numberOfLines={2}>
            {item.standoutNotes}
          </Text>
        )}

        <View style={styles.attributesContainer}>
          <View style={styles.attributeItem}>
            <Text variant="labelSmall" style={styles.attributeLabel}>Size</Text>
            <Text variant="bodyMedium" style={styles.attributeValue}>{item.size}/10</Text>
          </View>
          <View style={styles.attributeItem}>
            <Text variant="labelSmall" style={styles.attributeLabel}>Body</Text>
            <Text variant="bodyMedium" style={styles.attributeValue}>{item.body}/10</Text>
          </View>
          <View style={styles.attributeItem}>
            <Text variant="labelSmall" style={styles.attributeLabel}>Brine</Text>
            <Text variant="bodyMedium" style={styles.attributeValue}>{item.sweetBrininess}/10</Text>
          </View>
          <View style={styles.attributeItem}>
            <Text variant="labelSmall" style={styles.attributeLabel}>Flavor</Text>
            <Text variant="bodyMedium" style={styles.attributeValue}>{item.flavorfulness}/10</Text>
          </View>
          <View style={styles.attributeItem}>
            <Text variant="labelSmall" style={styles.attributeLabel}>Cream</Text>
            <Text variant="bodyMedium" style={styles.attributeValue}>{item.creaminess}/10</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  ), [navigation, favorites, handleToggleFavorite, styles]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: paperTheme.colors.background,
    },
    listContainer: {
      padding: 15,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    oysterName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
      marginRight: 10,
    },
    favoriteButton: {
      padding: 4,
    },
    species: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    origin: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    notes: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      marginBottom: 12,
      lineHeight: 18,
    },
    attributesContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexWrap: 'wrap',
    },
    attributeItem: {
      alignItems: 'center',
      minWidth: '18%',
    },
    attributeLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      marginBottom: 4,
      textAlign: 'center',
    },
    attributeValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      color: theme.colors.textSecondary,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} iconColor="#fff" />
          <Appbar.Content
            title={`${userName || 'User'}'s Favorites`}
            titleStyle={{ color: '#fff', fontWeight: 'bold' }}
          />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" animating={true} />
          <Text variant="bodyLarge" style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} iconColor="#fff" />
          <Appbar.Content
            title={`${userName || 'User'}'s Favorites`}
            titleStyle={{ color: '#fff', fontWeight: 'bold' }}
          />
        </Appbar.Header>
        <EmptyState
          icon="🔒"
          title="Favorites are Private"
          description={`${userName || 'This user'} has not made their favorites public.`}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} iconColor="#fff" />
        <Appbar.Content
          title={`${userName || 'User'}'s Favorites`}
          titleStyle={{ color: '#fff', fontWeight: 'bold' }}
        />
      </Appbar.Header>

      <FlatList
        data={friendFavorites}
        renderItem={renderOysterItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <EmptyState
            icon="❤️"
            title="No Favorites Yet"
            description={`${userName || 'This user'} has not favorited any oysters yet!`}
          />
        }
      />
    </SafeAreaView>
  );
}
