'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { userApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export const dynamic = 'force-dynamic';

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    profileVisibility: 'public' as 'public' | 'friends' | 'private',
    showReviewHistory: true,
    showFavorites: true,
    showStatistics: true,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await userApi.updatePrivacySettings(settings);
      alert('Privacy settings updated successfully');
    } catch (error: any) {
      console.error('Failed to update privacy settings:', error);
      alert(error.response?.data?.error || 'Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Privacy Settings
        </h1>

        <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          {/* Profile Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profile Visibility
            </label>
            <select
              value={settings.profileVisibility}
              onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value as any })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Control who can view your profile
            </p>
          </div>

          {/* Show Review History */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Review History
              </label>
              <p className="text-xs text-gray-500">Display your review history on your profile</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showReviewHistory}
                onChange={(e) => setSettings({ ...settings, showReviewHistory: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FF6B35]/20 dark:peer-focus:ring-[#FF6B35]/30 rounded-full peer dark:bg-[#2d4054] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#FF6B35]"></div>
            </label>
          </div>

          {/* Show Favorites */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Favorites
              </label>
              <p className="text-xs text-gray-500">Display your favorite oysters on your profile</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showFavorites}
                onChange={(e) => setSettings({ ...settings, showFavorites: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FF6B35]/20 dark:peer-focus:ring-[#FF6B35]/30 rounded-full peer dark:bg-[#2d4054] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#FF6B35]"></div>
            </label>
          </div>

          {/* Show Statistics */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Statistics
              </label>
              <p className="text-xs text-gray-500">Display your stats (reviews, ratings, etc.) on your profile</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showStatistics}
                onChange={(e) => setSettings({ ...settings, showStatistics: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FF6B35]/20 dark:peer-focus:ring-[#FF6B35]/30 rounded-full peer dark:bg-[#2d4054] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#FF6B35]"></div>
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </main>
    </div>
  );
}

