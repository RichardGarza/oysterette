/**
 * AddOysterScreen
 *
 * Community contribution form for adding oysters to database.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { oysterApi } from '../services/api';

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
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
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
          <Text style={styles.sliderLabel}>{config.label}</Text>
          <Text style={styles.sliderValue}>{formData[field]}/10</Text>
        </View>
        <Text style={styles.sliderDescription}>{config.description}</Text>
        <Slider
          style={styles.slider}
          minimumValue={SLIDER_CONFIG.MIN_VALUE}
          maximumValue={SLIDER_CONFIG.MAX_VALUE}
          step={SLIDER_CONFIG.STEP}
          value={parseInt(formData[field])}
          onValueChange={(value) => updateField(field, Math.round(value).toString())}
          minimumTrackTintColor={SLIDER_CONFIG.MIN_TRACK_COLOR}
          maximumTrackTintColor={SLIDER_CONFIG.MAX_TRACK_COLOR}
          thumbTintColor={SLIDER_CONFIG.THUMB_COLOR}
        />
        <View style={styles.scaleIndicator}>
          <Text style={styles.scaleText}>1</Text>
          <Text style={styles.scaleText}>5</Text>
          <Text style={styles.scaleText}>10</Text>
        </View>
      </View>
    );
  }, [formData, updateField]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Oyster</Text>
          <Text style={styles.subtitle}>
            Help grow our database by adding oysters you discover!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Text style={styles.label}>Oyster Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Kumamoto"
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
          />

          <Text style={styles.label}>Species *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Crassostrea gigas"
            value={formData.species}
            onChangeText={(value) => updateField('species', value)}
          />

          <Text style={styles.label}>Origin *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Hood Canal, Washington"
            value={formData.origin}
            onChangeText={(value) => updateField('origin', value)}
          />

          <Text style={styles.label}>Standout Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special characteristics or tasting notes..."
            value={formData.standoutNotes}
            onChangeText={(value) => updateField('standoutNotes', value)}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attribute Profile (1-10 Scale)</Text>

          {renderSlider('size')}
          {renderSlider('body')}
          {renderSlider('sweetBrininess')}
          {renderSlider('flavorfulness')}
          {renderSlider('creaminess')}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.WHITE} />
            ) : (
              <Text style={styles.submitButtonText}>Add Oyster</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
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
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_LABEL,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.INPUT_BG,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_LABEL,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  sliderDescription: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 10,
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
  scaleText: {
    fontSize: 12,
    color: COLORS.SCALE_TEXT,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  cancelButtonText: {
    color: COLORS.TEXT_LABEL,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});
