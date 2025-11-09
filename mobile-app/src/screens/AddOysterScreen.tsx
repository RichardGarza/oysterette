/**
 * AddOysterScreen
 *
 * Community contribution form for adding oysters to database.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button, Card, Text, HelperText } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { oysterApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const SLIDER_CONFIG = {
  MIN_VALUE: 1,
  MAX_VALUE: 10,
  STEP: 1,
  DEFAULT_VALUE: '5',
  HEIGHT: 40,
  MIN_TRACK_COLOR: '#3498db',
  MAX_TRACK_COLOR: '#e0e0e0',
  THUMB_COLOR: '#3498db',
} as const;

const COLORS = {
  BACKGROUND: '#f5f5f5',
  WHITE: '#fff',
  BORDER: '#e0e0e0',
  TEXT_PRIMARY: '#2c3e50',
  TEXT_SECONDARY: '#7f8c8d',
  TEXT_LABEL: '#555',
  INPUT_BG: '#f8f9fa',
  PRIMARY: '#3498db',
  SCALE_TEXT: '#95a5a6',
} as const;


const ATTRIBUTE_LABELS = {
  size: { label: 'Size', description: '1 = Tiny → 10 = Huge' },
  body: { label: 'Body', description: '1 = Thin → 10 = Extremely Fat' },
  sweetBrininess: { label: 'Sweet/Brininess', description: '1 = Very Sweet → 10 = Very Salty' },
  flavorfulness: { label: 'Flavorfulness', description: '1 = Boring → 10 = Extremely Bold' },
  creaminess: { label: 'Creaminess', description: '1 = None → 10 = Nothing But Cream' },
} as const;

// ============================================================================
// TYPES
// ============================================================================

type AddOysterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddOyster'
>;

type AddOysterScreenRouteProp = RouteProp<RootStackParamList, 'AddOyster'>;

interface FormData {
  name: string;
  species: string;
  origin: string;
  standoutNotes: string;
  size: string;
  body: string;
  sweetBrininess: string;
  flavorfulness: string;
  creaminess: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AddOysterScreen() {
  const navigation = useNavigation<AddOysterScreenNavigationProp>();
  const route = useRoute<AddOysterScreenRouteProp>();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: route.params?.name || '',
    species: '',
    origin: '',
    standoutNotes: '',
    size: SLIDER_CONFIG.DEFAULT_VALUE,
    body: SLIDER_CONFIG.DEFAULT_VALUE,
    sweetBrininess: SLIDER_CONFIG.DEFAULT_VALUE,
    flavorfulness: SLIDER_CONFIG.DEFAULT_VALUE,
    creaminess: SLIDER_CONFIG.DEFAULT_VALUE,
  });

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Oyster name is required');
      return false;
    }

    if (!formData.species.trim()) {
      Alert.alert('Validation Error', 'Species is required');
      return false;
    }

    if (!formData.origin.trim()) {
      Alert.alert('Validation Error', 'Origin is required');
      return false;
    }

    const attributes: Array<keyof FormData> = ['size', 'body', 'sweetBrininess', 'flavorfulness', 'creaminess'];
    for (const attr of attributes) {
      const value = parseInt(formData[attr]);
      if (isNaN(value) || value < SLIDER_CONFIG.MIN_VALUE || value > SLIDER_CONFIG.MAX_VALUE) {
        Alert.alert('Validation Error', `${attr} must be between ${SLIDER_CONFIG.MIN_VALUE} and ${SLIDER_CONFIG.MAX_VALUE}`);
        return false;
      }
    }

    return true;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const oysterData = {
        name: formData.name.trim(),
        species: formData.species.trim(),
        origin: formData.origin.trim(),
        standoutNotes: formData.standoutNotes.trim() || undefined,
        size: parseInt(formData.size),
        body: parseInt(formData.body),
        sweetBrininess: parseInt(formData.sweetBrininess),
        flavorfulness: parseInt(formData.flavorfulness),
        creaminess: parseInt(formData.creaminess),
      };

      await oysterApi.create(oysterData);
      Alert.alert('Success', 'Oyster added successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('OysterList'),
        },
      ]);
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ [AddOysterScreen] Error adding oyster:', error);
      }
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to add oyster. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [validateForm, formData, navigation]);

  const renderSlider = useCallback((
    field: keyof FormData,
  ) => {
    const config = ATTRIBUTE_LABELS[field as keyof typeof ATTRIBUTE_LABELS];
    if (!config) return null;

    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderHeader}>
          <Text variant="bodyLarge" style={{ color: theme.colors.text }}>{config.label}</Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
            {formData[field]}/10
          </Text>
        </View>
        <HelperText type="info" style={{ marginBottom: 8 }}>
          {config.description}
        </HelperText>
        <Slider
          style={styles.slider}
          minimumValue={SLIDER_CONFIG.MIN_VALUE}
          maximumValue={SLIDER_CONFIG.MAX_VALUE}
          step={SLIDER_CONFIG.STEP}
          value={parseInt(formData[field])}
          onValueChange={(value) => updateField(field, Math.round(value).toString())}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.primary}
        />
        <View style={styles.scaleIndicator}>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>1</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>5</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>10</Text>
        </View>
      </View>
    );
  }, [formData, updateField, theme]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView}>
        <Card style={styles.header}>
          <Card.Content>
            <Text variant="headlineMedium" style={{ color: theme.colors.text }}>Add New Oyster</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
              Help grow our database by adding oysters you discover!
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 16, color: theme.colors.text }}>Basic Information</Text>

            <TextInput
              mode="outlined"
              label="Oyster Name *"
              placeholder="e.g., Kumamoto"
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Species *"
              placeholder="e.g., Crassostrea gigas"
              value={formData.species}
              onChangeText={(value) => updateField('species', value)}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Origin *"
              placeholder="e.g., Hood Canal, Washington"
              value={formData.origin}
              onChangeText={(value) => updateField('origin', value)}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Standout Notes (Optional)"
              placeholder="Any special characteristics or tasting notes..."
              value={formData.standoutNotes}
              onChangeText={(value) => updateField('standoutNotes', value)}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textArea]}
            />
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 16, color: theme.colors.text }}>
              Attribute Profile (1-10 Scale)
            </Text>

            {renderSlider('size')}
            {renderSlider('body')}
            {renderSlider('sweetBrininess')}
            {renderSlider('flavorfulness')}
            {renderSlider('creaminess')}
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
          >
            Cancel
          </Button>

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            style={styles.submitButton}
            contentStyle={styles.buttonContent}
          >
            Add Oyster
          </Button>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: 8,
  },
  section: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: SLIDER_CONFIG.HEIGHT,
  },
  scaleIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: -5,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
  },
  submitButton: {
    flex: 1,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
