/**
 * SetFlavorProfileScreen
 *
 * Allows users to set their baseline flavor preferences for recommendations.
 *
 * Features:
 * - 5 attribute sliders (size, body, sweetness, flavor, creaminess)
 * - Dynamic word labels above each slider (e.g., "Huge", "Baddy McFatty")
 * - Save button with loading state
 * - Theme-aware styling
 * - Auto-navigation on success
 * - Can be accessed before any reviews
 *
 * Purpose:
 * - Helps users get personalized recommendations immediately
 * - No need to review oysters first
 * - Baseline updates automatically with each positive review (LIKE_IT, LOVE_IT)
 *
 * Flow:
 * 1. User adjusts 5 sliders to describe their ideal oyster
 * 2. Taps "Save Flavor Profile"
 * 3. Sends to backend: PUT /api/users/flavor-profile
 * 4. Backend stores baseline in user record
 * 5. Recommendations now use this baseline
 * 6. Navigate back to HomeScreen
 *
 * State:
 * - size, body, sweetBrininess, flavorfulness, creaminess (all 1-10)
 * - saving: Loading state during API call
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { userApi } from '../services/api';
import { getAttributeDescriptor } from '../utils/ratingUtils';

export default function SetFlavorProfileScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = createStyles(theme.colors);

  // Attribute states (default to middle value: 5)
  const [size, setSize] = useState(5);
  const [body, setBody] = useState(5);
  const [sweetBrininess, setSweetBrininess] = useState(5);
  const [flavorfulness, setFlavorfulness] = useState(5);
  const [creaminess, setCreaminess] = useState(5);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      await userApi.setFlavorProfile({
        size,
        body,
        sweetBrininess,
        flavorfulness,
        creaminess,
      });

      Alert.alert('Success', 'Your flavor profile has been saved! You should now see personalized recommendations.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Error saving flavor profile:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to save flavor profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Set Your Flavor Profile</Text>
          <Text style={styles.subtitle}>
            Tell us your ideal oyster attributes to get personalized recommendations
          </Text>
        </View>

        {/* Size Slider */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Preferred Size</Text>
          <Text style={styles.sliderValue}>{getAttributeDescriptor('size', size)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={size}
            onValueChange={setSize}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Tiny</Text>
            <Text style={styles.sliderLabelText}>Huge</Text>
          </View>
        </View>

        {/* Body Slider */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Preferred Body</Text>
          <Text style={styles.sliderValue}>{getAttributeDescriptor('body', body)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={body}
            onValueChange={setBody}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Thin</Text>
            <Text style={styles.sliderLabelText}>Baddy McFatty</Text>
          </View>
        </View>

        {/* Sweet/Brininess Slider */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Preferred Sweet/Brininess</Text>
          <Text style={styles.sliderValue}>{getAttributeDescriptor('sweetBrininess', sweetBrininess)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={sweetBrininess}
            onValueChange={setSweetBrininess}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Very Sweet</Text>
            <Text style={styles.sliderLabelText}>Very Salty</Text>
          </View>
        </View>

        {/* Flavorfulness Slider */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Preferred Flavorfulness</Text>
          <Text style={styles.sliderValue}>{getAttributeDescriptor('flavorfulness', flavorfulness)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={flavorfulness}
            onValueChange={setFlavorfulness}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Boring</Text>
            <Text style={styles.sliderLabelText}>Extremely Bold</Text>
          </View>
        </View>

        {/* Creaminess Slider */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Preferred Creaminess</Text>
          <Text style={styles.sliderValue}>{getAttributeDescriptor('creaminess', creaminess)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={creaminess}
            onValueChange={setCreaminess}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>None</Text>
            <Text style={styles.sliderLabelText}>Nothing But Cream</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Flavor Profile</Text>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Your flavor profile will be automatically updated each time you give a positive
            review (Like It or Love It) to an oyster.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 30,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    sliderContainer: {
      marginBottom: 32,
    },
    sliderLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    sliderValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 12,
      height: 50,
    },
    slider: {
      width: '100%',
      height: 50,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    sliderLabelText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '600',
    },
    infoBox: {
      backgroundColor: `${colors.primary}15`,
      borderRadius: 12,
      padding: 16,
    },
    infoText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
  });
