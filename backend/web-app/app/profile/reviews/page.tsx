'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../components/Header';
import ReviewCard from '../../../components/ReviewCard';
import EmptyState from '../../../components/EmptyState';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { reviewApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { Review } from '../../../lib/types';

export const dynamic = 'force-dynamic';

export default function ProfileReviewsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadReviews();
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      // getUserReviews returns Review[] directly (no userId = current user)
      const data = await reviewApi.getUserReviews();
      setReviews(data || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

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

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Your Reviews
            </h1>
            {reviews.length > 0 && (
              <p className="text-gray-600 dark:text-gray-400">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            )}
          </div>
          <Link
            href="/profile"
            className="px-4 py-2 bg-gray-200 dark:bg-[#2d4054] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Back to Profile
          </Link>
        </div>

        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onUpdate={loadReviews}
                showEditButton={true}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📝"
            title="No Reviews Yet"
            description="Your reviews will appear here once you start rating oysters."
            actionLabel="Browse Oysters"
            actionHref="/oysters"
          />
        )}
      </main>
    </div>
  );
}

