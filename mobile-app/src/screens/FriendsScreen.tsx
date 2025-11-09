/**
 * FriendsScreen
 *
 * Social features - friend list and pending requests.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, SafeAreaView } from 'react-native';
import { Card, Text, Button, Appbar, SegmentedButtons, Avatar, Searchbar, Snackbar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { friendApi, userApi } from '../services/api';
import { RootStackParamList } from '../navigation/types';

interface Friend {
  id: string;
  name: string;
  email: string;
  profilePhotoUrl: string | null;
  friendshipId: string;
  since: string;
}

interface PendingRequest {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    profilePhotoUrl: string | null;
  };
  createdAt: string;
}

export default function FriendsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { paperTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ sent: PendingRequest[]; received: PendingRequest[] }>({
    sent: [],
    received: [],
  });
  const [activity, setActivity] = useState<any[]>([]);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [friendsData, pendingData, activityData] = await Promise.all([
        friendApi.getFriends(),
        friendApi.getPendingRequests(),
        friendApi.getActivity(),
      ]);
      setFriends(friendsData);
      setPendingRequests(pendingData);
      setActivity(activityData);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [FriendsScreen] Error loading data:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleAccept = useCallback(async (friendshipId: string) => {
    try {
      await friendApi.acceptRequest(friendshipId);
      loadData();
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [FriendsScreen] Error accepting request:', error);
      }
    }
  }, [loadData]);

  const handleReject = useCallback(async (friendshipId: string) => {
    try {
      await friendApi.rejectRequest(friendshipId);
      loadData();
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [FriendsScreen] Error rejecting request:', error);
      }
    }
  }, [loadData]);

  const handleRemove = useCallback(async (friendshipId: string) => {
    try {
      await friendApi.removeFriend(friendshipId);
      loadData();
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [FriendsScreen] Error removing friend:', error);
      }
    }
  }, [loadData]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const results = await userApi.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [FriendsScreen] Error searching users:', error);
      }
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSendRequest = useCallback(async (userId: string) => {
    try {
      setSendingRequest(userId);
      await friendApi.sendRequest(userId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSnackbarMessage('Friend request sent!');
      setSnackbarVisible(true);
      loadData();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ [FriendsScreen] Error sending request:', error);
      }
      setSnackbarMessage(error.response?.data?.error || 'Failed to send request');
      setSnackbarVisible(true);
    } finally {
      setSendingRequest(null);
    }
  }, [loadData]);

  const handleViewPaired = useCallback(async (friendId: string, friendName: string) => {
    try {
      const matches = await friendApi.getPairedRecommendations(friendId);
      navigation.navigate('PairedMatches', { friendName, matches });
    } catch (error: any) {
      const errorCode = error.response?.data?.error;

      if (errorCode === 'friend_missing') {
        Alert.alert(
          'Flavor Preferences Missing',
          `Your friend doesn't have flavor preferences yet! Once they rate an oyster, you can see your paired matches!`,
          [{ text: 'Got It' }]
        );
      } else if (errorCode === 'user_missing') {
        Alert.alert(
          'Flavor Preferences Missing',
          `You don't have flavor preferences yet! Rate an oyster to see your paired matches!`,
          [{ text: 'Got It' }]
        );
      } else if (errorCode === 'both_missing') {
        Alert.alert(
          'Flavor Preferences Missing',
          `You and your friend don't have flavor preferences yet! Start reviewing oysters to activate paired matches!`,
          [{ text: 'Got It' }]
        );
      } else {
        Alert.alert(
          'Unable to Load Matches',
          'Could not load paired recommendations. Please try again.',
          [{ text: 'OK' }]
        );
      }

      if (__DEV__) {
        console.error('❌ [FriendsScreen] Error getting paired recommendations:', error);
      }
    }
  }, [navigation]);

  const renderFriend = ({ item }: { item: Friend }) => (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        <View style={styles.friendRow}>
          <Avatar.Text
            size={48}
            label={item.name.charAt(0).toUpperCase()}
            style={{ backgroundColor: paperTheme.colors.primary }}
          />
          <View style={styles.friendInfo}>
            <Text variant="titleMedium">{item.name}</Text>
            <Text variant="bodySmall" style={{ opacity: 0.7 }}>{item.email}</Text>
          </View>
        </View>
        <View style={styles.friendActions}>
          <Button
            mode="contained"
            onPress={() => handleViewPaired(item.id, item.name)}
            style={{ flex: 1, marginRight: 8 }}
            compact
            icon="heart-multiple"
          >
            Paired Matches
          </Button>
          <Button mode="outlined" onPress={() => handleRemove(item.friendshipId)} compact>
            Remove
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderReceived = ({ item }: { item: PendingRequest }) => (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        <View style={styles.friendRow}>
          <Avatar.Text
            size={48}
            label={item.user.name.charAt(0).toUpperCase()}
            style={{ backgroundColor: paperTheme.colors.primary }}
          />
          <View style={styles.friendInfo}>
            <Text variant="titleMedium">{item.user.name}</Text>
            <Text variant="bodySmall" style={{ opacity: 0.7 }}>{item.user.email}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Button mode="contained" onPress={() => handleAccept(item.id)} style={{ flex: 1, marginRight: 8 }}>
            Accept
          </Button>
          <Button mode="outlined" onPress={() => handleReject(item.id)} style={{ flex: 1 }}>
            Reject
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSent = ({ item }: { item: PendingRequest }) => (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        <View style={styles.friendRow}>
          <Avatar.Text
            size={48}
            label={item.user.name.charAt(0).toUpperCase()}
            style={{ backgroundColor: paperTheme.colors.primary }}
          />
          <View style={styles.friendInfo}>
            <Text variant="titleMedium">{item.user.name}</Text>
            <Text variant="bodySmall" style={{ opacity: 0.7 }}>Request pending...</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSearchResult = ({ item }: { item: any }) => {
    const hasPendingRequest = pendingRequests.sent.some((req) => req.user.id === item.id);
    const isAlreadyFriend = friends.some((f) => f.id === item.id);
    const isSending = sendingRequest === item.id;

    return (
      <Card mode="elevated" style={styles.card}>
        <Card.Content>
          <View style={styles.friendRow}>
            <Avatar.Text
              size={48}
              label={item.name.charAt(0).toUpperCase()}
              style={{ backgroundColor: paperTheme.colors.primary }}
            />
            <View style={styles.friendInfo}>
              <Text variant="titleMedium">{item.name}</Text>
              <Text variant="bodySmall" style={{ opacity: 0.7 }}>{item.email}</Text>
            </View>
            {isAlreadyFriend ? (
              <Button mode="outlined" disabled compact>
                Friends ✓
              </Button>
            ) : hasPendingRequest ? (
              <Button mode="outlined" disabled compact>
                Pending
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={() => handleSendRequest(item.id)}
                compact
                icon="account-plus"
                loading={isSending}
                disabled={isSending}
              >
                {isSending ? 'Sending...' : 'Add'}
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Friends" />
      </Appbar.Header>

      <Searchbar
        placeholder="Search users by name or email"
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        loading={searching}
      />

      {searchQuery.length >= 2 && searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      ) : searchQuery.length >= 2 && !searching ? (
        <View style={styles.empty}>
          <Text variant="bodyLarge">No users found</Text>
        </View>
      ) : (
        <>
          <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'friends', label: `Friends (${friends.length})` },
          { value: 'pending', label: `Pending (${pendingRequests.received.length})` },
          { value: 'activity', label: 'Activity' },
        ]}
        style={styles.tabs}
      />

      {activeTab === 'friends' && (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="bodyLarge">No friends yet</Text>
              <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 8 }}>
                Start adding friends to see them here
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'pending' && (
        <FlatList
          data={[...pendingRequests.received, ...pendingRequests.sent]}
          renderItem={({ item }) =>
            pendingRequests.received.includes(item) ? renderReceived({ item }) : renderSent({ item })
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="bodyLarge">No pending requests</Text>
            </View>
          }
        />
      )}

      {activeTab === 'activity' && (
        <FlatList
          data={activity}
          renderItem={({ item }) => (
            <Card
              mode="elevated"
              style={styles.card}
              onPress={() => navigation.navigate('OysterDetail', { oysterId: item.oyster.id })}
            >
              <Card.Content>
                <View style={styles.activityHeader}>
                  <Avatar.Text
                    size={40}
                    label={item.user.name.charAt(0).toUpperCase()}
                    style={{ backgroundColor: paperTheme.colors.primary, marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">
                      <Text style={{ fontWeight: 'bold' }}>{item.user.name}</Text> reviewed{' '}
                      <Text style={{ fontWeight: 'bold' }}>{item.oyster.name}</Text>
                    </Text>
                    <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 4 }}>
                      {item.rating.replace('_', ' ')} • {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                {item.notes && (
                  <Text variant="bodySmall" style={{ marginTop: 8, fontStyle: 'italic' }} numberOfLines={2}>
                    "{item.notes}"
                  </Text>
                )}
              </Card.Content>
            </Card>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="bodyLarge">No recent activity</Text>
              <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 8 }}>
                Your friends haven't reviewed any oysters recently
              </Text>
            </View>
          }
        />
      )}
        </>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  tabs: {
    margin: 16,
    marginTop: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    padding: 32,
  },
});
