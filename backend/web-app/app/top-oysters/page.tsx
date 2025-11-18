'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import RatingDisplay from '../../components/RatingDisplay';
import EmptyState from '../../components/EmptyState';
import { oysterApi } from '../../lib/api';
import { Oyster } from '../../lib/types';

export const dynamic = 'force-dynamic';

export default function TopOystersPage() {
  const [oysters, setOysters] = useState<Oyster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopOysters();
  }, []);

  const loadTopOysters = async () => {
    try {
      const data = await oysterApi.getAll();
      const sorted = data
        .filter(o => o.totalReviews > 0)
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, 50);
      setOysters(sorted);
    } catch (error) {
      console.error('Failed to load top oysters:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Top Oysters
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Highest-rated by the community
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-[#243447] rounded-xl h-48" />
            ))}
          </div>
        ) : oysters.length === 0 ? (
          <EmptyState
            icon="🦪"
            title="No Top Oysters"
            description="No oysters have been rated yet."
          />
        ) : (
          <div className="space-y-4">
            {oysters.map((oyster, index) => (
              <Link
                key={oyster.id}
                href={`/oysters/${oyster.id}`}
                className="block p-6 bg-white dark:bg-[#243447] rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FF6B35] flex items-center justify-center text-white font-bold text-lg">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {oyster.name}
                      </h3>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-[#2d4054] rounded-full text-sm">
                        {oyster.species}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {oyster.origin}
                    </p>
                    <RatingDisplay overallScore={oyster.overallScore} totalReviews={oyster.totalReviews} size="medium" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

