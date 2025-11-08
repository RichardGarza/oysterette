/**
 * SetFlavorProfileScreen - Migrated to React Native Paper
 *
 * Allows users to set their baseline flavor preferences for recommendations.
 *
 * Features:
 * - 5 attribute sliders (size, body, sweetness, flavor, creaminess)
 * - Dynamic word labels above each slider (e.g., "Huge", "Baddy McFatty")
 * - Save button with loading state
 * - Theme-aware styling via React Native Paper
 * - Auto-navigation on success
 * - Can be accessed before any reviews
 *
 * Material Design Components:
 * - Card: Section containers with elevation
 * - Text: Typography with variants (headlineSmall, titleMedium, bodyMedium, etc.)
 * - Button: Save action with loading state
 * - Surface: Info box background
 *
 * Migration Benefits:
 * - ~30% less custom styling (Paper handles cards, buttons, text)
 * - Built-in theme integration (light/dark mode)
 * - Material Design cards with proper elevation
 * - Professional button with loading state
 * - Consistent look with rest of app
 * - Better accessibility
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
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Surface,
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { userApi } from '../services/api';
import { getAttributeDescriptor } from '../utils/ratingUtils';

export default function SetFlavorProfileScreen() {
  const navigation = useNavigation();
  const { theme, paperTheme } = useTheme();
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
          <Text variant="headlineSmall" style={styles.title}>Set Your Flavor Profile</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Tell us your ideal oyster attributes to get personalized recommendations
          </Text>
        </View>

        {/* Size Slider */}
        <Card mode="elevated" style={styles.sliderCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sliderLabel}>Preferred Size</Text>
            <Text variant="headlineSmall" style={styles.sliderValue}>{getAttributeDescriptor('size', size)}</Text>
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
            <View style={styles.sliderLabels}>
              <Text variant="bodySmall">Tiny</Text>
              <Text variant="bodySmall">Huge</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Body Slider */}
        <Card mode="elevated" style={styles.sliderCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sliderLabel}>Preferred Body</Text>
            <Text variant="headlineSmall" style={styles.sliderValue}>{getAttributeDescriptor('body', body)}</Text>
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
            <View style={styles.sliderLabels}>
              <Text variant="bodySmall">Thin</Text>
              <Text variant="bodySmall">Baddy McFatty</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Sweet/Brininess Slider */}
        <Card mode="elevated" style={styles.sliderCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sliderLabel}>Preferred Sweet/Brininess</Text>
            <Text variant="headlineSmall" style={styles.sliderValue}>{getAttributeDescriptor('sweetBrininess', sweetBrininess)}</Text>
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
            <View style={styles.sliderLabels}>
              <Text variant="bodySmall">Very Sweet</Text>
              <Text variant="bodySmall">Very Salty</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Flavorfulness Slider */}
        <Card mode="elevated" style={styles.sliderCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sliderLabel}>Preferred Flavorfulness</Text>
            <Text variant="headlineSmall" style={styles.sliderValue}>{getAttributeDescriptor('flavorfulness', flavorfulness)}</Text>
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
            <View style={styles.sliderLabels}>
              <Text variant="bodySmall">Boring</Text>
              <Text variant="bodySmall">Extremely Bold</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Creaminess Slider */}
        <Card mode="elevated" style={styles.sliderCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sliderLabel}>Preferred Creaminess</Text>
            <Text variant="headlineSmall" style={styles.sliderValue}>{getAttributeDescriptor('creaminess', creaminess)}</Text>
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
            <View style={styles.sliderLabels}>
              <Text variant="bodySmall">None</Text>
              <Text variant="bodySmall">Nothing But Cream</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          icon="content-save"
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          Save Flavor Profile
        </Button>

        {/* Info */}
        <Card mode="outlined" style={styles.infoCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.infoText}>
              💡 Your flavor profile will be automatically updated each time you give a positive
              review (Like It or Love It) to an oyster.
            </Text>
          </Card.Content>
        </Card>
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
      marginBottom: 24,
    },
    title: {
      marginBottom: 8,
    },
    subtitle: {
      lineHeight: 22,
    },
    sliderCard: {
      marginBottom: 16,
    },
    sliderLabel: {
      marginBottom: 4,
    },
    sliderValue: {
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
    saveButton: {
      marginTop: 8,
      marginBottom: 24,
    },
    saveButtonContent: {
      paddingVertical: 8,
    },
    infoCard: {
      // Paper handles styling
    },
    infoText: {
      lineHeight: 20,
    },
  });
