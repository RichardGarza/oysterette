'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../../components/Header';
import EmptyState from '../../../../components/EmptyState';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import { userApi } from '../../../../lib/api';
import { User } from '../../../../lib/types';

export const dynamic = 'force-dynamic';

interface Friend {
  id: string;
  name: string;
  username: string | null;
  profilePhotoUrl: string | null;
}

export default function UserFriendsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserAndFriends();
    }
  }, [userId]);

  const loadUserAndFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await userApi.getPublicProfile(userId);
      setUser(profileData.user);

      // Note: Currently no public friends endpoint
      // This would need to be added to the backend
      // For now, show that friends list is private
      setFriends([]);
    } catch (error: any) {
      console.error('Failed to load user friends:', error);
      setError(error.response?.data?.error || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

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

  if (error || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a2332]">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'User not found'}</p>
            <Link
              href="/oysters"
              className="inline-block px-6 py-3 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium"
            >
              Browse Oysters
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button and Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {user.name}'s Friends
            </h1>
          </div>
          <Link
            href={`/users/${userId}`}
            className="px-4 py-2 bg-gray-200 dark:bg-[#2d4054] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Back to Profile
          </Link>
        </div>

        {/* Friends List */}
        {friends && friends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/users/${friend.id}`}
                className="block p-6 bg-white dark:bg-[#243447] rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center">
                  {friend.profilePhotoUrl ? (
                    <img
                      src={friend.profilePhotoUrl}
                      alt={friend.name}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#FF6B35] flex items-center justify-center text-white text-lg font-bold mr-4">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {friend.name}
                    </h3>
                    {friend.username && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        @{friend.username}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🔒"
            title="Friends List is Private"
            description={`${user.name}'s friends list is set to private.`}
          />
        )}
      </main>
    </div>
  );
}
