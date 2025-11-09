/**
 * XP Stats Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, useTheme, Chip, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getXPStats, getAchievements, getLeaderboard } from '../services/api';
import { XPBadge } from '../components/XPBadge';

const TABS = ['Stats', 'Achievements', 'Leaderboard'] as const;

export default function XPStatsScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Stats');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [statsData, achievementsData, leaderboardData] = await Promise.all([
        getXPStats(),
        getAchievements(),
        getLeaderboard(),
      ]);
      setStats(statsData);
      setAchievements(achievementsData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Failed to load XP data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Chip
            key={tab}
            selected={activeTab === tab}
            onPress={() => setActiveTab(tab)}
            style={styles.tab}
          >
            {tab}
          </Chip>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'Stats' && stats && (
          <View>
            <XPBadge xp={stats.xp} level={stats.level} />
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Streaks</Text>
                <Text>Current: {stats.currentStreak} days</Text>
                <Text>Longest: {stats.longestStreak} days</Text>
              </Card.Content>
            </Card>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Achievements Unlocked</Text>
                <Text>{stats.achievements.length} total</Text>
              </Card.Content>
            </Card>
          </View>
        )}

        {activeTab === 'Achievements' && (
          <View>
            {achievements.map((achievement) => {
              const unlocked = stats?.achievements.find(
                (a: any) => a.key === achievement.key
              );
              return (
                <Card key={achievement.id} style={styles.card}>
                  <Card.Content>
                    <View style={styles.achievementHeader}>
                      <Text variant="titleMedium">{achievement.name}</Text>
                      {unlocked && <Text>✅</Text>}
                    </View>
                    <Text>{achievement.description}</Text>
                    <Text style={styles.xpReward}>+{achievement.xpReward} XP</Text>
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        )}

        {activeTab === 'Leaderboard' && (
          <View>
            {leaderboard.map((user, index) => (
              <List.Item
                key={user.id}
                title={user.name}
                description={`Level ${user.level} • ${user.xp} XP`}
                left={() => <Text style={styles.rank}>#{index + 1}</Text>}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpReward: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 16,
  },
});
