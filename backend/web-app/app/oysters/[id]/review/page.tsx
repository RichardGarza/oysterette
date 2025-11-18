'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../../components/Header';
import { oysterApi, reviewApi } from '../../../../lib/api';
import { Oyster, ReviewRating } from '../../../../lib/types';
import { useAuth } from '../../../../context/AuthContext';

export const dynamic = 'force-dynamic';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const id = params.id as string;

  const [oyster, setOyster] = useState<Oyster | null>(null);
  const [rating, setRating] = useState<ReviewRating>('LIKE_IT');
  const [notes, setNotes] = useState('');
  const [size, setSize] = useState(5);
  const [body, setBody] = useState(5);
  const [sweetBrininess, setSweetBrininess] = useState(5);
  const [flavorfulness, setFlavorfulness] = useState(5);
  const [creaminess, setCreaminess] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadOyster();
  }, [id, isAuthenticated, router]);

  const loadOyster = async () => {
    try {
      const data = await oysterApi.getById(id);
      if (data) {
        setOyster(data);
        // Pre-populate with oyster's existing attributes
        setSize(data.avgSize ? Math.round(data.avgSize) : 5);
        setBody(data.avgBody ? Math.round(data.avgBody) : 5);
        setSweetBrininess(data.avgSweetBrininess ? Math.round(data.avgSweetBrininess) : 5);
        setFlavorfulness(data.avgFlavorfulness ? Math.round(data.avgFlavorfulness) : 5);
        setCreaminess(data.avgCreaminess ? Math.round(data.avgCreaminess) : 5);
      }
    } catch (error) {
      console.error('Failed to load oyster:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit review. Please try again.');
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
            Review {oyster.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Share your experience with this oyster
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
              { label: 'Size', value: size, setValue: setSize },
              { label: 'Body', value: body, setValue: setBody },
              { label: 'Sweet/Brininess', value: sweetBrininess, setValue: setSweetBrininess },
              { label: 'Flavorfulness', value: flavorfulness, setValue: setFlavorfulness },
              { label: 'Creaminess', value: creaminess, setValue: setCreaminess },
            ].map((attr) => (
              <div key={attr.label}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {attr.label}
                  </label>
                  <span className="text-sm font-semibold text-[#FF6B35]">{attr.value}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={attr.value}
                  onChange={(e) => attr.setValue(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-[#2d4054] rounded-lg appearance-none cursor-pointer accent-[#FF6B35]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
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
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

