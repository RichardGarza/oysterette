/**
 * AddReviewScreen
 *
 * Review creation and update form with 5 attribute sliders and rating selection.
 *
 * Features:
 * - Overall rating selection (Love It, Like It, Meh, Whatever) with color-coded buttons
 * - 5 attribute sliders with dynamic word labels:
 *   - Size (Tiny → Huge)
 *   - Body (Thin → Fat)
 *   - Sweet/Brininess (Sweet → Salty)
 *   - Flavorfulness (Boring → Bold)
 *   - Creaminess (None → Creamy)
 * - Descriptive labels above sliders (e.g., "Huge", "Baddy McFatty") from getAttributeDescriptor()
 * - Optional tasting notes text area
 * - Login prompt modal (if not authenticated)
 * - KeyboardAvoidingView for iOS keyboard handling
 * - Update mode support (pre-fills existing review data)
 * - Theme-aware styling
 *
 * Modes:
 * - Create: New review for oyster (requires auth)
 * - Update: Edit existing review (existingReview param provided)
 *
 * Rating Options:
 * - LOVE_IT: ❤️ (Red #e74c3c)
 * - LIKE_IT: 👍 (Green #27ae60)
 * - MEH: 😐 (Orange #f39c12)
 * - WHATEVER: 🤷 (Gray #95a5a6)
 *
 * Sliders:
 * - Range: 1-10 (integer steps)
 * - Height: 50px for larger touch target
 * - Dynamic word label shown above slider (18px bold)
 * - Min/max labels below header (e.g., "Tiny" / "Huge")
 * - Primary color track/thumb
 *
 * Validation:
 * - Overall rating required (shows alert if missing)
 * - Attribute ratings optional (defaults to 5)
 * - Notes optional (max 1000 chars enforced by backend)
 *
 * Auth Flow:
 * - Checks token on submit
 * - If no token: Shows custom modal with X button
 * - Modal offers Sign Up or Log In buttons
 * - Redirects to appropriate auth screen
 *
 * Submit Flow:
 * 1. Validates overall rating selected
 * 2. Checks auth token
 * 3. Calls reviewApi.create() or reviewApi.update()
 * 4. Shows success alert
 * 5. Navigates back to detail screen
 * 6. Detail screen refreshes to show new/updated review
 *
 * State:
 * - rating: Overall ReviewRating enum value
 * - size, body, sweetBrininess, flavorfulness, creaminess: 1-10 integers
 * - notes: Optional string
 * - submitting: Boolean for loading state
 * - showLoginPrompt: Modal visibility toggle
 * - isUpdateMode: Determined by existingReview param presence
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { AddReviewScreenRouteProp, AddReviewScreenNavigationProp } from '../navigation/types';
import { reviewApi } from '../services/api';
import { authStorage } from '../services/auth';
import { ReviewRating } from '../types/Oyster';
import { getAttributeDescriptor } from '../utils/ratingUtils';

const RATING_OPTIONS: { label: string; value: ReviewRating; emoji: string; color: string }[] = [
  { label: 'Love It', value: 'LOVE_IT', emoji: '❤️', color: '#e74c3c' },
  { label: 'Like It', value: 'LIKE_IT', emoji: '👍', color: '#27ae60' },
  { label: 'Meh', value: 'MEH', emoji: '😐', color: '#f39c12' },
  { label: 'Whatever', value: 'WHATEVER', emoji: '🤷', color: '#95a5a6' },
];

export default function AddReviewScreen() {
  const route = useRoute<AddReviewScreenRouteProp>();
  const navigation = useNavigation<AddReviewScreenNavigationProp>();
  const { oysterId, oysterName, oysterOrigin, oysterSpecies, existingReview } = route.params;
  const isUpdateMode = !!existingReview;

  const [rating, setRating] = useState<ReviewRating | null>(existingReview?.rating || null);
  const [size, setSize] = useState<number>(existingReview?.size || 5);
  const [body, setBody] = useState<number>(existingReview?.body || 5);
  const [sweetBrininess, setSweetBrininess] = useState<number>(existingReview?.sweetBrininess || 5);
  const [flavorfulness, setFlavorfulness] = useState<number>(existingReview?.flavorfulness || 5);
  const [creaminess, setCreaminess] = useState<number>(existingReview?.creaminess || 5);
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

  // Request camera permissions on mount
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

  const pickImageFromCamera = async () => {
    if (photos.length >= 5) {
      Alert.alert('Maximum Photos', 'You can only add up to 5 photos per review.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from camera:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImageFromLibrary = async () => {
    if (photos.length >= 5) {
      Alert.alert('Maximum Photos', 'You can only add up to 5 photos per review.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from library:', error);
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
      const response = await fetch('https://oysterette-production.up.railway.app/api/upload/image?folder=reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        setPhotos([...photos, data.data.url]);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Upload Failed', 'Failed to upload photo. Please try again.');
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
    // Check if user is logged in
    const token = await authStorage.getToken();
    if (!token) {
      setShowLoginPrompt(true);
      return;
    }

    if (!rating) {
      Alert.alert('Rating Required', 'Please select an overall rating for this oyster.');
      return;
    }

    try {
      setSubmitting(true);
      console.log(`📝 [AddReviewScreen] ${isUpdateMode ? 'Updating' : 'Submitting'} review for oyster:`, oysterId);

      if (isUpdateMode && existingReview) {
        // Update existing review
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
        // Create new review (with optional origin/species contributions)
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Login Prompt Modal */}
      <Modal
        visible={showLoginPrompt}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLoginPrompt(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLoginPrompt(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Login Required</Text>
            <Text style={styles.modalMessage}>
              You need to be logged in to submit a review. Sign up or log in now to share your tasting experience!
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSignUpButton]}
                onPress={() => {
                  setShowLoginPrompt(false);
                  navigation.navigate('Register');
                }}
              >
                <Text style={styles.modalButtonText}>Sign Up</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalLoginButton]}
                onPress={() => {
                  setShowLoginPrompt(false);
                  navigation.navigate('Login');
                }}
              >
                <Text style={styles.modalButtonText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Review Oyster</Text>
          <Text style={styles.oysterName}>{oysterName}</Text>
        </View>

        {/* Overall Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Rating *</Text>
          <View style={styles.ratingOptions}>
            {RATING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.ratingOption,
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
          <Text style={styles.sectionTitle}>Attribute Ratings (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Rate on a scale of 1-10
          </Text>

          {/* Size */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Size</Text>
              <Text style={styles.sliderValue}>{size}/10</Text>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMin}>Tiny</Text>
              <Text style={styles.sliderMax}>Huge</Text>
            </View>
            <Text style={styles.sliderDescriptor}>{getAttributeDescriptor('size', size)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={size}
              onValueChange={setSize}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor="#3498db"
            />
          </View>

          {/* Body */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Body</Text>
              <Text style={styles.sliderValue}>{body}/10</Text>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMin}>Thin</Text>
              <Text style={styles.sliderMax}>Fat</Text>
            </View>
            <Text style={styles.sliderDescriptor}>{getAttributeDescriptor('body', body)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={body}
              onValueChange={setBody}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor="#3498db"
            />
          </View>

          {/* Sweet/Brininess */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Sweet/Brininess</Text>
              <Text style={styles.sliderValue}>{sweetBrininess}/10</Text>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMin}>Sweet</Text>
              <Text style={styles.sliderMax}>Salty</Text>
            </View>
            <Text style={styles.sliderDescriptor}>{getAttributeDescriptor('sweet_brininess', sweetBrininess)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={sweetBrininess}
              onValueChange={setSweetBrininess}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor="#3498db"
            />
          </View>

          {/* Flavorfulness */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Flavorfulness</Text>
              <Text style={styles.sliderValue}>{flavorfulness}/10</Text>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMin}>Boring</Text>
              <Text style={styles.sliderMax}>Bold</Text>
            </View>
            <Text style={styles.sliderDescriptor}>{getAttributeDescriptor('flavorfulness', flavorfulness)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={flavorfulness}
              onValueChange={setFlavorfulness}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor="#3498db"
            />
          </View>

          {/* Creaminess */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Creaminess</Text>
              <Text style={styles.sliderValue}>{creaminess}/10</Text>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMin}>None</Text>
              <Text style={styles.sliderMax}>Creamy</Text>
            </View>
            <Text style={styles.sliderDescriptor}>{getAttributeDescriptor('creaminess', creaminess)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={creaminess}
              onValueChange={setCreaminess}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor="#3498db"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasting Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Share your thoughts about this oyster..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Photos (Optional, max 5)</Text>

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
          {photos.length < 5 && (
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={showPhotoOptions}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#3498db" />
              ) : (
                <>
                  <Text style={styles.addPhotoIcon}>📷</Text>
                  <Text style={styles.addPhotoText}>
                    {photos.length === 0 ? 'Add Photos' : 'Add Another Photo'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Origin (only if missing) */}
        {showOriginInput && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Add Origin (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Help us complete this entry! Where is this oyster from?
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Washington, Tomales Bay, British Columbia"
              value={contributedOrigin}
              onChangeText={setContributedOrigin}
            />
          </View>
        )}

        {/* Species (only if missing) */}
        {showSpeciesInput && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔬 Add Species (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Help us complete this entry! What species is this?
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Crassostrea gigas, Crassostrea virginica"
              value={contributedSpecies}
              onChangeText={setContributedSpecies}
            />
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isUpdateMode ? 'Update Review' : 'Submit Review'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  oysterName: {
    fontSize: 18,
    color: '#7f8c8d',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
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
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  ratingEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
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
    color: '#2c3e50',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  sliderMin: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  sliderMax: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  sliderDescriptor: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3498db',
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#f5f5f5',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSignUpButton: {
    backgroundColor: '#27ae60',
  },
  modalLoginButton: {
    backgroundColor: '#3498db',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
    gap: 8,
  },
  addPhotoIcon: {
    fontSize: 24,
  },
  addPhotoText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
});
