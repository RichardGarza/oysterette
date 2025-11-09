/**
 * PairedMatchesScreen
 *
 * Displays oyster recommendations that both users would enjoy.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { Card, Text, Appbar, ProgressBar, IconButton } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/types';

const MIN_MATCH_THRESHOLD = 70;

type PairedMatch = RootStackParamList['PairedMatches']['matches'][0];

export default function PairedMatchesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { paperTheme } = useTheme();
  const route = useRoute<RouteProp<RootStackParamList, 'PairedMatches'>>();
  const { friendName, matches } = route.params;

  const handleOysterPress = useCallback((oysterId: string) => {
    navigation.navigate('OysterDetail', { oysterId });
  }, [navigation]);

  const renderMatch = useCallback(({ item }: { item: PairedMatch }) => (
    <Card
      mode="elevated"
      style={styles.card}
      onPress={() => handleOysterPress(item.oyster.id)}
    >
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text variant="titleMedium" style={styles.oysterName}>
              {item.oyster.name}
            </Text>
            <Text variant="bodySmall" style={styles.oysterInfo}>
              {item.oyster.species} • {item.oyster.origin}
            </Text>
          </View>
          <View style={styles.scoreContainer}>
            <View style={styles.combinedScore}>
              <Text variant="headlineSmall" style={{ color: paperTheme.colors.primary }}>
                {Math.round(item.combinedScore)}%
              </Text>
              <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                Combined
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              size={24}
              style={styles.chevron}
            />
          </View>
        </View>

        <View style={styles.matchesContainer}>
          <View style={styles.matchRow}>
            <Text variant="bodyMedium" style={styles.matchLabel}>
              Your Match
            </Text>
            <Text variant="bodyMedium" style={styles.matchValue}>
              {item.userMatch}%
            </Text>
          </View>
          <ProgressBar
            progress={item.userMatch / 100}
            style={styles.progressBar}
            color={paperTheme.colors.primary}
          />

          <View style={styles.matchRow}>
            <Text variant="bodyMedium" style={styles.matchLabel}>
              {friendName}'s Match
            </Text>
            <Text variant="bodyMedium" style={styles.matchValue}>
              {item.friendMatch}%
            </Text>
          </View>
          <ProgressBar
            progress={item.friendMatch / 100}
            style={styles.progressBar}
            color={paperTheme.colors.secondary}
          />
        </View>
      </Card.Content>
    </Card>
  ), [friendName, handleOysterPress, paperTheme.colors.primary, paperTheme.colors.secondary]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={`Paired with ${friendName}`} />
      </Appbar.Header>

      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.oyster.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">No paired matches found</Text>
            <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 8 }}>
              Both users need at least {MIN_MATCH_THRESHOLD}% match with an oyster
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  oysterName: {
    fontWeight: 'bold',
  },
  oysterInfo: {
    opacity: 0.7,
    marginTop: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  combinedScore: {
    alignItems: 'center',
  },
  chevron: {
    margin: 0,
  },
  matchesContainer: {
    gap: 8,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  matchLabel: {
    opacity: 0.7,
  },
  matchValue: {
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  empty: {
    alignItems: 'center',
    padding: 32,
  },
});
