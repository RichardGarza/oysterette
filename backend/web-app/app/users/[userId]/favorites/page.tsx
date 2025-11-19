'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../../components/Header';
import EmptyState from '../../../../components/EmptyState';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import RatingDisplay from '../../../../components/RatingDisplay';
import { userApi, oysterApi } from '../../../../lib/api';
import { Oyster, User } from '../../../../lib/types';

export const dynamic = 'force-dynamic';

export default function UserFavoritesPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<Oyster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserAndFavorites();
    }
  }, [userId]);

  const loadUserAndFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await userApi.getPublicProfile(userId);
      setUser(profileData.user);

      // Note: Currently no public favorites endpoint
      // This would need to be added to the backend
      // For now, show that favorites are private
      setFavorites([]);
    } catch (error: any) {
      console.error('Failed to load user favorites:', error);
      setError(error.response?.data?.error || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a2332]">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-12">
          <LoadingSpinner size="lg" text="Loading favorites..." />
        </main>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a2332]">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-12">
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

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Back Button and Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {user.name}'s Favorites
            </h1>
          </div>
          <Link
            href={`/users/${userId}`}
            className="px-4 py-2 bg-gray-200 dark:bg-[#2d4054] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Back to Profile
          </Link>
        </div>

        {/* Favorites List */}
        {favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((oyster) => (
              <Link
                key={oyster.id}
                href={`/oysters/${oyster.id}`}
                className="block p-6 bg-white dark:bg-[#243447] rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {oyster.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {oyster.origin} • {oyster.species}
                </p>
                {oyster.totalReviews > 0 && (
                  <RatingDisplay overallScore={oyster.overallScore} totalReviews={oyster.totalReviews} size="small" />
                )}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🔒"
            title="Favorites are Private"
            description={`${user.name}'s favorites are set to private.`}
          />
        )}
      </main>
    </div>
  );
}
