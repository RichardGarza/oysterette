'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import RatingDisplay from '../../components/RatingDisplay';
import EmptyState from '../../components/EmptyState';
import { oysterApi, favoriteApi } from '../../lib/api';
import { Oyster } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';

export const dynamic = 'force-dynamic';

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [oysters, setOysters] = useState<Oyster[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadFavorites();
  }, [isAuthenticated, router]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const favorites = await favoriteApi.getAll();
      setFavoriteIds(favorites);

      if (favorites.length > 0) {
        const allOysters = await oysterApi.getAll();
        const favoritedOysters = allOysters.filter(o => favorites.includes(o.id));
        setOysters(favoritedOysters);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (oysterId: string) => {
    try {
      await favoriteApi.remove(oysterId);
      setFavoriteIds(prev => prev.filter(id => id !== oysterId));
      setOysters(prev => prev.filter(o => o.id !== oysterId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      alert('Failed to remove favorite');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Favorites
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {oysters.length} {oysters.length === 1 ? 'favorite' : 'favorites'}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-[#243447] rounded-xl h-48" />
            ))}
          </div>
        ) : oysters.length === 0 ? (
          <EmptyState
            icon="❤️"
            title="No Favorites Yet"
            description="Start favoriting oysters you love!"
            actionLabel="Browse Oysters"
            actionHref="/oysters"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {oysters.map((oyster) => (
              <div
                key={oyster.id}
                className="p-6 bg-white dark:bg-[#243447] rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <Link href={`/oysters/${oyster.id}`} className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {oyster.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {oyster.species}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {oyster.origin}
                    </p>
                    {oyster.totalReviews > 0 ? (
                      <RatingDisplay overallScore={oyster.overallScore} totalReviews={oyster.totalReviews} size="small" />
                    ) : (
                      <span className="text-sm text-gray-500">No ratings</span>
                    )}
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(oyster.id)}
                    className="text-red-500 hover:text-red-700 text-xl ml-2"
                    title="Remove from favorites"
                  >
                    ❤️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

