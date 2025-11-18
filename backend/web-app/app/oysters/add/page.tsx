'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { oysterApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

export const dynamic = 'force-dynamic';

export default function AddOysterPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    origin: '',
    standoutNotes: '',
    size: 5,
    body: 5,
    sweetBrininess: 5,
    flavorfulness: 5,
    creaminess: 5,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      await oysterApi.create({
        name: formData.name,
        species: formData.species || undefined,
        origin: formData.origin || undefined,
        standoutNotes: formData.standoutNotes || undefined,
        size: formData.size,
        body: formData.body,
        sweetBrininess: formData.sweetBrininess,
        flavorfulness: formData.flavorfulness,
        creaminess: formData.creaminess,
      });
      alert('Oyster suggestion submitted successfully!');
      router.push('/oysters');
    } catch (error: any) {
      console.error('Failed to submit oyster:', error);
      alert(error.response?.data?.error || 'Failed to submit oyster suggestion');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a2332]">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12">
          {showLoginModal && (
            <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Login Required
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please log in to suggest a new oyster.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/login')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-6 py-3 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Suggest a New Oyster
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#243447] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Species (optional)
            </label>
            <input
              type="text"
              value={formData.species}
              onChange={(e) => setFormData({ ...formData, species: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#243447] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Origin (optional)
            </label>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#243447] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Standout Notes (optional)
            </label>
            <textarea
              value={formData.standoutNotes}
              onChange={(e) => setFormData({ ...formData, standoutNotes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#243447] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>

          {['size', 'body', 'sweetBrininess', 'flavorfulness', 'creaminess'].map((attr) => (
            <div key={attr}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {attr.charAt(0).toUpperCase() + attr.slice(1).replace(/([A-Z])/g, ' $1')} * ({formData[attr as keyof typeof formData]}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData[attr as keyof typeof formData]}
                onChange={(e) => setFormData({ ...formData, [attr]: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Suggest Oyster'}
          </button>
        </form>
      </main>
    </div>
  );
}

