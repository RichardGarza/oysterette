'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import RatingDisplay from '../components/RatingDisplay';
import { oysterApi, recommendationApi, userApi } from '../lib/api';
import { Oyster } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const dynamic = 'force-dynamic';

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme } = useTheme(); // Subscribe to theme changes to force re-render
  const [oysters, setOysters] = useState<Oyster[]>([]);
  const [recommendations, setRecommendations] = useState<Oyster[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [userStats, setUserStats] = useState({ reviews: 0, favorites: 0 });

  useEffect(() => {
    loadOysters();
    // Only load authenticated data after auth state has finished loading
    if (isAuthenticated && !authLoading) {
      loadRecommendations();
      loadUserStats();
    }
  }, [isAuthenticated, authLoading]);

  const loadOysters = async () => {
    try {
      const data = await oysterApi.getAll();
      // Sort by overallScore desc, take top 6
      const topOysters = data
        .filter(o => o.totalReviews > 0)
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, 6);
      setOysters(topOysters);
    } catch (error) {
      console.error('Failed to load oysters:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const recs = await recommendationApi.getHybrid(5);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      // Fallback to attribute-based
      try {
        const fallback = await recommendationApi.getRecommendations(5);
        setRecommendations(fallback);
      } catch (fallbackError) {
        console.error('Fallback recommendations failed:', fallbackError);
      }
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const profile = await userApi.getProfile();
      setUserStats({
        reviews: profile.stats.totalReviews,
        favorites: profile.stats.totalFavorites,
      });
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };


  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Discover Oysters from Around the World
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Explore, review, and share your favorite oyster experiences
          </p>

          {/* Search Button */}
          <Link
            href="/oysters"
            className="inline-block px-8 py-4 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium text-lg"
          >
            🔍 Search for Oysters
          </Link>
        </div>

        {/* Quick Stats - Only if logged in */}
        {isAuthenticated && (
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
            <Link
              href="/profile"
              className="p-4 bg-white dark:bg-[#243447] rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-3xl font-bold text-[#FF6B35]">{userStats.reviews}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Reviews</div>
            </Link>
            <Link
              href="/favorites"
              className="p-4 bg-white dark:bg-[#243447] rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-3xl font-bold text-[#FF6B35]">{userStats.favorites}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Favorites</div>
            </Link>
          </div>
        )}

        {/* Recommendations Section - Only if logged in */}
        {isAuthenticated && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Recommended for You
            </h2>
            {loadingRecommendations ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 dark:bg-[#243447] rounded-xl h-48" />
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="p-6 bg-white dark:bg-[#243447] rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get personalized recommendations by setting your flavor profile!
                </p>
                <Link
                  href="/profile"
                  className="inline-block px-6 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors"
                >
                  Set Flavor Profile
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((oyster) => (
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
            )}
          </div>
        )}

        {/* Top Rated Oysters */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Top Rated Oysters
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-[#243447] rounded-xl h-48" />
              ))}
            </div>
          ) : oysters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No oysters found. Try a different search.</p>
            </div>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {oyster.origin} • {oyster.species}
                  </p>
                  {oyster.totalReviews > 0 && (
                    <RatingDisplay overallScore={oyster.overallScore} totalReviews={oyster.totalReviews} size="small" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Info Card - Only if NOT logged in */}
        {!isAuthenticated && (
          <div className="mt-12 p-6 bg-white dark:bg-[#243447] rounded-xl border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Explore oyster varieties from around the world with our 10-point attribute system.
              Create an account to add reviews and track your favorite oysters.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
