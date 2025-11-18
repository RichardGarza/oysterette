'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../components/Header';
import ReviewCard from '../../../components/ReviewCard';
import EmptyState from '../../../components/EmptyState';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { oysterApi, reviewApi, favoriteApi } from '../../../lib/api';
import { Oyster, Review } from '../../../lib/types';
import { useAuth } from '../../../context/AuthContext';

export const dynamic = 'force-dynamic';

export default function OysterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const id = params.id as string;

  const [oyster, setOyster] = useState<Oyster | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingRequestRef = useRef<{ targetState: boolean; previousState: boolean } | null>(null);

  useEffect(() => {
    if (id) {
      loadOyster();
      loadReviews();
      if (isAuthenticated) {
        loadFavoriteStatus();
      }
    }
  }, [id, isAuthenticated]);

  const loadOyster = async () => {
    try {
      const data = await oysterApi.getById(id);
      setOyster(data);
    } catch (error) {
      console.error('Failed to load oyster:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await reviewApi.getOysterReviews(id);
      setReviews(data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const loadFavoriteStatus = async () => {
    try {
      const favorites = await favoriteApi.getAll();
      setIsFavorite(favorites.includes(id));
    } catch (error) {
      console.error('Failed to load favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Track the target state (what user wants after this click)
    const targetState = !isFavorite;
    const previousState = isFavorite;
    
    // Update pending request ref with this request's info
    pendingRequestRef.current = { targetState, previousState };

    // Optimistic update - immediately change UI to final state
    setIsFavorite(targetState);

    try {
      // Make API call
      if (previousState) {
        await favoriteApi.remove(id);
      } else {
        await favoriteApi.add(id);
      }
      
      // Only process result if this is still the current request
      // (i.e., user hasn't clicked again)
      if (!abortController.signal.aborted && 
          pendingRequestRef.current?.targetState === targetState) {
        // Success - state already updated optimistically, just clean up
        pendingRequestRef.current = null;
        abortControllerRef.current = null;
      }
    } catch (error: any) {
      // Only revert if this is still the current request
      // (i.e., user hasn't clicked again and this request wasn't cancelled)
      if (!abortController.signal.aborted && 
          pendingRequestRef.current?.targetState === targetState) {
        console.error('Failed to toggle favorite:', error);
        // Revert on failure only if this is still the active request
        setIsFavorite(previousState);
        pendingRequestRef.current = null;
        abortControllerRef.current = null;
      }
      // If request was cancelled or superseded, ignore the error
      // The UI already reflects the user's final intended state
    }
  };

  const handleReviewChange = () => {
    loadReviews();
    if (oyster) {
      loadOyster(); // Refresh oyster to update stats
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-white dark:bg-[#1a2332]'>
        <Header />
        <main className='max-w-4xl mx-auto px-4 py-12'>
          <LoadingSpinner size='lg' text='Loading oyster details...' />
        </main>
      </div>
    );
  }

  if (!oyster) {
    return (
      <div className='min-h-screen bg-white dark:bg-[#1a2332]'>
        <Header />
        <main className='max-w-4xl mx-auto px-4 py-12 text-center'>
          <p className='text-gray-600 dark:text-gray-400'>Oyster not found.</p>
          <Link
            href='/oysters'
            className='text-[#FF6B35] hover:underline mt-4 inline-block'>
            Back to Browse
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white dark:bg-[#1a2332]'>
      <Header />

      <main className='max-w-4xl mx-auto px-4 py-12'>
        {/* Oyster Info */}
        <div className='bg-white dark:bg-[#243447] rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 mb-8'>
          <div className='flex items-start justify-between mb-6'>
            <div className='flex items-center gap-3'>
              <h1 className='text-4xl font-bold text-gray-900 dark:text-white'>
                {oyster.name}
              </h1>
              {isAuthenticated && (
                <button
                  onClick={handleToggleFavorite}
                  className='px-3 py-2 rounded-lg font-medium transition-colors text-xl bg-gray-200 dark:bg-[#2d4054] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'>
                  <span
                    className={
                      isFavorite
                        ? 'text-red-500'
                        : 'text-gray-700 dark:text-gray-300'
                    }>
                    {isFavorite ? '❤️' : '🤍'}
                  </span>
                </button>
              )}
            </div>
            {oyster.totalReviews > 0 && (
              <div className='text-right'>
                <div className='flex items-center space-x-1 mb-1'>
                  <span className='text-2xl font-bold'>
                    {oyster.overallScore.toFixed(1)}
                  </span>
                  <span className='text-yellow-500 text-2xl'>⭐</span>
                </div>
                <p className='text-sm text-gray-500'>
                  {oyster.totalReviews} reviews
                </p>
              </div>
            )}
          </div>
          <p className='text-lg text-gray-600 dark:text-gray-400 mb-6'>
            {oyster.species} • {oyster.origin}
          </p>

          {oyster.standoutNotes && (
            <p className='text-gray-700 dark:text-gray-300 mb-6 italic'>
              {oyster.standoutNotes}
            </p>
          )}

          {/* Attributes */}
          <div className='space-y-4'>
            {[
              { label: 'Size', value: oyster.size, avg: oyster.avgSize },
              { label: 'Body', value: oyster.body, avg: oyster.avgBody },
              {
                label: 'Sweet/Brine',
                value: oyster.sweetBrininess,
                avg: oyster.avgSweetBrininess,
              },
              {
                label: 'Flavor',
                value: oyster.flavorfulness,
                avg: oyster.avgFlavorfulness,
              },
              {
                label: 'Cream',
                value: oyster.creaminess,
                avg: oyster.avgCreaminess,
              },
            ].map((attr) => (
              <div key={attr.label} className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    {attr.label}
                  </p>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {attr.avg ? attr.avg.toFixed(1) : attr.value}/10
                  </p>
                </div>
                <div className='relative w-full h-3 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden'>
                  <div
                    className='absolute h-full bg-[#FF6B35] transition-all duration-300'
                    style={{ width: `${(attr.avg || attr.value) * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className='mt-6 flex gap-4'>
            {isAuthenticated && (
              <Link
                href={`/oysters/${id}/review`}
                className='px-6 py-3 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium'>
                Write Review
              </Link>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
            Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <EmptyState
              icon='📝'
              title='No Reviews Yet'
              description='Be the first to review this oyster!'
              actionLabel='Write Review'
              actionHref={isAuthenticated ? `/oysters/${id}/review` : '/login'}
            />
          ) : (
            <div className='space-y-4'>
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onVoteChange={handleReviewChange}
                  onDelete={handleReviewChange}
                  showOysterLink={false}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
