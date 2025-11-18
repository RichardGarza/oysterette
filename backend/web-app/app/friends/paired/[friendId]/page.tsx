'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { friendApi } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';

interface PairedMatch {
  oyster: {
    id: string;
    name: string;
    species: string;
    origin: string;
  };
  userMatch: number;
  friendMatch: number;
  combinedScore: number;
}

export default function PairedMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const friendId = params.friendId as string;
  const [matches, setMatches] = useState<PairedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!friendId) {
      router.push('/friends');
      return;
    }
    loadMatches();
  }, [isAuthenticated, friendId, router]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await friendApi.getPairedRecommendations(friendId);
      setMatches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load paired recommendations');
      if (err.message.includes('missing')) {
        // Handle specific errors as in mobile (but for web, show message)
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a2332]">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading paired matches..." />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <button onClick={() => router.back()} className="mb-4 text-[#FF6B35] hover:underline flex items-center">
          ← Back to Friends
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Paired Matches</h1>
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.oyster.id} className="bg-white dark:bg-[#243447] rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{match.oyster.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{match.oyster.species} - {match.oyster.origin}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Match</p>
                    <div className="bg-green-100 dark:bg-green-900/20 rounded-full px-3 py-1">
                      <span className="text-green-800 dark:text-green-200 font-semibold">{match.userMatch}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Friend's Match</p>
                    <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full px-3 py-1">
                      <span className="text-blue-800 dark:text-blue-200 font-semibold">{match.friendMatch}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Combined</p>
                    <div className="bg-purple-100 dark:bg-purple-900/20 rounded-full px-3 py-1">
                      <span className="text-purple-800 dark:text-purple-200 font-semibold">{Math.round(match.combinedScore)}%</span>
                    </div>
                  </div>
                </div>
                <Link href={`/oysters/${match.oyster.id}`} className="block w-full text-center px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium">
                  View Oyster
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No paired matches yet</p>
            <p className="text-sm mt-2">Review more oysters to see recommendations with your friend</p>
          </div>
        )}
      </main>
    </div>
  );
}
