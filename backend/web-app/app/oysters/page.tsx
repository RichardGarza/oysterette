'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import RatingDisplay from '../../components/RatingDisplay';
import EmptyState from '../../components/EmptyState';
import { oysterApi, favoriteApi } from '../../lib/api';
import { Oyster } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';

export const dynamic = 'force-dynamic';

function OystersContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [oysters, setOysters] = useState<Oyster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  const loadFavorites = async () => {
    try {
      const favs = await favoriteApi.getAll();
      setFavorites(favs);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const loadOysters = useCallback(async () => {
    try {
      setLoading(true);
      let data = await oysterApi.getAll({
        sortBy,
        sortDirection,
      });

      if (showFavorites && isAuthenticated && favorites.length > 0) {
        data = data.filter(o => favorites.includes(o.id));
      }

      setOysters(data);
    } catch (error) {
      console.error('Failed to load oysters:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortDirection, showFavorites, isAuthenticated, favorites]);

  useEffect(() => {
    const favoritesParam = searchParams.get('showFavorites');
    if (favoritesParam === 'true' && isAuthenticated) {
      setShowFavorites(true);
    }
    if (isAuthenticated) {
      loadFavorites();
    }
  }, [isAuthenticated, searchParams]);

  useEffect(() => {
    // Only load oysters if not searching (search is handled by debouncedSearch)
    if (!searchQuery.trim()) {
      loadOysters();
    }
  }, [sortBy, sortDirection, showFavorites, favorites, loadOysters, searchQuery]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string, loadFn: () => Promise<void>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (!query.trim()) {
            await loadFn();
            return;
          }
          try {
            setLoading(true);
            const results = await oysterApi.search(query);
            setOysters(results);
          } catch (error) {
            console.error('Search failed:', error);
          } finally {
            setLoading(false);
          }
        }, 300); // 300ms debounce delay
      };
    })(),
    []
  );

  // Update search query and trigger debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query, loadOysters);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Browse Oysters</h1>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search oysters as you type..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#243447] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
              />
            </div>

            <div className="flex gap-2">
              {isAuthenticated && (
                <button
                  onClick={() => {
                    setShowFavorites(!showFavorites);
                    loadOysters();
                  }}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    showFavorites
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
                      : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-[#243447] text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  ❤️ Favorites
                </button>
              )}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#243447] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
              >
                <option value="name">Name</option>
                <option value="rating">Rating</option>
                <option value="size">Size</option>
                <option value="body">Body</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#243447] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Oysters Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-[#243447] rounded-xl h-64" />
            ))}
          </div>
        ) : oysters.length === 0 ? (
          <EmptyState
            icon="🦪"
            title="No Oysters Found"
            description={showFavorites ? "You haven't favorited any oysters yet." : "Try adjusting your search or filters."}
            actionLabel={showFavorites ? "Browse Oysters" : undefined}
            actionHref={showFavorites ? "/oysters" : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {oysters.map((oyster) => (
              <Link
                key={oyster.id}
                href={`/oysters/${oyster.id}`}
                className="block p-6 bg-white dark:bg-[#243447] rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {oyster.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {oyster.species}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {oyster.origin}
                </p>
                <div className="flex items-center justify-between">
                  {oyster.totalReviews > 0 ? (
                    <RatingDisplay overallScore={oyster.overallScore} totalReviews={oyster.totalReviews} size="small" />
                  ) : (
                    <span className="text-sm text-gray-500">No ratings</span>
                  )}
                  {isAuthenticated && favorites.includes(oyster.id) && (
                    <span className="text-red-500 text-xl" title="Favorited">❤️</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function OystersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#1a2332] flex items-center justify-center"><p>Loading...</p></div>}>
      <OystersContent />
    </Suspense>
  );
}

