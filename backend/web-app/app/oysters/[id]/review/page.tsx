'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Header from '../../../../components/Header';
import { oysterApi, reviewApi } from '../../../../lib/api';
import { Oyster, Review, ReviewRating } from '../../../../lib/types';
import { useAuth } from '../../../../context/AuthContext';

export const dynamic = 'force-dynamic';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const id = params.id as string;
  const editReviewId = searchParams.get('edit');

  // Helper functions to map slider position (0-100) to display value (1-10)
  // This ensures the slider thumb is visually centered at value 5
  const sliderToDisplay = (slider: number): number => {
    if (slider <= 50) {
      return Math.round(slider / 12.5 + 1);
    } else {
      return Math.round((slider - 50) / 10 + 5);
    }
  };

  const displayToSlider = (display: number): number => {
    if (display <= 5) {
      return (display - 1) * 12.5;
    } else {
      return 50 + (display - 5) * 10;
    }
  };

  const [oyster, setOyster] = useState<Oyster | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [rating, setRating] = useState<ReviewRating>('LIKE_IT');
  const [notes, setNotes] = useState('');
  // Store slider positions (0-100) internally, convert to display values (1-10) as needed
  const [sizeSlider, setSizeSlider] = useState(50); // 50 = display value 5
  const [bodySlider, setBodySlider] = useState(50);
  const [sweetBrininessSlider, setSweetBrininessSlider] = useState(50);
  const [flavorfulnessSlider, setFlavorfulnessSlider] = useState(50);
  const [creaminessSlider, setCreaminessSlider] = useState(50);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Convert slider values to display values for submission
  const size = sliderToDisplay(sizeSlider);
  const body = sliderToDisplay(bodySlider);
  const sweetBrininess = sliderToDisplay(sweetBrininessSlider);
  const flavorfulness = sliderToDisplay(flavorfulnessSlider);
  const creaminess = sliderToDisplay(creaminessSlider);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadOyster();
    if (editReviewId) {
      loadExistingReview();
    }
  }, [id, editReviewId, isAuthenticated, router]);

  const loadOyster = async () => {
    try {
      const data = await oysterApi.getById(id);
      if (data) {
        setOyster(data);
        // Pre-populate with oyster's existing attributes (convert display to slider)
        setSizeSlider(displayToSlider(data.avgSize ? Math.round(data.avgSize) : 5));
        setBodySlider(displayToSlider(data.avgBody ? Math.round(data.avgBody) : 5));
        setSweetBrininessSlider(displayToSlider(data.avgSweetBrininess ? Math.round(data.avgSweetBrininess) : 5));
        setFlavorfulnessSlider(displayToSlider(data.avgFlavorfulness ? Math.round(data.avgFlavorfulness) : 5));
        setCreaminessSlider(displayToSlider(data.avgCreaminess ? Math.round(data.avgCreaminess) : 5));
      }
    } catch (error) {
      console.error('Failed to load oyster:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingReview = async () => {
    try {
      setLoading(true);
      const review = await reviewApi.checkExisting(id);
      if (review && review.id === editReviewId) {
        setExistingReview(review);
        setIsEditMode(true);
        setRating(review.rating);
        setNotes(review.notes || '');
        setSizeSlider(displayToSlider(review.size ?? 5));
        setBodySlider(displayToSlider(review.body ?? 5));
        setSweetBrininessSlider(displayToSlider(review.sweetBrininess ?? 5));
        setFlavorfulnessSlider(displayToSlider(review.flavorfulness ?? 5));
        setCreaminessSlider(displayToSlider(review.creaminess ?? 5));
      } else {
        // If review doesn't exist or wrong ID, redirect back
        router.push(`/oysters/${id}`);
      }
    } catch (error) {
      console.error('Failed to load existing review:', error);
      router.push(`/oysters/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isEditMode && existingReview) {
        await reviewApi.update(existingReview.id, {
          rating,
          size,
          body,
          sweetBrininess,
          flavorfulness,
          creaminess,
          notes: notes.trim() || undefined,
        });
        router.push(`/oysters/${id}`);
      } else {
        await reviewApi.create({
          oysterId: id,
          rating,
          size,
          body,
          sweetBrininess,
          flavorfulness,
          creaminess,
          notes: notes.trim() || undefined,
        });
        router.push(`/oysters/${id}`);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to submit review. Please try again.';
      if (!isEditMode && errorMsg.includes('already reviewed')) {
        setShowDuplicateModal(true);
      } else {
        setError(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a2332]">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-[#243447] rounded w-1/3" />
            <div className="h-64 bg-gray-200 dark:bg-[#243447] rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!oyster) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a2332]">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">Oyster not found.</p>
        </main>
      </div>
    );
  }

  const ratingOptions: { value: ReviewRating; label: string; emoji: string }[] = [
    { value: 'LOVE_IT', label: 'Love It', emoji: '❤️' },
    { value: 'LIKE_IT', label: 'Like It', emoji: '👍' },
    { value: 'OKAY', label: 'Okay', emoji: '😐' },
    { value: 'MEH', label: 'Meh', emoji: '👎' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isEditMode ? 'Update' : 'Review'} {oyster.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {isEditMode ? 'Update your experience with this oyster' : 'Share your experience with this oyster'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Overall Rating
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ratingOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRating(option.value)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      rating === option.value
                        ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                        : 'border-gray-300 dark:border-gray-700 hover:border-[#FF6B35]/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.emoji}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Attributes */}
            {[
              { label: 'Size', sliderValue: sizeSlider, setSliderValue: setSizeSlider, displayValue: size },
              { label: 'Body', sliderValue: bodySlider, setSliderValue: setBodySlider, displayValue: body },
              { label: 'Sweet/Brininess', sliderValue: sweetBrininessSlider, setSliderValue: setSweetBrininessSlider, displayValue: sweetBrininess },
              { label: 'Flavorfulness', sliderValue: flavorfulnessSlider, setSliderValue: setFlavorfulnessSlider, displayValue: flavorfulness },
              { label: 'Creaminess', sliderValue: creaminessSlider, setSliderValue: setCreaminessSlider, displayValue: creaminess },
            ].map((attr) => (
              <div key={attr.label}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {attr.label}
                  </label>
                  <span className="text-sm font-semibold text-[#FF6B35]">{attr.displayValue}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={attr.sliderValue}
                  onChange={(e) => attr.setSliderValue(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-[#2d4054] rounded-lg appearance-none cursor-pointer accent-[#FF6B35]"
                />
                <div className="relative w-full h-6 mt-1">
                  <div className="absolute left-0 text-xs text-gray-500">1</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 text-xs text-gray-500">5</div>
                  <div className="absolute right-0 text-xs text-gray-500">10</div>
                </div>
              </div>
            ))}

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                placeholder="Share your thoughts about this oyster..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : isEditMode ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Duplicate Review Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#243447] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Already Reviewed?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You have already reviewed this oyster. Would you like to update your existing review?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  // Navigate to edit mode - assume checkExisting would get the ID, but for simplicity, redirect to profile or reload
                  // In practice, call checkExisting to get review ID
                  reviewApi.checkExisting(id).then((review) => {
                    if (review) {
                      router.push(`/oysters/${id}/review?edit=${review.id}`);
                    }
                  });
                }}
                className="flex-1 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium"
              >
                Update Review?
              </button>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

