import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { OysterDetailScreenRouteProp } from '../navigation/types';
import { oysterApi } from '../services/api';
import { Oyster } from '../types/Oyster';
import { RatingDisplay, RatingBreakdown } from '../components/RatingDisplay';

export default function OysterDetailScreen() {
  const route = useRoute<OysterDetailScreenRouteProp>();
  const { oysterId } = route.params;
  const [oyster, setOyster] = useState<Oyster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOyster();
  }, [oysterId]);

  const fetchOyster = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await oysterApi.getById(oysterId);
      setOyster(data);
    } catch (err) {
      setError('Failed to load oyster details');
      console.error('Error fetching oyster:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderAttributeBar = (value: number, label: string) => {
    const percentage = (value / 10) * 100;
    return (
      <View style={styles.attributeBarContainer}>
        <View style={styles.attributeBarHeader}>
          <Text style={styles.attributeBarLabel}>{label}</Text>
          <Text style={styles.attributeBarValue}>{value}/10</Text>
        </View>
        <View style={styles.attributeBarTrack}>
          <View
            style={[
              styles.attributeBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: getAttributeColor(value)
              }
            ]}
          />
        </View>
      </View>
    );
  };

  const getAttributeColor = (value: number) => {
    if (value <= 3) return '#e74c3c';
    if (value <= 7) return '#f39c12';
    return '#27ae60';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (error || !oyster) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Oyster not found'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.name}>{oyster.name}</Text>
          <View style={styles.speciesBadge}>
            <Text style={styles.speciesText}>{oyster.species}</Text>
          </View>
          {oyster.species === 'Unknown' && (
            <Text style={styles.unknownHintSmall}>
              🔬 Know the species? Rate it and help us complete this entry!
            </Text>
          )}

          <View style={styles.headerRating}>
            <RatingDisplay
              overallScore={oyster.overallScore}
              totalReviews={oyster.totalReviews}
              size="large"
              showDetails={true}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Origin</Text>
          <Text style={styles.originText}>{oyster.origin}</Text>
          {oyster.origin === 'Unknown' && (
            <Text style={styles.unknownHint}>
              📍 Know where this oyster is from? Rate it and add the origin!
            </Text>
          )}
        </View>

        {oyster.standoutNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Standout Notes</Text>
            <Text style={styles.notesText}>{oyster.standoutNotes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attribute Profile</Text>
          <Text style={styles.sectionSubtitle}>10-point scale ratings</Text>

          {renderAttributeBar(oyster.size, 'Size (1=Tiny → 10=Huge)')}
          {renderAttributeBar(oyster.body, 'Body (1=Thin → 10=Fat)')}
          {renderAttributeBar(oyster.sweetBrininess, 'Sweet/Brininess (1=Sweet → 10=Salty)')}
          {renderAttributeBar(oyster.flavorfulness, 'Flavorfulness (1=Boring → 10=Bold)')}
          {renderAttributeBar(oyster.creaminess, 'Creaminess (1=None → 10=Creamy)')}
        </View>

        {oyster.reviews && oyster.reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Reviews ({oyster.reviews.length})
            </Text>
            {oyster.reviews.map((review, index) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewRating}>{review.rating.replace('_', ' ')}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {review.notes && (
                  <Text style={styles.reviewNotes}>{review.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.metaText}>
            Added: {new Date(oyster.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.metaText}>
            Updated: {new Date(oyster.updatedAt).toLocaleDateString()}
          </Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  speciesBadge: {
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  speciesText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
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
  originText: {
    fontSize: 16,
    color: '#555',
  },
  notesText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  attributeBarContainer: {
    marginBottom: 15,
  },
  attributeBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  attributeBarLabel: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  attributeBarValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  attributeBarTrack: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  attributeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    textTransform: 'capitalize',
  },
  reviewDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  reviewNotes: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  metaText: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 5,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
  },
  headerRating: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  unknownHint: {
    fontSize: 13,
    color: '#f39c12',
    fontStyle: 'italic',
    marginTop: 8,
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  unknownHintSmall: {
    fontSize: 12,
    color: '#f39c12',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
