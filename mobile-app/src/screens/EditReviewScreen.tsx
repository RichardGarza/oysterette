/**
 * EditReviewScreen
 *
 * Standalone review edit screen (accessed via ReviewCard edit action).
 *
 * Features:
 * - Pre-fills all form fields with existing review data
 * - Same UI as AddReviewScreen (rating buttons + 5 sliders + notes)
 * - Updates existing review via reviewApi.update()
 * - No duplicate detection (already editing existing review)
 * - Shows success alert after update
 * - Navigates back to detail screen
 * - Static styling (not theme-aware)
 *
 * Form Fields:
 * - Overall rating: LOVE_IT, LIKE_IT, MEH, WHATEVER (pre-selected)
 * - Size slider: 1-10 (pre-filled)
 * - Body slider: 1-10 (pre-filled)
 * - Sweet/Brininess slider: 1-10 (pre-filled)
 * - Flavorfulness slider: 1-10 (pre-filled)
 * - Creaminess slider: 1-10 (pre-filled)
 * - Notes textarea: Optional (pre-filled)
 *
 * Update Flow:
 * 1. Receives review object from route params
 * 2. Pre-populates all state with review data
 * 3. User modifies fields
 * 4. Validates overall rating selected
 * 5. Calls reviewApi.update(reviewId, updatedData)
 * 6. Shows success alert
 * 7. Navigates back (goes to OysterDetailScreen)
 * 8. OysterDetailScreen re-fetches data automatically
 *
 * Differences from AddReviewScreen:
 * - No theme support (uses static colors)
 * - No login prompt modal (assumes authenticated)
 * - No existingReview/isUpdateMode logic (always update mode)
 * - Button text: "Update Review" (not conditional)
 * - No dynamic word labels above sliders (missing getAttributeDescriptor)
 * - Smaller slider height (40px vs 50px)
 *
 * State:
 * - rating, size, body, sweetBrininess, flavorfulness, creaminess, notes: Pre-filled from review object
 * - submitting: Boolean for loading state
 *
 * Navigation:
 * - Passed review object from ProfileScreen or OysterDetailScreen
 * - Uses navigation.goBack() after successful update
 */

import React, { useState } from 'react';
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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { reviewApi } from '../services/api';
import { ReviewRating, Review } from '../types/Oyster';

const RATING_OPTIONS: { label: string; value: ReviewRating; emoji: string; color: string }[] = [
  { label: 'Love It', value: 'LOVE_IT', emoji: '❤️', color: '#e74c3c' },
  { label: 'Like It', value: 'LIKE_IT', emoji: '👍', color: '#27ae60' },
  { label: 'Meh', value: 'MEH', emoji: '😐', color: '#f39c12' },
  { label: 'Whatever', value: 'WHATEVER', emoji: '🤷', color: '#95a5a6' },
];

export default function EditReviewScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { review } = route.params as { review: Review };

  const [rating, setRating] = useState<ReviewRating>(review.rating);
  const [size, setSize] = useState<number>(review.size || 5);
  const [body, setBody] = useState<number>(review.body || 5);
  const [sweetBrininess, setSweetBrininess] = useState<number>(review.sweetBrininess || 5);
  const [flavorfulness, setFlavorfulness] = useState<number>(review.flavorfulness || 5);
  const [creaminess, setCreaminess] = useState<number>(review.creaminess || 5);
  const [notes, setNotes] = useState(review.notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Rating Required', 'Please select an overall rating for this oyster.');
      return;
    }

    try {
      setSubmitting(true);

      await reviewApi.update(review.id, {
        rating,
        size,
        body,
        sweetBrininess,
        flavorfulness,
        creaminess,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Review Updated!',
        'Your review has been successfully updated.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating review:', error);
      Alert.alert(
        'Update Failed',
        error.response?.data?.error || 'Failed to update review. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Review</Text>
          <Text style={styles.oysterName}>{review.oyster?.name || 'Unknown Oyster'}</Text>
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
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={size}
              onValueChange={setSize}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#e0e0e0"
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
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={body}
              onValueChange={setBody}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#e0e0e0"
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
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={sweetBrininess}
              onValueChange={setSweetBrininess}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#e0e0e0"
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
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={flavorfulness}
              onValueChange={setFlavorfulness}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#e0e0e0"
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
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={creaminess}
              onValueChange={setCreaminess}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#e0e0e0"
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

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Update Review</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  slider: {
    width: '100%',
    height: 40,
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
  submitButton: {
    backgroundColor: '#3498db',
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
});
