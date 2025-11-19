'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Review } from '../lib/types';
import { voteApi, reviewApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface ReviewCardProps {
  review: Review;
  onVoteChange?: () => void;
  onDelete?: () => void;
  showOysterLink?: boolean;
}

export default function ReviewCard({
  review,
  onVoteChange,
  onDelete,
  showOysterLink = true,
}: ReviewCardProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [currentVote, setCurrentVote] = useState<boolean | null>(null);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  const isOwnReview = user && review.userId === user.id;

  const handleVote = async (isAgree: boolean) => {
    if (!isAuthenticated) return;

    try {
      setVoting(true);
      if (currentVote === isAgree) {
        await voteApi.removeVote(review.id);
        setCurrentVote(null);
      } else {
        await voteApi.vote(review.id, isAgree);
        setCurrentVote(isAgree);
      }
      onVoteChange?.();
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      setDeleting(true);
      await reviewApi.delete(review.id);
      onDelete?.();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-[#243447] rounded-xl border border-gray-200 dark:border-[#2d4054] p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            {review.user?.profilePhotoUrl ? (
              <img
                src={review.user.profilePhotoUrl}
                alt={review.user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center text-white font-bold">
                {(review.user?.name || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {review.user?.username || review.user?.name || 'Anonymous'}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
              {review.oyster?.name && (
                <p className="text-sm font-medium text-[#FF6B35] mt-1">
                  {review.oyster.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#FF6B35]/10 text-[#FF6B35] rounded-full text-sm font-medium">
              {review.rating.replace('_', ' ')}
            </span>
            {isOwnReview && (
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    // Navigate to edit review page
                    if (review.oyster?.id) {
                      router.push(`/oysters/${review.oyster.id}/review?edit=${review.id}`);
                    }
                  }}
                  className="p-1 text-gray-500 hover:text-[#FF6B35] transition-colors"
                  title="Edit review"
                >
                  ✏️
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-1 text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Delete review"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        </div>

        {review.notes && (
          <p className="text-gray-700 dark:text-gray-300 mb-4">{review.notes}</p>
        )}

        {review.photoUrls && review.photoUrls.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {review.photoUrls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setFullscreenPhoto(url)}
                className="flex-shrink-0"
              >
                <img
                  src={url}
                  alt={`Review photo ${idx + 1}`}
                  className="w-24 h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
                />
              </button>
            ))}
          </div>
        )}

        {isAuthenticated && (
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-[#2d4054]">
            <button
              onClick={() => handleVote(true)}
              disabled={voting}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
                currentVote === true
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-[#2d4054] text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/10'
              }`}
            >
              👍 {review.agreeCount || 0}
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={voting}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
                currentVote === false
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-[#2d4054] text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/10'
              }`}
            >
              👎 {review.disagreeCount || 0}
            </button>
            {showOysterLink && review.oyster?.id && (
              <Link
                href={`/oysters/${review.oyster.id}`}
                className="ml-auto text-sm text-[#FF6B35] hover:underline"
              >
                View Oyster →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Photo Modal */}
      {fullscreenPhoto && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setFullscreenPhoto(null)}
        >
          <img
            src={fullscreenPhoto}
            alt="Review photo"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setFullscreenPhoto(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

