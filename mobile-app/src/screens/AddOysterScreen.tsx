import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { oysterApi } from '../services/api';

type AddOysterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddOyster'
>;

export default function AddOysterScreen() {
  const navigation = useNavigation<AddOysterScreenNavigationProp>();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    origin: '',
    standoutNotes: '',
    size: '5',
    body: '5',
    sweetBrininess: '5',
    flavorfulness: '5',
    creaminess: '5',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Oyster name is required');
      return false;
    }

    // Validate all attribute values are between 1-10
    const attributes = ['size', 'body', 'sweetBrininess', 'flavorfulness', 'creaminess'];
    for (const attr of attributes) {
      const value = parseInt(formData[attr as keyof typeof formData]);
      if (isNaN(value) || value < 1 || value > 10) {
        Alert.alert('Validation Error', `${attr} must be between 1 and 10`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const oysterData = {
        name: formData.name.trim(),
        species: formData.species.trim() || 'Unknown',
        origin: formData.origin.trim() || 'Unknown',
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
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to add oyster. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderSlider = (
    label: string,
    field: keyof typeof formData,
    description: string
  ) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{formData[field]}/10</Text>
      </View>
      <Text style={styles.sliderDescription}>{description}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.sliderInput}
          keyboardType="number-pad"
          maxLength={2}
          value={formData[field]}
          onChangeText={(value) => updateField(field, value)}
        />
        <View style={styles.scaleIndicator}>
          <Text style={styles.scaleText}>1</Text>
          <Text style={styles.scaleText}>5</Text>
          <Text style={styles.scaleText}>10</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Oyster</Text>
          <Text style={styles.subtitle}>
            Only name and attribute profile are required. Species and origin can be added later by other users when they rate!
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

          <Text style={styles.label}>Species (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Crassostrea gigas (leave blank if unknown)"
            value={formData.species}
            onChangeText={(value) => updateField('species', value)}
          />

          <Text style={styles.label}>Origin (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Hood Canal, Washington (leave blank if unknown)"
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

          {renderSlider('Size', 'size', '1 = Tiny → 10 = Huge')}
          {renderSlider('Body', 'body', '1 = Thin → 10 = Extremely Fat')}
          {renderSlider('Sweet/Brininess', 'sweetBrininess', '1 = Very Sweet → 10 = Very Salty')}
          {renderSlider('Flavorfulness', 'flavorfulness', '1 = Boring → 10 = Extremely Bold')}
          {renderSlider('Creaminess', 'creaminess', '1 = None → 10 = Nothing But Cream')}
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
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Add Oyster</Text>
            )}
          </TouchableOpacity>
        </View>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
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
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
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
    color: '#555',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
  },
  sliderDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  sliderInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    width: 60,
    textAlign: 'center',
    fontWeight: '600',
  },
  scaleIndicator: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  scaleText: {
    fontSize: 12,
    color: '#95a5a6',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3498db',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
