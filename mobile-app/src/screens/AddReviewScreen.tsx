/**
 * AddReviewScreen
 *
 * Review creation and update form with rating selection and attribute sliders.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  ActivityIndicator,
  Portal,
  Dialog,
  Surface,
  Chip,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { AddReviewScreenRouteProp, AddReviewScreenNavigationProp } from '../navigation/types';
import { reviewApi, api } from '../services/api';
import { authStorage } from '../services/auth';
import { ReviewRating } from '../types/Oyster';
import { getAttributeDescriptor } from '../utils/ratingUtils';
import { useTheme } from '../context/ThemeContext';
import { tempReviewsStorage } from '../services/tempReviews';
import { useXPNotification } from '../context/XPNotificationContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const RATING_OPTIONS: ReadonlyArray<{ label: string; value: ReviewRating; emoji: string; color: string }> = [
  { label: 'Love It', value: 'LOVE_IT', emoji: '❤️', color: '#e74c3c' },
  { label: 'Like It', value: 'LIKE_IT', emoji: '👍', color: '#27ae60' },
  { label: 'Okay', value: 'OKAY', emoji: '👌', color: '#3498db' },
  { label: 'Meh', value: 'MEH', emoji: '😐', color: '#95a5a6' },
] as const;

const SLIDER_CONFIG = {
  MIN_VALUE: 1,
  MAX_VALUE: 10,
  STEP: 1,
  DEFAULT_VALUE: 5,
  HEIGHT: 50,
} as const;

const PHOTO_LIMITS = {
  MAX_COUNT: 1,
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export default function AddReviewScreen() {
  const route = useRoute<AddReviewScreenRouteProp>();
  const navigation = useNavigation<AddReviewScreenNavigationProp>();
  const { paperTheme } = useTheme();
  const { showXPGain } = useXPNotification();
  const {
    oysterId,
    oysterName,
    oysterOrigin,
    oysterSpecies,
    oysterAvgSize,
    oysterAvgBody,
    oysterAvgSweetBrininess,
    oysterAvgFlavorfulness,
    oysterAvgCreaminess,
    existingReview
  } = route.params;
  const isUpdateMode = !!existingReview;

  const [rating, setRating] = useState<ReviewRating | null>(existingReview?.rating || null);
  const [size, setSize] = useState<number>(
    existingReview?.size || oysterAvgSize || SLIDER_CONFIG.DEFAULT_VALUE
  );
  const [body, setBody] = useState<number>(
    existingReview?.body || oysterAvgBody || SLIDER_CONFIG.DEFAULT_VALUE
  );
  const [sweetBrininess, setSweetBrininess] = useState<number>(
    existingReview?.sweetBrininess || oysterAvgSweetBrininess || SLIDER_CONFIG.DEFAULT_VALUE
  );
  const [flavorfulness, setFlavorfulness] = useState<number>(
    existingReview?.flavorfulness || oysterAvgFlavorfulness || SLIDER_CONFIG.DEFAULT_VALUE
  );
  const [creaminess, setCreaminess] = useState<number>(
    existingReview?.creaminess || oysterAvgCreaminess || SLIDER_CONFIG.DEFAULT_VALUE
  );
  const [notes, setNotes] = useState(existingReview?.notes || '');
  const [contributedOrigin, setContributedOrigin] = useState('');
  const [contributedSpecies, setContributedSpecies] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Photo upload state
  const [photos, setPhotos] = useState<string[]>(existingReview?.photoUrls || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Check if we should show origin/species inputs (only when data is missing)
  const showOriginInput = oysterOrigin === 'Unknown';
  const showSpeciesInput = oysterSpecies === 'Unknown';

  // Note: Camera permissions are now requested only when user taps Add Photo button
  // This prevents the intrusive permission prompt on screen load

  const pickImageFromCamera = useCallback(async () => {
    if (photos.length >= PHOTO_LIMITS.MAX_COUNT) {
      Alert.alert('Maximum Photos', `You can only add ${PHOTO_LIMITS.MAX_COUNT} photo per review.`);
      return;
    }

    // Request permission only when needed
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [AddReviewScreen] Error picking image from camera:', error);
      }
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, [photos]);

  const pickImageFromLibrary = async () => {
    if (photos.length >= PHOTO_LIMITS.MAX_COUNT) {
      Alert.alert('Maximum Photos', `You can only add ${PHOTO_LIMITS.MAX_COUNT} photo per review.`);
      return;
    }

    // Request permission only when needed
    const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaStatus.status !== 'granted') {
      Alert.alert('Permission Required', 'Media library permission is required to select photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [AddReviewScreen] Error picking image from library:', error);
      }
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      setUploadingPhoto(true);
      const token = await authStorage.getToken();

      if (!token) {
        Alert.alert('Authentication Required', 'Please log in to upload photos.');
        return;
      }

      console.log('📸 [AddReviewScreen] Starting photo upload:', uri);

      // Create form data
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';

      // Determine MIME type from file extension
      let type = 'image/jpeg'; // default
      const match = /\.(\w+)$/.exec(filename);
      if (match) {
        const ext = match[1].toLowerCase();
        if (ext === 'png') type = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
        else if (ext === 'heic' || ext === 'heif') type = 'image/heic';
        else if (ext === 'webp') type = 'image/webp';
      }

      console.log('📸 [AddReviewScreen] File details:', { filename, type });

      // Append image to form data
      // React Native FormData expects this specific format
      formData.append('image', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: type,
      } as any);

      console.log('📸 [AddReviewScreen] Uploading to backend...');

      // Upload to backend
      // Note: Do NOT set Content-Type header - let FormData set it automatically with boundary
      const response = await fetch('https://oysterette-production.up.railway.app/api/upload/image?folder=reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📸 [AddReviewScreen] Response status:', response.status);
      console.log('📸 [AddReviewScreen] Response headers:', JSON.stringify(response.headers));

      // Check if response is OK (200-299)
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AddReviewScreen] HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📸 [AddReviewScreen] Response data:', JSON.stringify(data));

      if (data.success && data.data && data.data.url) {
        console.log('✅ [AddReviewScreen] Photo uploaded successfully:', data.data.url);
        setPhotos([...photos, data.data.url]);
        Alert.alert('Success', 'Photo uploaded successfully!');
      } else {
        const errorMsg = data.error || 'Upload failed - no URL returned';
        console.error('❌ [AddReviewScreen] Upload failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ [AddReviewScreen] Error uploading photo:', {
        message: error.message,
        error: error,
      });

      // Show user-friendly error message
      let userMessage = 'Failed to upload photo. ';
      if (error.message.includes('429')) {
        userMessage += 'Too many requests. Please wait a moment and try again.';
      } else if (error.message.includes('503')) {
        userMessage += 'Image upload service is temporarily unavailable.';
      } else if (error.message.includes('413')) {
        userMessage += 'Image is too large (max 5MB).';
      } else if (error.message.includes('400')) {
        userMessage += 'Invalid image format. Please use JPEG, PNG, or HEIC.';
      } else if (error.message.includes('401')) {
        userMessage += 'Authentication failed. Please log in again.';
      } else {
        userMessage += `${error.message}\n\nPlease try again or choose a different image.`;
      }

      Alert.alert('Upload Failed', userMessage);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
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

  const handleSubmit = async () => {
    // Validate rating first
    if (!rating) {
      Alert.alert('Rating Required', 'Please select an overall rating for this oyster.');
      return;
    }

    // Check if user is logged in
    const token = await authStorage.getToken();

    // If not logged in and not in update mode, show login options dialog
    if (!token && !isUpdateMode) {
      setShowLoginPrompt(true);
      return;
    }

    // If logged in or updating, proceed with submission
    await submitReview(token);
  };

  const submitReview = async (token: string | null) => {
    try {
      setSubmitting(true);
      console.log(`📝 [AddReviewScreen] ${isUpdateMode ? 'Updating' : 'Submitting'} review for oyster:`, oysterId);

      if (isUpdateMode && existingReview) {
        // Update existing review (requires auth)
        await reviewApi.update(existingReview.id, {
          rating,
          size,
          body,
          sweetBrininess,
          flavorfulness,
          creaminess,
          notes: notes.trim() || undefined,
          photoUrls: photos.length > 0 ? photos : undefined,
        });
        console.log('✅ [AddReviewScreen] Review updated successfully');
      } else {
        // Create new review
        await reviewApi.create({
          oysterId,
          rating,
          size,
          body,
          sweetBrininess,
          flavorfulness,
          creaminess,
          notes: notes.trim() || undefined,
          origin: contributedOrigin.trim() || undefined,
          species: contributedSpecies.trim() || undefined,
          photoUrls: photos.length > 0 ? photos : undefined,
        });
        console.log('✅ [AddReviewScreen] Review submitted successfully');

        // Show XP notification for new reviews
        if (token) {
          showXPGain(10, 'Review submitted');
        }
      }

      // Check for badge level up (only for new reviews)
      if (!isUpdateMode && token) {
        try {
          const oldBadgeLevel = await authStorage.getBadgeLevel();
          const profileResponse = await api.get('/users/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const newBadgeLevel = profileResponse.data?.data?.stats?.badgeLevel;

          if (newBadgeLevel && newBadgeLevel !== oldBadgeLevel) {
            await authStorage.saveBadgeLevel(newBadgeLevel);

            const messages = {
              Trusted: 'You\'ve earned the Trusted Badge! ⭐\nKeep reviewing to become an Expert.',
              Expert: 'You\'ve earned the Expert Badge! 🏆\nYou\'re now a recognized oyster authority!',
            };

            Alert.alert(
              '🎉 Badge Upgrade!',
              messages[newBadgeLevel as keyof typeof messages] || `You're now a ${newBadgeLevel}!`,
              [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
            );
            return;
          } else if (newBadgeLevel) {
            await authStorage.saveBadgeLevel(newBadgeLevel);
          }
        } catch (error) {
          if (__DEV__) {
            console.error('❌ [AddReviewScreen] Error checking badge level:', error);
          }
        }
      }

      Alert.alert(
        isUpdateMode ? 'Review Updated!' : 'Review Submitted!',
        isUpdateMode
          ? 'Your review has been updated successfully.'
          : 'Thank you for sharing your tasting experience.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ [AddReviewScreen] Error submitting review:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorData: error.response?.data,
        headers: error.response?.headers,
      });

      const errorMessage = error.response?.data?.error || error.message || 'Failed to submit review. Please try again.';

      Alert.alert(
        'Submission Failed',
        errorMessage
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveToTempAndNavigate = async (destination: 'Login' | 'Register') => {
    try {
      // Store review temporarily
      await tempReviewsStorage.store({
        oysterId,
        oysterName,
        rating: rating!,
        size,
        body,
        sweetBrininess,
        flavorfulness,
        creaminess,
        notes: notes.trim() || undefined,
        origin: contributedOrigin.trim() || undefined,
        species: contributedSpecies.trim() || undefined,
        photoUrls: photos.length > 0 ? photos : undefined,
      });

      console.log(`📝 [AddReviewScreen] Review saved temporarily, navigating to ${destination}`);

      setShowLoginPrompt(false);
      navigation.navigate(destination);
    } catch (error) {
      console.error('❌ [AddReviewScreen] Failed to save temp review:', error);
      Alert.alert('Error', 'Failed to save review. Please try again.');
    }
  };

  const handlePostAnonymously = async () => {
    setShowLoginPrompt(false);
    await submitReview(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      {/* Save Review Options Dialog */}
      <Portal>
        <Dialog visible={showLoginPrompt} onDismiss={() => setShowLoginPrompt(false)}>
          <Dialog.Icon icon="heart" />
          <Dialog.Title>Save Your Review?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Want to save this review to your profile? Sign in to track all your oyster reviews and build your tasting history.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button
              mode="outlined"
              onPress={handlePostAnonymously}
              style={styles.dialogButton}
            >
              Just Post Review
            </Button>
            <Button
              mode="contained"
              onPress={() => handleSaveToTempAndNavigate('Login')}
              style={styles.dialogButton}
            >
              Sign In to Save
            </Button>
            <Button
              mode="contained"
              onPress={() => handleSaveToTempAndNavigate('Register')}
              style={styles.dialogButton}
              buttonColor={paperTheme.colors.tertiary}
            >
              Sign Up to Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: paperTheme.colors.surface, borderBottomColor: paperTheme.colors.outlineVariant }]}>
          <Text style={[styles.title, { color: paperTheme.colors.onSurface }]}>Review Oyster</Text>
          <Text style={[styles.oysterName, { color: paperTheme.colors.onSurfaceVariant }]}>{oysterName}</Text>
        </View>

        {/* Overall Rating */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>Overall Rating *</Text>
          <View style={styles.ratingOptions}>
            {RATING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.ratingOption,
                  { backgroundColor: paperTheme.colors.surfaceVariant, borderColor: paperTheme.colors.outline },
                  rating === option.value && {
                    backgroundColor: option.color,
                    borderColor: option.color,
                  },
                ]}
                onPress={() => setRating(option.value)}
              >
                <Text style={styles.ratingEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.ratingLabel,
                    { color: paperTheme.colors.onSurface },
                    rating === option.value && styles.ratingLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Attribute Ratings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>Attribute Ratings (Optional)</Text>
          <Text style={[styles.sectionSubtitle, { color: paperTheme.colors.onSurfaceVariant }]}>
            Rate on a scale of 1-10
          </Text>

          {/* Size */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.sliderLabel, { color: paperTheme.colors.onSurface }]}>Size</Text>
              <Text style={[styles.sliderValue, { color: paperTheme.colors.primary }]}>{size}/10</Text>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderMin, { color: paperTheme.colors.onSurfaceVariant }]}>Tiny</Text>
              <Text style={[styles.sliderMax, { color: paperTheme.colors.onSurfaceVariant }]}>Huge</Text>
            </View>
            <Text style={[styles.sliderDescriptor, { color: paperTheme.colors.primary }]}>{getAttributeDescriptor('size', size)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={size}
              onValueChange={setSize}
              minimumTrackTintColor={paperTheme.colors.primary}
              maximumTrackTintColor={paperTheme.colors.surfaceVariant}
              thumbTintColor={paperTheme.colors.primary}
            />
          </View>

          {/* Body */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.sliderLabel, { color: paperTheme.colors.onSurface }]}>Body</Text>
              <Text style={[styles.sliderValue, { color: paperTheme.colors.primary }]}>{body}/10</Text>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderMin, { color: paperTheme.colors.onSurfaceVariant }]}>Thin</Text>
              <Text style={[styles.sliderMax, { color: paperTheme.colors.onSurfaceVariant }]}>Fat</Text>
            </View>
            <Text style={[styles.sliderDescriptor, { color: paperTheme.colors.primary }]}>{getAttributeDescriptor('body', body)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={body}
              onValueChange={setBody}
              minimumTrackTintColor={paperTheme.colors.primary}
              maximumTrackTintColor={paperTheme.colors.surfaceVariant}
              thumbTintColor={paperTheme.colors.primary}
            />
          </View>

          {/* Sweet/Brininess */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.sliderLabel, { color: paperTheme.colors.onSurface }]}>Sweet/Brininess</Text>
              <Text style={[styles.sliderValue, { color: paperTheme.colors.primary }]}>{sweetBrininess}/10</Text>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderMin, { color: paperTheme.colors.onSurfaceVariant }]}>Sweet</Text>
              <Text style={[styles.sliderMax, { color: paperTheme.colors.onSurfaceVariant }]}>Salty</Text>
            </View>
            <Text style={[styles.sliderDescriptor, { color: paperTheme.colors.primary }]}>{getAttributeDescriptor('sweet_brininess', sweetBrininess)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={sweetBrininess}
              onValueChange={setSweetBrininess}
              minimumTrackTintColor={paperTheme.colors.primary}
              maximumTrackTintColor={paperTheme.colors.surfaceVariant}
              thumbTintColor={paperTheme.colors.primary}
            />
          </View>

          {/* Flavorfulness */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.sliderLabel, { color: paperTheme.colors.onSurface }]}>Flavorfulness</Text>
              <Text style={[styles.sliderValue, { color: paperTheme.colors.primary }]}>{flavorfulness}/10</Text>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderMin, { color: paperTheme.colors.onSurfaceVariant }]}>Boring</Text>
              <Text style={[styles.sliderMax, { color: paperTheme.colors.onSurfaceVariant }]}>Bold</Text>
            </View>
            <Text style={[styles.sliderDescriptor, { color: paperTheme.colors.primary }]}>{getAttributeDescriptor('flavorfulness', flavorfulness)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={flavorfulness}
              onValueChange={setFlavorfulness}
              minimumTrackTintColor={paperTheme.colors.primary}
              maximumTrackTintColor={paperTheme.colors.surfaceVariant}
              thumbTintColor={paperTheme.colors.primary}
            />
          </View>

          {/* Creaminess */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.sliderLabel, { color: paperTheme.colors.onSurface }]}>Creaminess</Text>
              <Text style={[styles.sliderValue, { color: paperTheme.colors.primary }]}>{creaminess}/10</Text>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderMin, { color: paperTheme.colors.onSurfaceVariant }]}>None</Text>
              <Text style={[styles.sliderMax, { color: paperTheme.colors.onSurfaceVariant }]}>Creamy</Text>
            </View>
            <Text style={[styles.sliderDescriptor, { color: paperTheme.colors.primary }]}>{getAttributeDescriptor('creaminess', creaminess)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={creaminess}
              onValueChange={setCreaminess}
              minimumTrackTintColor={paperTheme.colors.primary}
              maximumTrackTintColor={paperTheme.colors.surfaceVariant}
              thumbTintColor={paperTheme.colors.primary}
            />
          </View>
        </View>

        {/* Notes */}
        <Surface style={styles.section} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Tasting Notes (Optional)</Text>
          <TextInput
            mode="outlined"
            placeholder="Share your thoughts about this oyster..."
            placeholderTextColor={paperTheme.colors.onSurfaceVariant}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />
        </Surface>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>📸 Photo (Optional, max 1)</Text>

          {/* Photo Grid */}
          {photos.length > 0 && (
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photoThumbnail} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add Photo Button */}
          {photos.length < 1 && (
            <TouchableOpacity
              style={[styles.addPhotoButton, { backgroundColor: paperTheme.colors.surfaceVariant, borderColor: paperTheme.colors.outline }]}
              onPress={showPhotoOptions}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" animating={true} />
              ) : (
                <>
                  <Text style={styles.addPhotoIcon}>📷</Text>
                  <Text style={[styles.addPhotoText, { color: paperTheme.colors.primary }]}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Origin (only if missing) */}
        {showOriginInput && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>📍 Add Origin (Optional)</Text>
            <Text style={[styles.sectionSubtitle, { color: paperTheme.colors.onSurfaceVariant }]}>
              Help us complete this entry! Where is this oyster from?
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: paperTheme.colors.surfaceVariant, borderColor: paperTheme.colors.outline, color: paperTheme.colors.onSurface }]}
              placeholder="e.g., Washington, Tomales Bay, British Columbia"
              placeholderTextColor={paperTheme.colors.onSurfaceVariant}
              value={contributedOrigin}
              onChangeText={setContributedOrigin}
            />
          </View>
        )}

        {/* Species (only if missing) */}
        {showSpeciesInput && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>🔬 Add Species (Optional)</Text>
            <Text style={[styles.sectionSubtitle, { color: paperTheme.colors.onSurfaceVariant }]}>
              Help us complete this entry! What species is this?
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: paperTheme.colors.surfaceVariant, borderColor: paperTheme.colors.outline, color: paperTheme.colors.onSurface }]}
              placeholder="e.g., Crassostrea gigas, Crassostrea virginica"
              placeholderTextColor={paperTheme.colors.onSurfaceVariant}
              value={contributedSpecies}
              onChangeText={setContributedSpecies}
            />
          </View>
        )}

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          icon="check-circle"
          buttonColor={paperTheme.colors.tertiary}
        >
          {isUpdateMode ? 'Update Review' : 'Submit Review'}
        </Button>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  oysterName: {
    fontSize: 18,
  },
  section: {
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 15,
  },
  ratingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ratingOption: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
  },
  ratingEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingLabelActive: {
    color: '#fff',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  sliderMin: {
    fontSize: 12,
  },
  sliderMax: {
    fontSize: 12,
  },
  sliderDescriptor: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  slider: {
    width: '100%',
    height: 50,
  },
  notesInput: {
    minHeight: 100,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  submitButton: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  photoContainer: {
    width: 100,
    height: 100,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
  },
  addPhotoIcon: {
    fontSize: 24,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dialogActions: {
    flexDirection: 'column',
    gap: 8,
    padding: 16,
  },
  dialogButton: {
    width: '100%',
  },
});
