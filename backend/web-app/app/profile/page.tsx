'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import ReviewCard from '../../components/ReviewCard';
import EmptyState from '../../components/EmptyState';
import { userApi, reviewApi, xpApi, uploadApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Review, User } from '../../lib/types';

export const dynamic = 'force-dynamic';

interface ProfileStats {
  totalReviews: number;
  totalFavorites: number;
  avgRatingGiven: number;
  credibilityScore: number;
  badgeLevel: 'Novice' | 'Trusted' | 'Expert';
  reviewStreak: number;
  mostReviewedSpecies?: string;
  mostReviewedOrigin?: string;
  memberSince: string;
  totalVotesGiven: number;
  totalVotesReceived: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<{ user: User; stats: ProfileStats } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [xpData, setXpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit Profile Modal
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Change Password Modal
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile Photo Upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated, router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userApi.getProfile();
      setProfile(data);
      setEditName(data.user.name);
      setEditEmail(data.user.email);
      setEditUsername(data.user.username || '');

      // Load reviews
      const reviewData = await userApi.getMyReviews({ page: 1, limit: 5, sortBy: 'createdAt' });
      setReviews(reviewData.reviews);

      // Load XP stats
      try {
        const xp = await xpApi.getStats();
        setXpData(xp);
      } catch (error) {
        console.error('Failed to load XP stats:', error);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const photoUrl = await uploadApi.uploadProfilePhoto(file);
      await userApi.updateProfile(profile?.user.name, profile?.user.email, photoUrl);
      await refreshUser();
      loadProfile();
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleEditProfile = async () => {
    if (!editName.trim()) {
      alert('Name cannot be empty');
      return;
    }

    try {
      setEditLoading(true);
      await userApi.updateProfile(editName, editEmail);
      // Update username if changed
      if (editUsername !== (profile?.user.username || '')) {
        if (editUsername.trim()) {
          await userApi.setUsername(editUsername.trim());
        }
      }
      await refreshUser();
      loadProfile();
      setShowEditProfile(false);
      alert('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      alert('Password must contain uppercase, lowercase, and number');
      return;
    }

    try {
      setPasswordLoading(true);
      await userApi.changePassword(currentPassword, newPassword);
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password changed successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getBadgeColor = (badgeLevel: string) => {
    switch (badgeLevel) {
      case 'Expert':
        return '#FFD700';
      case 'Trusted':
        return '#C0C0C0';
      case 'Novice':
      default:
        return '#CD7F32';
    }
  };

  const getBadgeIcon = (badgeLevel: string) => {
    switch (badgeLevel) {
      case 'Expert':
        return '🏆';
      case 'Trusted':
        return '⭐';
      case 'Novice':
      default:
        return '🌟';
    }
  };

  if (loading || !profile) {
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

  const { user, stats } = profile;

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              {user.profilePhotoUrl ? (
                <img
                  src={user.profilePhotoUrl}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#FF6B35] flex items-center justify-center text-white text-3xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
              {!uploadingPhoto && (
                <label className="absolute bottom-0 right-0 bg-[#FF6B35] text-white p-2 rounded-full cursor-pointer hover:bg-[#e55a2b] transition-colors">
                  📷
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {user.username || user.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Member since {new Date(stats.memberSince).toLocaleDateString()}
            </p>

            {/* XP Badge */}
            {xpData && (
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
                <div className="text-sm">Level {xpData.level}</div>
                <div className="text-xs opacity-90">{xpData.xp} XP</div>
                <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                  <div
                    className="bg-white h-2 rounded-full"
                    style={{ width: `${(xpData.xp % 100) / xpData.xpToNextLevel * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-6">
              <button
                onClick={() => setShowEditProfile(true)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setShowChangePassword(true)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Change Password
              </button>
              <Link
                href="/privacy-settings"
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Privacy Settings
              </Link>
              <Link
                href="/xp-stats"
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                XP & Achievements
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link
              href="/oysters"
              className="p-4 bg-gray-50 dark:bg-[#1a2332] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center cursor-pointer"
            >
              <p className="text-2xl font-bold text-[#FF6B35]">{stats.totalReviews}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reviews</p>
            </Link>
            <Link
              href="/favorites"
              className="p-4 bg-gray-50 dark:bg-[#1a2332] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center cursor-pointer"
            >
              <p className="text-2xl font-bold text-[#FF6B35]">{stats.totalFavorites}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Favorites</p>
            </Link>
            <div className="p-4 bg-gray-50 dark:bg-[#1a2332] rounded-lg text-center">
              <div className="text-2xl mb-1">{getBadgeIcon(stats.badgeLevel)}</div>
              <p className="text-sm font-semibold" style={{ color: getBadgeColor(stats.badgeLevel) }}>
                {stats.badgeLevel}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Badge</p>
            </div>
            <Link
              href="/oysters"
              className="p-4 bg-gray-50 dark:bg-[#1a2332] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center cursor-pointer"
            >
              <p className="text-2xl font-bold text-[#FF6B35]">{stats.totalVotesReceived}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Votes Received</p>
            </Link>
            <div className="p-4 bg-gray-50 dark:bg-[#1a2332] rounded-lg text-center">
              <p className="text-2xl font-bold text-[#FF6B35]">{stats.avgRatingGiven.toFixed(1)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#1a2332] rounded-lg text-center">
              <p className="text-2xl font-bold text-[#FF6B35]">{stats.reviewStreak}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Review Streak</p>
            </div>
          </div>
        </div>

        {/* Flavor Profile */}
        {(user.baselineSize || user.baselineBody || user.baselineSweetBrininess || user.baselineFlavorfulness || user.baselineCreaminess) && (
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Flavor Profile</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              {stats.totalReviews >= 5
                ? 'Your taste range based on oysters you loved'
                : 'Your preferred oyster characteristics'}
            </p>
            <div className="space-y-4">
              {user.baselineSize && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Size</span>
                    <span className="text-xs text-gray-500">
                      {user.rangeMinSize != null && user.rangeMaxSize != null
                        ? `${user.rangeMinSize.toFixed(0)}-${user.rangeMaxSize.toFixed(0)}/10`
                        : `${user.baselineSize.toFixed(1)}/10`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF6B35]"
                      style={{
                        width: user.rangeMinSize != null && user.rangeMaxSize != null
                          ? `${((user.rangeMaxSize - user.rangeMinSize) / 10) * 100}%`
                          : `${(user.baselineSize / 10) * 100}%`,
                        marginLeft: user.rangeMinSize != null ? `${(user.rangeMinSize / 10) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              )}
              {user.baselineBody && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Body</span>
                    <span className="text-xs text-gray-500">
                      {user.rangeMinBody != null && user.rangeMaxBody != null
                        ? `${user.rangeMinBody.toFixed(0)}-${user.rangeMaxBody.toFixed(0)}/10`
                        : `${user.baselineBody.toFixed(1)}/10`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF6B35]"
                      style={{
                        width: user.rangeMinBody != null && user.rangeMaxBody != null
                          ? `${((user.rangeMaxBody - user.rangeMinBody) / 10) * 100}%`
                          : `${(user.baselineBody / 10) * 100}%`,
                        marginLeft: user.rangeMinBody != null ? `${(user.rangeMinBody / 10) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              )}
              {user.baselineSweetBrininess && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Sweet/Brininess</span>
                    <span className="text-xs text-gray-500">
                      {user.rangeMinSweetBrininess != null && user.rangeMaxSweetBrininess != null
                        ? `${user.rangeMinSweetBrininess.toFixed(0)}-${user.rangeMaxSweetBrininess.toFixed(0)}/10`
                        : `${user.baselineSweetBrininess.toFixed(1)}/10`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF6B35]"
                      style={{
                        width: user.rangeMinSweetBrininess != null && user.rangeMaxSweetBrininess != null
                          ? `${((user.rangeMaxSweetBrininess - user.rangeMinSweetBrininess) / 10) * 100}%`
                          : `${(user.baselineSweetBrininess / 10) * 100}%`,
                        marginLeft: user.rangeMinSweetBrininess != null ? `${(user.rangeMinSweetBrininess / 10) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              )}
              {user.baselineFlavorfulness && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Flavorfulness</span>
                    <span className="text-xs text-gray-500">
                      {user.rangeMinFlavorfulness != null && user.rangeMaxFlavorfulness != null
                        ? `${user.rangeMinFlavorfulness.toFixed(0)}-${user.rangeMaxFlavorfulness.toFixed(0)}/10`
                        : `${user.baselineFlavorfulness.toFixed(1)}/10`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF6B35]"
                      style={{
                        width: user.rangeMinFlavorfulness != null && user.rangeMaxFlavorfulness != null
                          ? `${((user.rangeMaxFlavorfulness - user.rangeMinFlavorfulness) / 10) * 100}%`
                          : `${(user.baselineFlavorfulness / 10) * 100}%`,
                        marginLeft: user.rangeMinFlavorfulness != null ? `${(user.rangeMinFlavorfulness / 10) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              )}
              {user.baselineCreaminess && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Creaminess</span>
                    <span className="text-xs text-gray-500">
                      {user.rangeMinCreaminess != null && user.rangeMaxCreaminess != null
                        ? `${user.rangeMinCreaminess.toFixed(0)}-${user.rangeMaxCreaminess.toFixed(0)}/10`
                        : `${user.baselineCreaminess.toFixed(1)}/10`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-[#2d4054] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF6B35]"
                      style={{
                        width: user.rangeMinCreaminess != null && user.rangeMaxCreaminess != null
                          ? `${((user.rangeMaxCreaminess - user.rangeMinCreaminess) / 10) * 100}%`
                          : `${(user.baselineCreaminess / 10) * 100}%`,
                        marginLeft: user.rangeMinCreaminess != null ? `${(user.rangeMinCreaminess / 10) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Favorite Species / Origin */}
        {(stats.mostReviewedSpecies || stats.mostReviewedOrigin) && (
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Favorite Species / Region</h2>
            {stats.mostReviewedSpecies && (
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Favorite Species:</span>
                <span className="font-semibold">{stats.mostReviewedSpecies}</span>
              </div>
            )}
            {stats.mostReviewedOrigin && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Favorite Origin:</span>
                <span className="font-semibold">{stats.mostReviewedOrigin}</span>
              </div>
            )}
          </div>
        )}

        {/* Recent Reviews */}
        <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Reviews</h2>
          {reviews.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No Reviews Yet"
              description="You haven't written any reviews yet. Start exploring oysters and share your tasting experiences!"
              actionLabel="Browse Oysters"
              actionHref="/oysters"
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onVoteChange={loadProfile}
                  onDelete={loadProfile}
                  showOysterLink={true}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#243447] rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username (optional)
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="e.g., OysterFan123"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowEditProfile(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleEditProfile}
                disabled={editLoading}
                className="flex-1 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#243447] rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a2332] text-gray-900 dark:text-white"
                />
              </div>
              <p className="text-xs text-gray-500">
                Password must be at least 8 characters and contain uppercase, lowercase, and numbers
              </p>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={passwordLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex-1 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors disabled:opacity-50"
              >
                {passwordLoading ? 'Changing...' : 'Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
