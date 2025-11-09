/**
 * XP Stats Screen
 */

import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, useTheme, Chip, List, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getXPStats, getAchievements, getLeaderboard } from '../services/api';
import { XPBadge } from '../components/XPBadge';
import { EmptyState } from '../components/EmptyState';

const TABS = ['Stats', 'Achievements', 'Leaderboard'] as const;

export default function XPStatsScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Stats');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const loadData = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (__DEV__) {
        console.log('📊 [XPStats] Loading XP data...');
      }

      const [statsData, achievementsData, leaderboardData] = await Promise.all([
        getXPStats(),
        getAchievements(),
        getLeaderboard(),
      ]);

      if (__DEV__) {
        console.log('📊 [XPStats] Stats:', statsData);
        console.log('📊 [XPStats] Achievements:', achievementsData);
        console.log('📊 [XPStats] Leaderboard:', leaderboardData);
      }

      setStats(statsData);
      setAchievements(achievementsData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [XPStats] Failed to load XP data:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" animating={true} />
          <Text style={styles.loadingText}>Loading your XP stats...</Text>
        </View>
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
            {achievements.length > 0 ? (
              achievements.map((achievement) => {
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
              })
            ) : (
              <EmptyState
                icon="🏆"
                title="No Achievements Yet"
                description="Complete reviews and actions to unlock achievements!"
              />
            )}
          </View>
        )}

        {activeTab === 'Leaderboard' && (
          <View>
            {leaderboard.length > 0 ? (
              leaderboard.map((user, index) => (
                <List.Item
                  key={user.id}
                  title={user.name}
                  description={`Level ${user.level} • ${user.xp} XP`}
                  left={() => <Text style={styles.rank}>#{index + 1}</Text>}
                />
              ))
            ) : (
              <EmptyState
                icon="📊"
                title="No Leaderboard Data"
                description="Be the first to earn XP and appear on the leaderboard!"
              />
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
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
