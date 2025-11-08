/**
 * EditReviewScreen
 *
 * Review edit form with pre-filled data and update functionality.
 */

import React, { useState, useCallback } from 'react';
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
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { reviewApi } from '../services/api';
import { ReviewRating, Review } from '../types/Oyster';
import { RootStackParamList } from '../navigation/types';

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
  HEIGHT: 40,
  MIN_TRACK_COLOR: '#3498db',
  MAX_TRACK_COLOR: '#e0e0e0',
} as const;

const COLORS = {
  BACKGROUND: '#f5f5f5',
  WHITE: '#fff',
  BORDER: '#e0e0e0',
  TEXT_PRIMARY: '#2c3e50',
  TEXT_SECONDARY: '#7f8c8d',
  PRIMARY: '#3498db',
  DISABLED: '#95a5a6',
} as const;

// ============================================================================
// TYPES
// ============================================================================

type EditReviewScreenRouteProp = RouteProp<RootStackParamList, 'EditReview'>;
type EditReviewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditReview'>;

// ============================================================================
// COMPONENT
// ============================================================================

export default function EditReviewScreen() {
  const route = useRoute<EditReviewScreenRouteProp>();
  const navigation = useNavigation<EditReviewScreenNavigationProp>();
  const { review } = route.params;

  const [rating, setRating] = useState<ReviewRating>(review.rating);
  const [size, setSize] = useState<number>(review.size || SLIDER_CONFIG.DEFAULT_VALUE);
  const [body, setBody] = useState<number>(review.body || SLIDER_CONFIG.DEFAULT_VALUE);
  const [sweetBrininess, setSweetBrininess] = useState<number>(review.sweetBrininess || SLIDER_CONFIG.DEFAULT_VALUE);
  const [flavorfulness, setFlavorfulness] = useState<number>(review.flavorfulness || SLIDER_CONFIG.DEFAULT_VALUE);
  const [creaminess, setCreaminess] = useState<number>(review.creaminess || SLIDER_CONFIG.DEFAULT_VALUE);
  const [notes, setNotes] = useState(review.notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
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
      if (__DEV__) {
        console.error('❌ [EditReviewScreen] Error updating review:', error);
      }
      Alert.alert(
        'Update Failed',
        error.response?.data?.error || 'Failed to update review. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [rating, size, body, sweetBrininess, flavorfulness, creaminess, notes, review.id, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Review</Text>
          <Text style={styles.oysterName}>{review.oyster?.name || 'Unknown Oyster'}</Text>
        </View>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attribute Ratings (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Rate on a scale of 1-10
          </Text>

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
              minimumValue={SLIDER_CONFIG.MIN_VALUE}
              maximumValue={SLIDER_CONFIG.MAX_VALUE}
              step={SLIDER_CONFIG.STEP}
              value={size}
              onValueChange={setSize}
              minimumTrackTintColor={SLIDER_CONFIG.MIN_TRACK_COLOR}
              maximumTrackTintColor={SLIDER_CONFIG.MAX_TRACK_COLOR}
            />
          </View>

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
              minimumValue={SLIDER_CONFIG.MIN_VALUE}
              maximumValue={SLIDER_CONFIG.MAX_VALUE}
              step={SLIDER_CONFIG.STEP}
              value={body}
              onValueChange={setBody}
              minimumTrackTintColor={SLIDER_CONFIG.MIN_TRACK_COLOR}
              maximumTrackTintColor={SLIDER_CONFIG.MAX_TRACK_COLOR}
            />
          </View>

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
              minimumValue={SLIDER_CONFIG.MIN_VALUE}
              maximumValue={SLIDER_CONFIG.MAX_VALUE}
              step={SLIDER_CONFIG.STEP}
              value={sweetBrininess}
              onValueChange={setSweetBrininess}
              minimumTrackTintColor={SLIDER_CONFIG.MIN_TRACK_COLOR}
              maximumTrackTintColor={SLIDER_CONFIG.MAX_TRACK_COLOR}
            />
          </View>

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
              minimumValue={SLIDER_CONFIG.MIN_VALUE}
              maximumValue={SLIDER_CONFIG.MAX_VALUE}
              step={SLIDER_CONFIG.STEP}
              value={flavorfulness}
              onValueChange={setFlavorfulness}
              minimumTrackTintColor={SLIDER_CONFIG.MIN_TRACK_COLOR}
              maximumTrackTintColor={SLIDER_CONFIG.MAX_TRACK_COLOR}
            />
          </View>

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
              minimumValue={SLIDER_CONFIG.MIN_VALUE}
              maximumValue={SLIDER_CONFIG.MAX_VALUE}
              step={SLIDER_CONFIG.STEP}
              value={creaminess}
              onValueChange={setCreaminess}
              minimumTrackTintColor={SLIDER_CONFIG.MIN_TRACK_COLOR}
              maximumTrackTintColor={SLIDER_CONFIG.MAX_TRACK_COLOR}
            />
          </View>
        </View>

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

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.WHITE} />
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
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 5,
  },
  oysterName: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
  },
  section: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
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
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
  },
  ratingEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  ratingLabelActive: {
    color: COLORS.WHITE,
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
    color: COLORS.TEXT_PRIMARY,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  sliderMin: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  sliderMax: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  slider: {
    width: '100%',
    height: SLIDER_CONFIG.HEIGHT,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: COLORS.BACKGROUND,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.DISABLED,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
