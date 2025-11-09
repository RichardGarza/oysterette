/**
 * EditReviewScreen
 *
 * Review edit form with pre-filled data and update functionality.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { TextInput, Button, Card, Text, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { reviewApi } from '../services/api';
import { ReviewRating, Review } from '../types/Oyster';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();

  const [rating, setRating] = useState<ReviewRating>(review.rating);
  const [size, setSize] = useState<number>(review.size ?? SLIDER_CONFIG.DEFAULT_VALUE);
  const [body, setBody] = useState<number>(review.body ?? SLIDER_CONFIG.DEFAULT_VALUE);
  const [sweetBrininess, setSweetBrininess] = useState<number>(review.sweetBrininess ?? SLIDER_CONFIG.DEFAULT_VALUE);
  const [flavorfulness, setFlavorfulness] = useState<number>(review.flavorfulness ?? SLIDER_CONFIG.DEFAULT_VALUE);
  const [creaminess, setCreaminess] = useState<number>(review.creaminess ?? SLIDER_CONFIG.DEFAULT_VALUE);
  const [notes, setNotes] = useState(review.notes || '');
  const [submitting, setSubmitting] = useState(false);

  if (__DEV__) {
    console.log('🔍 [EditReview] Review data:', {
      size: review.size,
      body: review.body,
      sweetBrininess: review.sweetBrininess,
      flavorfulness: review.flavorfulness,
      creaminess: review.creaminess,
    });
  }

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.header}>
          <Card.Content>
            <Text variant="headlineMedium" style={{ color: theme.colors.text }}>Edit Review</Text>
            <Text variant="titleMedium" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
              {review.oyster?.name || 'Unknown Oyster'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: theme.colors.text }}>Overall Rating *</Text>
            <View style={styles.ratingOptions}>
              {RATING_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  mode={rating === option.value ? 'contained' : 'outlined'}
                  onPress={() => setRating(option.value)}
                  style={[
                    styles.ratingButton,
                    rating === option.value && { backgroundColor: option.color }
                  ]}
                  labelStyle={styles.ratingLabel}
                  contentStyle={styles.ratingContent}
                >
                  {option.emoji} {option.label}
                </Button>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.text }}>Attribute Ratings (Optional)</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary, marginBottom: 16 }}>
              Rate on a scale of 1-10
            </Text>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text variant="bodyLarge" style={{ color: theme.colors.text }}>Size</Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {size}/10
                </Text>
              </View>
              <View style={styles.sliderLabels}>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Tiny</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Huge</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={SLIDER_CONFIG.MIN_VALUE}
                maximumValue={SLIDER_CONFIG.MAX_VALUE}
                step={SLIDER_CONFIG.STEP}
                value={size}
                onValueChange={setSize}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
              />
            </View>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text variant="bodyLarge" style={{ color: theme.colors.text }}>Body</Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {body}/10
                </Text>
              </View>
              <View style={styles.sliderLabels}>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Thin</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Fat</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={SLIDER_CONFIG.MIN_VALUE}
                maximumValue={SLIDER_CONFIG.MAX_VALUE}
                step={SLIDER_CONFIG.STEP}
                value={body}
                onValueChange={setBody}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
              />
            </View>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text variant="bodyLarge" style={{ color: theme.colors.text }}>Sweet/Brininess</Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {sweetBrininess}/10
                </Text>
              </View>
              <View style={styles.sliderLabels}>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Sweet</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Salty</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={SLIDER_CONFIG.MIN_VALUE}
                maximumValue={SLIDER_CONFIG.MAX_VALUE}
                step={SLIDER_CONFIG.STEP}
                value={sweetBrininess}
                onValueChange={setSweetBrininess}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
              />
            </View>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text variant="bodyLarge" style={{ color: theme.colors.text }}>Flavorfulness</Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {flavorfulness}/10
                </Text>
              </View>
              <View style={styles.sliderLabels}>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Boring</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Bold</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={SLIDER_CONFIG.MIN_VALUE}
                maximumValue={SLIDER_CONFIG.MAX_VALUE}
                step={SLIDER_CONFIG.STEP}
                value={flavorfulness}
                onValueChange={setFlavorfulness}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
              />
            </View>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text variant="bodyLarge" style={{ color: theme.colors.text }}>Creaminess</Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {creaminess}/10
                </Text>
              </View>
              <View style={styles.sliderLabels}>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>None</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>Creamy</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={SLIDER_CONFIG.MIN_VALUE}
                maximumValue={SLIDER_CONFIG.MAX_VALUE}
                step={SLIDER_CONFIG.STEP}
                value={creaminess}
                onValueChange={setCreaminess}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: theme.colors.text }}>
              Tasting Notes (Optional)
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Share your thoughts about this oyster..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={styles.notesInput}
            />
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={submitting}
            loading={submitting}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            Update Review
          </Button>
        </View>
      </ScrollView>
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
    marginBottom: 8,
  },
  section: {
    marginBottom: 8,
  },
  ratingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    minWidth: '45%',
  },
  ratingLabel: {
    fontSize: 14,
  },
  ratingContent: {
    paddingVertical: 8,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: SLIDER_CONFIG.HEIGHT,
  },
  notesInput: {
    minHeight: 100,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  submitButton: {
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});
