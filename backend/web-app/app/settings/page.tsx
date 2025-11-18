'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { userApi } from '../../lib/api';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

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
      alert('Password changed successfully');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      alert(error.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      alert('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }
    
    try {
      setDeleteLoading(true);
      await userApi.deleteAccount(deletePassword || undefined, deleteConfirmText);
      alert('Account deleted successfully');
      logout();
      router.push('/');
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      alert(error.response?.data?.error || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a2332]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Theme Toggle */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Appearance
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Toggle between light and dark mode
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 bg-gray-200 dark:bg-[#2d4054] rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>
          </div>

          {/* App Info */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Version:</strong> 2.0.0</p>
              <p><strong>Platform:</strong> Web</p>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full px-6 py-3 bg-gray-200 dark:bg-[#2d4054] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Change Password
            </button>
          </div>

          {/* Logout */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <button
              onClick={logout}
              className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Logout
            </button>
          </div>

          {/* Delete Account */}
          <div className="bg-white dark:bg-[#243447] rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Danger Zone</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteAccount(true)}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete Account
            </button>
          </div>
        </div>
      </main>

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

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#243447] rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Delete Account</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This action cannot be undone. This will permanently delete your account and all associated data.
            </p>
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              {user?.password && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password (required for verification)
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-[#334e68] dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type "DELETE MY ACCOUNT" to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-[#334e68] dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAccount(false);
                    setDeleteConfirmText('');
                    setDeletePassword('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-[#334e68] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

