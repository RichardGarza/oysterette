'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../../components/Header';
import ReviewCard from '../../../../components/ReviewCard';
import EmptyState from '../../../../components/EmptyState';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import { userApi, reviewApi } from '../../../../lib/api';
import { Review, User } from '../../../../lib/types';

export const dynamic = 'force-dynamic';

export default function UserReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserAndReviews();
    }
  }, [userId]);

  const loadUserAndReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, reviewsData] = await Promise.all([
        userApi.getPublicProfile(userId),
        reviewApi.getPublicUserReviews(userId),
      ]);
      setUser(profileData.user);
      setReviews(reviewsData || []);
    } catch (error: any) {
      console.error('Failed to load user reviews:', error);
      setError(error.response?.data?.error || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a2332]">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <LoadingSpinner size="lg" text="Loading reviews..." />
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {user.name}'s Reviews
            </h1>
            {reviews.length > 0 && (
              <p className="text-gray-600 dark:text-gray-400">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            )}
          </div>
          <Link
            href={`/users/${userId}`}
            className="px-4 py-2 bg-gray-200 dark:bg-[#2d4054] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Back to Profile
          </Link>
        </div>

        {/* Reviews List */}
        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📝"
            title="No Reviews Yet"
            description={`${user.name} hasn't written any reviews yet.`}
          />
        )}
      </main>
    </div>
  );
}
