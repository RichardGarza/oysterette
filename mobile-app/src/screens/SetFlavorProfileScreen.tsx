/**
 * SetFlavorProfileScreen
 *
 * User preference sliders for personalized oyster recommendations.
 */

import React, { useState, useCallback, useMemo } from 'react';
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

// ============================================================================
// CONSTANTS
// ============================================================================

const SLIDER_CONFIG = {
  MIN_VALUE: 1,
  MAX_VALUE: 10,
  STEP: 1,
  DEFAULT_VALUE: 5,
  HEIGHT: 50,
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export default function SetFlavorProfileScreen() {
  const navigation = useNavigation();
  const { theme, paperTheme } = useTheme();
  const styles = useStyles(theme.colors);

  const [size, setSize] = useState<number>(SLIDER_CONFIG.DEFAULT_VALUE);
  const [body, setBody] = useState<number>(SLIDER_CONFIG.DEFAULT_VALUE);
  const [sweetBrininess, setSweetBrininess] = useState<number>(SLIDER_CONFIG.DEFAULT_VALUE);
  const [flavorfulness, setFlavorfulness] = useState<number>(SLIDER_CONFIG.DEFAULT_VALUE);
  const [creaminess, setCreaminess] = useState<number>(SLIDER_CONFIG.DEFAULT_VALUE);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
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
      if (__DEV__) {
        console.error('❌ [SetFlavorProfileScreen] Error saving flavor profile:', error);
      }
      Alert.alert('Error', error.response?.data?.error || 'Failed to save flavor profile');
    } finally {
      setSaving(false);
    }
  }, [size, body, sweetBrininess, flavorfulness, creaminess, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>Set Your Flavor Profile</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Tell us your ideal oyster attributes to get personalized recommendations
          </Text>
        </View>

        <Card mode="elevated" style={styles.sliderCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sliderLabel}>Preferred Size</Text>
            <Text variant="headlineSmall" style={styles.sliderValue}>{getAttributeDescriptor('size', size)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={SLIDER_CONFIG.MIN_VALUE}
              maximumValue={SLIDER_CONFIG.MAX_VALUE}
              step={SLIDER_CONFIG.STEP}
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

        <Card mode="elevated" style={styles.sliderCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sliderLabel}>Preferred Body</Text>
            <Text variant="headlineSmall" style={styles.sliderValue}>{getAttributeDescriptor('body', body)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={SLIDER_CONFIG.MIN_VALUE}
              maximumValue={SLIDER_CONFIG.MAX_VALUE}
              step={SLIDER_CONFIG.STEP}
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

        <Card mode="elevated" style={styles.sliderCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sliderLabel}>Preferred Sweet/Brininess</Text>
            <Text variant="headlineSmall" style={styles.sliderValue}>{getAttributeDescriptor('sweetBrininess', sweetBrininess)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={SLIDER_CONFIG.MIN_VALUE}
              maximumValue={SLIDER_CONFIG.MAX_VALUE}
              step={SLIDER_CONFIG.STEP}
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

        <Card mode="elevated" style={styles.sliderCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sliderLabel}>Preferred Flavorfulness</Text>
            <Text variant="headlineSmall" style={styles.sliderValue}>{getAttributeDescriptor('flavorfulness', flavorfulness)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={SLIDER_CONFIG.MIN_VALUE}
              maximumValue={SLIDER_CONFIG.MAX_VALUE}
              step={SLIDER_CONFIG.STEP}
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

        <Card mode="elevated" style={styles.sliderCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sliderLabel}>Preferred Creaminess</Text>
            <Text variant="headlineSmall" style={styles.sliderValue}>{getAttributeDescriptor('creaminess', creaminess)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={SLIDER_CONFIG.MIN_VALUE}
              maximumValue={SLIDER_CONFIG.MAX_VALUE}
              step={SLIDER_CONFIG.STEP}
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

const useStyles = (colors: any) =>
  useMemo(() => StyleSheet.create({
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
      height: SLIDER_CONFIG.HEIGHT,
    },
    slider: {
      width: '100%',
      height: SLIDER_CONFIG.HEIGHT,
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
  }), [colors]);
