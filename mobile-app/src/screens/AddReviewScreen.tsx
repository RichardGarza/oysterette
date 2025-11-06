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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { AddReviewScreenRouteProp, AddReviewScreenNavigationProp } from '../navigation/types';
import { reviewApi } from '../services/api';
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
  const { oysterId, oysterName, existingReview } = route.params;
  const isUpdateMode = !!existingReview;

  const [rating, setRating] = useState<ReviewRating | null>(existingReview?.rating || null);
  const [size, setSize] = useState<number>(existingReview?.size || 5);
  const [body, setBody] = useState<number>(existingReview?.body || 5);
  const [sweetBrininess, setSweetBrininess] = useState<number>(existingReview?.sweetBrininess || 5);
  const [flavorfulness, setFlavorfulness] = useState<number>(existingReview?.flavorfulness || 5);
  const [creaminess, setCreaminess] = useState<number>(existingReview?.creaminess || 5);
  const [notes, setNotes] = useState(existingReview?.notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
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
});
