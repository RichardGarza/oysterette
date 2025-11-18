'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { friendApi, userApi } from '../../lib/api';
import Link from 'next/link';
import Image from 'next/image';

interface Friend {
  id: string;
  name: string;
  email: string;
  username?: string;
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
    username?: string;
    profilePhotoUrl: string | null;
  };
  createdAt: string;
}

interface ActivityItem {
  id: string;
  user: {
    id: string;
    name: string;
    profilePhotoUrl: string | null;
  };
  oyster: {
    id: string;
    name: string;
  };
  rating: string;
  notes?: string;
  createdAt: string;
}

export const dynamic = 'force-dynamic';

export default function FriendsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ sent: PendingRequest[]; received: PendingRequest[] }>({
    sent: [],
    received: [],
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, router]);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [friendsData, pendingData, activityData] = await Promise.all([
        friendApi.getFriends(),
        friendApi.getPendingRequests(),
        friendApi.getActivity(),
      ]);
      setFriends(friendsData);
      setPendingRequests(pendingData);
      setActivity(activityData);
    } catch (error) {
      console.error('Error loading friends data:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

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
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSendRequest = useCallback(async (userId: string) => {
    try {
      setSendingRequest(userId);
      await friendApi.sendRequest(userId);
      setSnackbarMessage('Friend request sent!');
      setSnackbarVisible(true);
      loadData();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Failed to send request');
      setSnackbarVisible(true);
    } finally {
      setSendingRequest(null);
    }
  }, [loadData]);

  const handleAccept = useCallback(async (friendshipId: string) => {
    try {
      await friendApi.acceptRequest(friendshipId);
      setSnackbarMessage('Friend request accepted!');
      setSnackbarVisible(true);
      loadData();
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Failed to accept request');
      setSnackbarVisible(true);
    }
  }, [loadData]);

  const handleReject = useCallback(async (friendshipId: string) => {
    try {
      await friendApi.rejectRequest(friendshipId);
      setSnackbarMessage('Friend request rejected');
      setSnackbarVisible(true);
      loadData();
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Failed to reject request');
      setSnackbarVisible(true);
    }
  }, [loadData]);

  const handleRemove = useCallback(async (friendshipId: string, friendName: string) => {
    if (!confirm(`Remove ${friendName} from friends?`)) return;
    try {
      await friendApi.removeFriend(friendshipId);
      setSnackbarMessage(`${friendName} removed from friends`);
      setSnackbarVisible(true);
      loadData();
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Failed to remove friend');
      setSnackbarVisible(true);
    }
  }, [loadData]);

  const handleViewPaired = useCallback((friendId: string) => {
    router.push(`/friends/paired/${friendId}`);
  }, [router]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a2332]">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <LoadingSpinner size="lg" text="Loading friends..." />
        </main>
      </div>
    );
  }

  const renderFriend = (friend: Friend) => (
    <div key={friend.id} className="bg-white dark:bg-[#243447] rounded-lg p-4 mb-4 shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-3">
        <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center mr-4">
          <span className="text-white font-bold text-sm">{friend.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{friend.name}</h3>
          {friend.username && <p className="text-sm text-gray-500 dark:text-gray-400">@{friend.username}</p>}
          <p className="text-sm text-gray-600 dark:text-gray-400">{friend.email}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleViewPaired(friend.id)}
          className="flex-1 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium text-sm"
        >
          Paired Matches
        </button>
        <button
          onClick={() => handleRemove(friend.friendshipId, friend.name)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
        >
          Remove
        </button>
      </div>
    </div>
  );

  const renderReceived = (request: PendingRequest) => (
    <div key={request.id} className="bg-white dark:bg-[#243447] rounded-lg p-4 mb-4 shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-3">
        <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center mr-4">
          <span className="text-white font-bold text-sm">{request.user.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{request.user.name}</h3>
          {request.user.username && <p className="text-sm text-gray-500 dark:text-gray-400">@{request.user.username}</p>}
          <p className="text-sm text-gray-600 dark:text-gray-400">{request.user.email}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleAccept(request.id)}
          className="flex-1 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium text-sm"
        >
          Accept
        </button>
        <button
          onClick={() => handleReject(request.id)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
        >
          Reject
        </button>
      </div>
    </div>
  );

  const renderSent = (request: PendingRequest) => (
    <div key={request.id} className="bg-white dark:bg-[#243447] rounded-lg p-4 mb-4 shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center mr-4">
          <span className="text-white font-bold text-sm">{request.user.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{request.user.name}</h3>
          {request.user.username && <p className="text-sm text-gray-500 dark:text-gray-400">@{request.user.username}</p>}
          <p className="text-sm text-gray-600 dark:text-gray-400">Request pending...</p>
        </div>
      </div>
    </div>
  );

  const renderSearchResult = (item: any) => {
    const hasPendingRequest = pendingRequests.sent.some((req) => req.user.id === item.id);
    const isAlreadyFriend = friends.some((f) => f.id === item.id);
    const isSending = sendingRequest === item.id;

    return (
      <div key={item.id} className="bg-white dark:bg-[#243447] rounded-lg p-4 mb-4 shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center mr-4">
            <span className="text-white font-bold text-sm">{item.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>
            {item.username && <p className="text-sm text-gray-500 dark:text-gray-400">@{item.username}</p>}
            <p className="text-sm text-gray-600 dark:text-gray-400">{item.email}</p>
          </div>
          {isAlreadyFriend ? (
            <button disabled className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800">
              Friends ✓
            </button>
          ) : hasPendingRequest ? (
            <button disabled className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800">
              Pending
            </button>
          ) : (
            <button
              onClick={() => handleSendRequest(item.id)}
              disabled={isSending}
              className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium text-sm disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Add Friend'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderActivity = (item: ActivityItem) => (
    <div key={item.id} className="bg-white dark:bg-[#243447] rounded-lg p-4 mb-4 shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-2">
        <div className="w-10 h-10 bg-[#FF6B35] rounded-full flex items-center justify-center mr-3">
          <span className="text-white font-bold text-xs">{item.user.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            <span className="font-semibold">{item.user.name}</span> reviewed <span className="font-semibold">{item.oyster.name}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {item.rating.replace('_', ' ')} • {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      {item.notes && (
        <p className="text-sm text-gray-600 dark:text-gray-400 italic ml-13">
          "{item.notes}"
        </p>
      )}
      <Link href={`/oysters/${item.oyster.id}`} className="text-[#FF6B35] text-sm hover:underline block mt-2">
        View Oyster
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Friends</h1>

        <input
          type="text"
          placeholder="Search users by name or email"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-3 mb-6 bg-white dark:bg-[#243447] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] dark:text-white"
          disabled={searching}
        />

        {searchQuery.length >= 2 && searchResults.length > 0 ? (
          <div className="space-y-4">
            {searchResults.map(renderSearchResult)}
          </div>
        ) : searchQuery.length >= 2 && !searching ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No users found
          </div>
        ) : (
          <>
            <div className="flex mb-6 space-x-2">
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'friends'
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-white dark:bg-[#243447] text-gray-700 dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Friends ({friends.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-white dark:bg-[#243447] text-gray-700 dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Pending ({pendingRequests.received.length})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'activity'
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-white dark:bg-[#243447] text-gray-700 dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Activity
              </button>
            </div>

            {activeTab === 'friends' && (
              <div className="space-y-4">
                {friends.length > 0 ? friends.map(renderFriend) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-lg">No friends yet</p>
                    <p className="text-sm mt-2">Start adding friends to see them here</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pending' && (
              <div className="space-y-4">
                {[...pendingRequests.received, ...pendingRequests.sent].length > 0 ? (
                  [...pendingRequests.received, ...pendingRequests.sent].map((request) =>
                    pendingRequests.received.some((r) => r.id === request.id) ? renderReceived(request) : renderSent(request)
                  )
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No pending requests
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {activity.length > 0 ? activity.map(renderActivity) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-lg">No recent activity</p>
                    <p className="text-sm mt-2">Your friends haven't reviewed any oysters recently</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {snackbarVisible && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg max-w-sm">
            {snackbarMessage}
            <button onClick={() => setSnackbarVisible(false)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white opacity-70 hover:opacity-100">
              ×
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

