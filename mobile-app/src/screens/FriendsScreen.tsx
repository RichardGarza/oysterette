/**
 * FriendsScreen
 *
 * Social features - friend list and pending requests.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, SafeAreaView } from 'react-native';
import { Card, Text, Button, Appbar, SegmentedButtons, Avatar, Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { friendApi, userApi } from '../services/api';

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
  const navigation = useNavigation();
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

  const loadData = useCallback(async () => {
    try {
      const [friendsData, pendingData] = await Promise.all([
        friendApi.getFriends(),
        friendApi.getPendingRequests(),
      ]);
      setFriends(friendsData);
      setPendingRequests(pendingData);
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
      await friendApi.sendRequest(userId);
      loadData();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [FriendsScreen] Error sending request:', error);
      }
    }
  }, [loadData]);

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

  const renderSearchResult = ({ item }: { item: any }) => (
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
          <Button mode="contained" onPress={() => handleSendRequest(item.id)} compact icon="account-plus">
            Add
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

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
        </>
      )}
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
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  empty: {
    alignItems: 'center',
    padding: 32,
  },
});
