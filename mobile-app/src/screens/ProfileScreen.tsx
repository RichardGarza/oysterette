/**
 * ProfileScreen
 *
 * Comprehensive user profile display with stats, insights, and account management.
 *
 * Features:
 * - User profile header with avatar (first letter of name)
 * - Profile stats grid (Reviews, Favorites, Badge, Votes, Avg Rating, Streak)
 * - Badge system with visual indicators (Novice 🌟, Trusted ⭐, Expert 🏆)
 * - User taste insights (most reviewed species/origin)
 * - Recent review history (5 most recent)
 * - Edit profile modal (name, email)
 * - Change password modal with validation
 * - Pull-to-refresh functionality
 * - Auto-load on focus (syncs after changes in other screens)
 * - Theme-aware styling
 *
 * Profile Stats:
 * - totalReviews: Count of user's reviews
 * - totalFavorites: Count of favorited oysters
 * - totalVotesGiven: Count of votes user has cast
 * - totalVotesReceived: Votes received on user's reviews
 * - avgRatingGiven: Average rating (1-4 scale mapped from WHATEVER to LOVE_IT)
 * - credibilityScore: Reputation score based on voting patterns
 * - badgeLevel: Novice (0-0.9), Trusted (1.0-1.4), Expert (1.5+)
 * - reviewStreak: Days with consecutive reviews
 * - mostReviewedSpecies: User's favorite oyster species
 * - mostReviewedOrigin: User's favorite oyster origin
 *
 * Badge Colors:
 * - Expert: Gold (#FFD700)
 * - Trusted: Silver (#C0C0C0)
 * - Novice: Bronze (#CD7F32)
 *
 * Edit Profile:
 * - Modal with name/email inputs
 * - Validates name not empty
 * - Updates backend and local storage
 * - Shows success confirmation
 *
 * Change Password:
 * - Modal with current/new/confirm password inputs
 * - Validates all fields filled
 * - Validates passwords match
 * - Validates new password meets requirements (8+ chars, uppercase, lowercase, number)
 * - Updates backend and clears form
 *
 * Review History:
 * - Shows 5 most recent reviews
 * - Displays oyster name, rating (formatted), notes (2 lines)
 * - Shows date and vote counts (agree/disagree)
 * - Tappable cards navigate to oyster detail
 * - Empty state if no reviews yet
 *
 * Flow:
 * 1. Checks auth on mount
 * 2. Loads profile data from userApi.getProfile()
 * 3. Loads review history from userApi.getMyReviews()
 * 4. Re-loads on screen focus (useFocusEffect)
 * 5. Pull-to-refresh updates all data
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { authStorage } from '../services/auth';
import { userApi, reviewApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Review, User } from '../types/Oyster';
import { EmptyState } from '../components/EmptyState';

interface ProfileStats {
  totalReviews: number;
  totalFavorites: number;
  totalVotesGiven: number;
  totalVotesReceived: number;
  avgRatingGiven: number;
  credibilityScore: number;
  badgeLevel: 'Novice' | 'Trusted' | 'Expert';
  memberSince: string;
  reviewStreak: number;
  mostReviewedSpecies?: string;
  mostReviewedOrigin?: string;
}

interface ProfileData {
  user: User;
  stats: ProfileStats;
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Edit Profile Modal
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
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
    loadProfile();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        console.log('Camera permission not granted');
      }
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaStatus.status !== 'granted') {
        console.log('Media library permission not granted');
      }
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const user = await authStorage.getUser();
      if (!user) {
        navigation.navigate('Login');
        return;
      }

      // Fetch profile with stats using new API
      const profile = await userApi.getProfile();
      setProfileData(profile);
      setEditName(profile.user.name);
      setEditEmail(profile.user.email);

      // Fetch user's reviews (paginated, showing first 20)
      const reviewHistory = await userApi.getMyReviews({ page: 1, limit: 20, sortBy: 'createdAt' });
      setReviews(reviewHistory.reviews);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from camera:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    try {
      setUploadingPhoto(true);
      const token = await authStorage.getToken();

      if (!token) {
        Alert.alert('Authentication Required', 'Please log in to upload a profile photo.');
        return;
      }

      // Create form data
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri,
        name: filename,
        type,
      } as any);

      // Upload to backend
      const response = await fetch('https://oysterette-production.up.railway.app/api/upload/image?folder=profiles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        // Update profile with new photo URL
        await userApi.updateProfile(profileData?.user.name, profileData?.user.email, data.data.url);

        // Reload profile to show new photo
        await loadProfile();

        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      Alert.alert('Upload Failed', 'Failed to upload profile photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose a photo source',
      [
        {
          text: 'Take Photo',
          onPress: pickImageFromCamera,
        },
        {
          text: 'Choose from Library',
          onPress: pickImageFromLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleEditProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      setEditLoading(true);
      await userApi.updateProfile(editName, editEmail);

      // Update local storage
      if (profileData) {
        const updatedUser = { ...profileData.user, name: editName, email: editEmail };
        await authStorage.saveUser(updatedUser);
        setProfileData({ ...profileData, user: updatedUser });
      }

      setShowEditProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      Alert.alert('Error', 'Password must contain uppercase, lowercase, and number');
      return;
    }

    try {
      setPasswordLoading(true);
      await userApi.changePassword(currentPassword, newPassword);

      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleReviewPress = (review: Review) => {
    if (review.oyster?.id) {
      navigation.navigate('OysterDetail', { oysterId: review.oyster.id });
    }
  };

  const handleDeleteReview = (review: Review, event: any) => {
    // Stop propagation to prevent navigation to oyster detail
    event.stopPropagation();

    Alert.alert(
      'Delete Review',
      `Are you sure you want to delete your review for "${review.oyster?.name || 'this oyster'}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reviewApi.delete(review.id);
              // Remove review from local state
              setReviews(prevReviews => prevReviews.filter(r => r.id !== review.id));
              Alert.alert('Success', 'Review deleted successfully');
              // Refresh profile data to update stats
              loadProfile();
            } catch (error) {
              console.error('Error deleting review:', error);
              Alert.alert('Error', 'Failed to delete review. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getBadgeColor = (badgeLevel: string) => {
    switch (badgeLevel) {
      case 'Expert':
        return '#FFD700'; // Gold
      case 'Trusted':
        return '#C0C0C0'; // Silver
      case 'Novice':
      default:
        return '#CD7F32'; // Bronze
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const styles = createStyles(theme.colors, isDark);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  const { user, stats } = profileData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={showPhotoOptions}
            disabled={uploadingPhoto}
          >
            {user.profilePhotoUrl ? (
              <Image
                source={{ uri: user.profilePhotoUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            )}
            {uploadingPhoto && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
            {!uploadingPhoto && (
              <View style={styles.cameraIconContainer}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.joinDate}>Member since {formatDate(stats.memberSince)}</Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowEditProfile(true)}
            >
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowChangePassword(true)}
            >
              <Text style={styles.actionButtonText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('PrivacySettings')}
            >
              <Text style={styles.actionButtonText}>Privacy Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalReviews}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalFavorites}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeIcon}>{getBadgeIcon(stats.badgeLevel)}</Text>
              <Text style={[styles.badgeText, { color: getBadgeColor(stats.badgeLevel) }]}>
                {stats.badgeLevel}
              </Text>
            </View>
            <Text style={styles.statLabel}>Badge</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalVotesReceived}</Text>
            <Text style={styles.statLabel}>Votes Received</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgRatingGiven.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.reviewStreak}</Text>
            <Text style={styles.statLabel}>Review Streak</Text>
          </View>
        </View>

        {/* Insights */}
        {(stats.mostReviewedSpecies || stats.mostReviewedOrigin) && (
          <View style={styles.insightsCard}>
            <Text style={styles.sectionTitle}>Your Tastes</Text>
            {stats.mostReviewedSpecies && (
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Favorite Species:</Text>
                <Text style={styles.insightValue}>{stats.mostReviewedSpecies}</Text>
              </View>
            )}
            {stats.mostReviewedOrigin && (
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Favorite Origin:</Text>
                <Text style={styles.insightValue}>{stats.mostReviewedOrigin}</Text>
              </View>
            )}
          </View>
        )}

        {/* Review History */}
        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          {reviews.length > 0 ? (
            reviews.slice(0, 5).map((review) => (
              <TouchableOpacity
                key={review.id}
                style={styles.reviewCard}
                onPress={() => handleReviewPress(review)}
              >
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewHeaderLeft}>
                    <Text style={styles.oysterName}>
                      {review.oyster?.name || 'Unknown Oyster'}
                    </Text>
                    <Text style={styles.reviewRating}>{review.rating.replace('_', ' ')}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(event) => handleDeleteReview(review, event)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
                {review.notes && (
                  <Text style={styles.reviewNotes} numberOfLines={2}>
                    {review.notes}
                  </Text>
                )}
                <View style={styles.reviewFooter}>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                  {(review.agreeCount > 0 || review.disagreeCount > 0) && (
                    <Text style={styles.reviewVotes}>
                      👍 {review.agreeCount || 0} · 👎 {review.disagreeCount || 0}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyState
              icon="📝"
              title="No Reviews Yet"
              description="You haven't written any reviews yet. Start exploring oysters and share your tasting experiences!"
              actionLabel="Browse Oysters"
              onAction={() => navigation.navigate('OysterList')}
            />
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditProfile(false)}
                disabled={editLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditProfile}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
            />

            <Text style={styles.passwordHint}>
              Password must be at least 8 characters and contain uppercase, lowercase, and numbers
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowChangePassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={passwordLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Change</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 20,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#fff',
    },
    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    avatarOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.card,
    },
    cameraIcon: {
      fontSize: 14,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    joinDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    actionButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
    },
    actionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 12,
      gap: 12,
    },
    statCard: {
      width: '30%',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    badgeContainer: {
      alignItems: 'center',
    },
    badgeIcon: {
      fontSize: 24,
      marginBottom: 4,
    },
    badgeText: {
      fontSize: 14,
      fontWeight: '600',
    },
    insightsCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    insightRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    insightLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    insightValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    reviewSection: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    reviewCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    reviewHeaderLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    oysterName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    reviewRating: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      textTransform: 'capitalize',
    },
    deleteButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
    },
    deleteButtonText: {
      fontSize: 18,
    },
    reviewNotes: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    reviewFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    reviewDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    reviewVotes: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: '85%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 8,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    passwordHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      fontStyle: 'italic',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
