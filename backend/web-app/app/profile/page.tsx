'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import ReviewCard from '../../components/ReviewCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { userApi, reviewApi, xpApi, uploadApi, friendApi } from '../../lib/api';
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
  friendsCount: number; // Added friends count
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

  // Photo Upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
      loadReviews();
      loadXpData();
    } else {
      router.push('/login');
    }
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await userApi.getProfile();
      
      // Load friends count separately if not included in profile
      let friendsCount = 0;
      try {
        const friendsResponse = await friendApi.getFriendsCount();
        friendsCount = friendsResponse.friendsCount;
      } catch (error) {
        console.error('Failed to load friends count:', error);
      }
      
      // Extend stats with friends count
      const extendedStats = {
        ...profileData.stats,
        friendsCount,
      };
      
      setProfile({ ...profileData, stats: extendedStats });
      
      // Pre-populate edit form
      setEditName(profileData.user.name);
      setEditEmail(profileData.user.email);
      setEditUsername(profileData.user.username || '');
    } catch (error) {
      console.error('Failed to load profile:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!isAuthenticated) return;
    try {
      // Use getMyReviews which gets current user's reviews
      const data = await reviewApi.getMyReviews();
      setReviews(data.reviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const loadXpData = async () => {
    if (!isAuthenticated) return;
    try {
      // getStats uses authenticated user, no userId needed
      const data = await xpApi.getStats();
      setXpData(data);
    } catch (error) {
      console.error('Failed to load XP data:', error);
    }
  };

  // Edit Profile Form Handling
  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    
    try {
      setEditLoading(true);
      const updatedUser = await userApi.updateProfile({
        name: editName,
        email: editEmail,
        username: editUsername || undefined,
      });
      
      // Update auth user
      refreshUser(updatedUser);
      
      // Refresh profile with new data
      await loadProfile();
      
      setShowEditProfile(false);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      // Handle specific errors (email taken, username taken, etc.)
    } finally {
      setEditLoading(false);
    }
  };

  // Change Password Form Handling
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    try {
      setPasswordLoading(true);
      await userApi.changePassword(currentPassword, newPassword);
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      // Handle specific errors (current password wrong, etc.)
    } finally {
      setPasswordLoading(false);
    }
  };

  // Photo Upload Handling
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAuthenticated) return;
    
    try {
      setUploadingPhoto(true);
      const photoUrl = await uploadApi.uploadPhoto(file);
      
      // Update profile photo
      const updatedUser = await userApi.updateProfile({
        profilePhotoUrl: photoUrl,
      });
      
      // Update auth user
      refreshUser(updatedUser);
      
      // Refresh profile
      await loadProfile();
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1a2332]">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <LoadingSpinner size="lg" text="Loading profile..." />
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
              {user.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            {user.username && <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>}
            <p className="text-sm text-gray-500 mt-1">
              Member since {new Date(stats.memberSince).toLocaleDateString()}
            </p>

            {/* XP Badge */}
            {xpData && (
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
                <div className="text-sm">Level {xpData.level}</div>
                <div className="text-xs opacity-90">{xpData.xp} XP</div>
              </div>
            )}
          </div>

          {/* Edit Profile Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowEditProfile(true)}
              className="px-6 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Reviews Card */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
            <Link href="/profile/reviews" className="block">
              <div className="text-4xl font-bold text-[#FF6B35]">{stats.totalReviews}</div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Reviews</p>
            </Link>
          </div>

          {/* Favorites Card */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
            <Link href="/favorites" className="block">
              <div className="text-4xl font-bold text-[#FF6B35]">{stats.totalFavorites}</div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Favorites</p>
            </Link>
          </div>

          {/* Friends Card (New) */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
            <Link href="/friends" className="block">
              <div className="text-4xl font-bold text-[#FF6B35]">{stats.friendsCount}</div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Friends</p>
            </Link>
          </div>

          {/* XP Card */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl font-bold text-[#FF6B35]">{xpData ? xpData.xp : 0}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">XP</p>
          </div>

          {/* Credibility Card */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl font-bold text-[#FF6B35]">{Math.round(stats.credibilityScore * 10)}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Credibility</p>
          </div>

          {/* Review Streak Card (Moved from previous position) */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-4xl font-bold text-[#FF6B35]">{stats.reviewStreak}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Review Streak</p>
          </div>
        </div>

        {/* Badge Card (Moved to Review Streak position) */}
        <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 mb-8 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{stats.badgeLevel}</h3>
          <p className="text-gray-600 dark:text-gray-400">Your reviewer status based on review count and credibility</p>
        </div>

        {/* Reviews Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Reviews</h2>
            {stats.totalReviews > 0 && (
              <Link
                href="/profile/reviews"
                className="text-[#FF6B35] hover:text-[#e55a2b] font-medium transition-colors"
              >
                View All ({stats.totalReviews})
              </Link>
            )}
          </div>
          
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onUpdate={handleReviewChange}
                  showEditButton={true}
                />
              ))}
              {reviews.length > 3 && (
                <Link
                  href="/profile/reviews"
                  className="block text-center text-[#FF6B35] hover:text-[#e55a2b] font-medium transition-colors mt-4"
                >
                  View All {reviews.length} Reviews
                </Link>
              )}
            </div>
          ) : (
            <EmptyState
              icon="📝"
              title="No Reviews Yet"
              description="Your reviews will appear here once you start rating oysters."
              actionLabel="Browse Oysters"
              actionHref="/oysters"
            />
          )}
        </section>

        {/* Change Password Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowChangePassword(true)}
            className="px-6 py-2 bg-gray-100 dark:bg-[#243447] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#334e68] transition-colors font-medium"
          >
            Change Password
          </button>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#243447] rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Profile</h2>
            <form onSubmit={handleEditProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-[#334e68] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                  required
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-[#334e68] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                  required
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-[#334e68] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                  placeholder="@username"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-[#334e68] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 px-4 py-2 bg-[#FF6B35] text-white rounded-md hover:bg-[#e55a2b] transition-colors font-medium disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#243447] rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-[#334e68] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                  required
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-[#334e68] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                  required
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-[#334e68] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-[#334e68] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2 bg-[#FF6B35] text-white rounded-md hover:bg-[#e55a2b] transition-colors font-medium disabled:opacity-50"
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
