'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../components/Header';
import ReviewCard from '../../../components/ReviewCard';
import EmptyState from '../../../components/EmptyState';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { userApi, reviewApi } from '../../../lib/api';
import { Review, User } from '../../../lib/types';

export const dynamic = 'force-dynamic';

interface ProfileStats {
  totalReviews: number;
  totalFavorites: number;
  avgRatingGiven: number;
  credibilityScore: number;
  badgeLevel: 'Novice' | 'Trusted' | 'Expert';
  reviewStreak: number;
  mostReviewedSpecies?: string;
  mostReviewedOrigin?: string;
  memberSince: string;
  totalVotesGiven: number;
  totalVotesReceived: number;
  friendsCount: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<{ user: User; stats: ProfileStats } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadReviews();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await userApi.getPublicProfile(userId);
      setProfile(profileData);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      setError(error.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await reviewApi.getPublicUserReviews(userId);
      setReviews(data || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a2332]">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <LoadingSpinner size="lg" text="Loading profile..." />
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a2332]">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profile Not Found</h1>
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

  const { user, stats } = profile;

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              {user.profilePhotoUrl ? (
                <img
                  src={user.profilePhotoUrl}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#FF6B35] flex items-center justify-center text-white text-3xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {user.name}
            </h1>
            {user.username && <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>}
            <p className="text-sm text-gray-500 mt-1">
              Member since {new Date(stats.memberSince).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Reviews Card */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl font-bold text-[#FF6B35]">{stats.totalReviews}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Reviews</p>
          </div>

          {/* Favorites Card */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl font-bold text-[#FF6B35]">{stats.totalFavorites}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Favorites</p>
          </div>

          {/* Friends Card */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl font-bold text-[#FF6B35]">{stats.friendsCount}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Friends</p>
          </div>

          {/* Credibility Card */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl font-bold text-[#FF6B35]">{Math.round(stats.credibilityScore * 10)}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Credibility</p>
          </div>

          {/* Review Streak Card */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl font-bold text-[#FF6B35]">{stats.reviewStreak}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Review Streak</p>
          </div>
        </div>

        {/* Badge Card */}
        <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 mb-8 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{stats.badgeLevel}</h3>
          <p className="text-gray-600 dark:text-gray-400">Reviewer status based on review count and credibility</p>
        </div>

        {/* Reviews Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews</h2>
            {stats.totalReviews > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {stats.totalReviews} total
              </span>
            )}
          </div>
          
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                />
              ))}
              {reviews.length > 3 && (
                <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                  Showing 3 of {reviews.length} reviews
                </p>
              )}
            </div>
          ) : (
            <EmptyState
              icon="📝"
              title="No Reviews Yet"
              description="This user hasn't written any reviews yet."
            />
          )}
        </section>
      </main>
    </div>
  );
}

