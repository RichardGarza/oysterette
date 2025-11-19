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
import { getAttributeLabel, getRangeLabel } from '../../../lib/flavorLabels';

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
          <Link
            href={`/users/${userId}/reviews`}
            className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl hover:border-[#FF6B35] transition-all cursor-pointer"
          >
            <div className="text-4xl font-bold text-[#FF6B35]">{stats.totalReviews}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Reviews</p>
          </Link>

          {/* Favorites Card */}
          <Link
            href={`/users/${userId}/favorites`}
            className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl hover:border-[#FF6B35] transition-all cursor-pointer"
          >
            <div className="text-4xl font-bold text-[#FF6B35]">{stats.totalFavorites}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Favorites</p>
          </Link>

          {/* Friends Card */}
          <Link
            href={`/users/${userId}/friends`}
            className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl hover:border-[#FF6B35] transition-all cursor-pointer"
          >
            <div className="text-4xl font-bold text-[#FF6B35]">{stats.friendsCount}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Friends</p>
          </Link>

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

        {/* Flavor Profile */}
        {(user.baselineSize || user.baselineBody || user.baselineSweetBrininess || user.baselineFlavorfulness || user.baselineCreaminess) && (
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Flavor Profile</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {stats.totalReviews >= 5
                ? 'Taste range based on oysters they loved'
                : 'Preferred oyster characteristics'}
            </p>
            <div className="space-y-4">
              {user.baselineSize && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Size</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.rangeMinSize != null && user.rangeMaxSize != null
                        ? `${user.rangeMinSize.toFixed(0)}-${user.rangeMaxSize.toFixed(0)}/10 (${getRangeLabel('size', user.rangeMinSize, user.rangeMaxSize)})`
                        : `${user.baselineSize.toFixed(1)}/10 (${getAttributeLabel('size', user.baselineSize)})`}
                    </p>
                  </div>
                  {user.rangeMinSize != null && user.rangeMaxSize != null ? (
                    <div className="relative w-full h-3 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-[#FF6B35] opacity-30 transition-all duration-300"
                        style={{
                          left: `${(user.rangeMinSize / 10) * 100}%`,
                          width: `${((user.rangeMaxSize - user.rangeMinSize) / 10) * 100}%`,
                        }}
                      />
                      {user.rangeMedianSize != null && (
                        <div
                          className="absolute top-0 h-full w-0.5 bg-[#FF6B35]"
                          style={{ left: `${(user.rangeMedianSize / 10) * 100}%` }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full h-3 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-[#FF6B35] transition-all duration-300"
                        style={{ width: `${(user.baselineSize / 10) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {user.baselineBody && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Body</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.rangeMinBody != null && user.rangeMaxBody != null
                        ? `${user.rangeMinBody.toFixed(0)}-${user.rangeMaxBody.toFixed(0)}/10 (${getRangeLabel('body', user.rangeMinBody, user.rangeMaxBody)})`
                        : `${user.baselineBody.toFixed(1)}/10 (${getAttributeLabel('body', user.baselineBody)})`}
                    </p>
                  </div>
                  {user.rangeMinBody != null && user.rangeMaxBody != null ? (
                    <div className="relative w-full h-3 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-[#FF6B35] opacity-30 transition-all duration-300"
                        style={{
                          left: `${(user.rangeMinBody / 10) * 100}%`,
                          width: `${((user.rangeMaxBody - user.rangeMinBody) / 10) * 100}%`,
                        }}
                      />
                      {user.rangeMedianBody != null && (
                        <div
                          className="absolute top-0 h-full w-0.5 bg-[#FF6B35]"
                          style={{ left: `${(user.rangeMedianBody / 10) * 100}%` }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full h-3 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-[#FF6B35] transition-all duration-300"
                        style={{ width: `${(user.baselineBody / 10) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {user.baselineSweetBrininess && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sweet/Brininess</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.rangeMinSweetBrininess != null && user.rangeMaxSweetBrininess != null
                        ? `${user.rangeMinSweetBrininess.toFixed(0)}-${user.rangeMaxSweetBrininess.toFixed(0)}/10 (${getRangeLabel('sweetBrininess', user.rangeMinSweetBrininess, user.rangeMaxSweetBrininess)})`
                        : `${user.baselineSweetBrininess.toFixed(1)}/10 (${getAttributeLabel('sweetBrininess', user.baselineSweetBrininess)})`}
                    </p>
                  </div>
                  {user.rangeMinSweetBrininess != null && user.rangeMaxSweetBrininess != null ? (
                    <div className="relative w-full h-3 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-[#FF6B35] opacity-30 transition-all duration-300"
                        style={{
                          left: `${(user.rangeMinSweetBrininess / 10) * 100}%`,
                          width: `${((user.rangeMaxSweetBrininess - user.rangeMinSweetBrininess) / 10) * 100}%`,
                        }}
                      />
                      {user.rangeMedianSweetBrininess != null && (
                        <div
                          className="absolute top-0 h-full w-0.5 bg-[#FF6B35]"
                          style={{ left: `${(user.rangeMedianSweetBrininess / 10) * 100}%` }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full h-3 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-[#FF6B35] transition-all duration-300"
                        style={{ width: `${(user.baselineSweetBrininess / 10) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {user.baselineFlavorfulness && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Flavorfulness</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.rangeMinFlavorfulness != null && user.rangeMaxFlavorfulness != null
                        ? `${user.rangeMinFlavorfulness.toFixed(0)}-${user.rangeMaxFlavorfulness.toFixed(0)}/10 (${getRangeLabel('flavorfulness', user.rangeMinFlavorfulness, user.rangeMaxFlavorfulness)})`
                        : `${user.baselineFlavorfulness.toFixed(1)}/10 (${getAttributeLabel('flavorfulness', user.baselineFlavorfulness)})`}
                    </p>
                  </div>
                  {user.rangeMinFlavorfulness != null && user.rangeMaxFlavorfulness != null ? (
                    <div className="relative w-full h-3 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-[#FF6B35] opacity-30 transition-all duration-300"
                        style={{
                          left: `${(user.rangeMinFlavorfulness / 10) * 100}%`,
                          width: `${((user.rangeMaxFlavorfulness - user.rangeMinFlavorfulness) / 10) * 100}%`,
                        }}
                      />
                      {user.rangeMedianFlavorfulness != null && (
                        <div
                          className="absolute top-0 h-full w-0.5 bg-[#FF6B35]"
                          style={{ left: `${(user.rangeMedianFlavorfulness / 10) * 100}%` }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full h-3 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-[#FF6B35] transition-all duration-300"
                        style={{ width: `${(user.baselineFlavorfulness / 10) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {user.baselineCreaminess && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Creaminess</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.rangeMinCreaminess != null && user.rangeMaxCreaminess != null
                        ? `${user.rangeMinCreaminess.toFixed(0)}-${user.rangeMaxCreaminess.toFixed(0)}/10 (${getRangeLabel('creaminess', user.rangeMinCreaminess, user.rangeMaxCreaminess)})`
                        : `${user.baselineCreaminess.toFixed(1)}/10 (${getAttributeLabel('creaminess', user.baselineCreaminess)})`}
                    </p>
                  </div>
                  {user.rangeMinCreaminess != null && user.rangeMaxCreaminess != null ? (
                    <div className="relative w-full h-3 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-[#FF6B35] opacity-30 transition-all duration-300"
                        style={{
                          left: `${(user.rangeMinCreaminess / 10) * 100}%`,
                          width: `${((user.rangeMaxCreaminess - user.rangeMinCreaminess) / 10) * 100}%`,
                        }}
                      />
                      {user.rangeMedianCreaminess != null && (
                        <div
                          className="absolute top-0 h-full w-0.5 bg-[#FF6B35]"
                          style={{ left: `${(user.rangeMedianCreaminess / 10) * 100}%` }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full h-3 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-[#FF6B35] transition-all duration-300"
                        style={{ width: `${(user.baselineCreaminess / 10) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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

