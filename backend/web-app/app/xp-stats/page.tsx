'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { xpApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export const dynamic = 'force-dynamic';

export default function XPStatsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [xpData, setXpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadXPStats();
  }, [isAuthenticated, router]);

  const loadXPStats = async () => {
    try {
      const data = await xpApi.getStats();
      setXpData(data);
    } catch (error) {
      console.error('Failed to load XP stats:', error);
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
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 dark:bg-[#243447] rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!xpData) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a2332]">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-gray-600 dark:text-gray-400">Failed to load XP stats.</p>
        </main>
      </div>
    );
  }

  const progressPercent = (xpData.xp % 100) / xpData.xpToNextLevel * 100;

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          XP & Achievements
        </h1>

        {/* XP Overview */}
        <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-[#FF6B35] mb-2">Level {xpData.level}</div>
            <div className="text-2xl text-gray-600 dark:text-gray-400">{xpData.xp} XP</div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress to Level {xpData.level + 1}</span>
              <span>{xpData.xp % 100} / {xpData.xpToNextLevel} XP</span>
            </div>
            <div className="w-full h-4 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Achievements */}
        {xpData.achievements && xpData.achievements.length > 0 && (
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Achievements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {xpData.achievements.map((achievement: any, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-[#1a2332] rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{achievement.icon || '🏆'}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

