/**
 * ScanMenuScreen
 *
 * AR menu scanner for detecting oyster names on restaurant menus.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { CameraView, Camera, CameraType } from 'expo-camera';
import { Button, Text, Appbar, ActivityIndicator, Card, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { HomeScreenNavigationProp } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { oysterApi } from '../services/api';
import { Oyster } from '../types/Oyster';
import { recognizeText, matchOysters, calculatePersonalizedScore, getMatchColor, getMatchLabel } from '../services/ocrService';

interface MatchedOyster {
  oyster: Oyster;
  score: number;
  personalizedScore: number;
  detectedText: string;
  position: number;
}

interface UnmatchedOyster {
  detectedText: string;
  position: number;
}

export default function ScanMenuScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { paperTheme } = useTheme();
  const cameraRef = useRef<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [matches, setMatches] = useState<MatchedOyster[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedOyster[]>([]);
  const [allOysters, setAllOysters] = useState<Oyster[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    loadOysters();
  }, []);

  const loadOysters = async () => {
    try {
      const oysters = await oysterApi.getAll();
      setAllOysters(oysters);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [ScanMenu] Error loading oysters:', error);
      }
    }
  };

  const handleScan = async () => {
    if (!cameraRef.current) return;

    try {
      setScanning(true);
      setMatches([]);
      setUnmatched([]);

      // Take photo
      const photo = await cameraRef.current.takePictureAsync();

      // Run OCR
      const detectedTexts = await recognizeText(photo.uri);

      if (detectedTexts.length === 0) {
        Alert.alert('No Text Detected', 'Point camera at menu text and try again.');
        return;
      }

      // Match oysters
      const { matches: ocrMatches, unmatched: unmatchedItems } = matchOysters(detectedTexts, allOysters);

      if (ocrMatches.length === 0 && unmatchedItems.length === 0) {
        Alert.alert('No Matches', 'No oysters found on this menu. Try another angle.');
        return;
      }

      // Calculate personalized scores for matched oysters
      const matchesWithScores: MatchedOyster[] = ocrMatches.map((match) => ({
        oyster: match.oyster,
        score: match.score,
        personalizedScore: calculatePersonalizedScore(match.oyster),
        detectedText: match.detectedText,
        position: match.position,
      }));

      setMatches(matchesWithScores);
      setUnmatched(unmatchedItems);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [ScanMenu] Scan error:', error);
      }
      Alert.alert('Scan Failed', 'Failed to scan menu. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Scan Menu" />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Scan Menu" />
        </Appbar.Header>
        <View style={styles.centerContent}>
          <Text variant="headlineSmall" style={styles.errorTitle}>Camera Permission Required</Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            Please enable camera access in your device settings to scan menus.
          </Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Scan Menu" />
      </Appbar.Header>

      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.instructionContainer}>
            <Text variant="titleMedium" style={styles.instructionText}>
              Point camera at oyster menu
            </Text>
          </View>

          <View style={styles.bottomContainer}>
            {matches.length === 0 && unmatched.length === 0 ? (
              <Button
                mode="contained"
                onPress={handleScan}
                loading={scanning}
                disabled={scanning}
                style={styles.scanButton}
                icon="camera"
              >
                {scanning ? 'Scanning...' : 'Scan Now'}
              </Button>
            ) : (
              <ScrollView style={styles.resultsContainer}>
                <Text variant="titleLarge" style={styles.resultsTitle}>
                  Found {matches.length + unmatched.length} Item{matches.length + unmatched.length !== 1 ? 's' : ''}
                </Text>
                <Text variant="bodyMedium" style={styles.resultsSubtitle}>
                  {matches.length} in database • {unmatched.length} not found
                </Text>

                {/* Matched Oysters */}
                {matches.map((match, index) => (
                  <Card
                    key={`match-${index}`}
                    mode="elevated"
                    style={styles.resultCard}
                    onPress={() => navigation.navigate('OysterDetail', { oysterId: match.oyster.id })}
                  >
                    <Card.Content>
                      <View style={styles.resultHeader}>
                        <Text variant="titleMedium">{match.oyster.name}</Text>
                        <Chip
                          style={[
                            styles.scoreChip,
                            { backgroundColor: getMatchColor(match.personalizedScore) },
                          ]}
                        >
                          {match.personalizedScore}%
                        </Chip>
                      </View>
                      <Text variant="bodySmall" style={styles.resultOrigin}>
                        {match.oyster.origin}
                      </Text>
                      <Text variant="labelSmall" style={styles.matchLabel}>
                        {getMatchLabel(match.personalizedScore)}
                      </Text>
                    </Card.Content>
                  </Card>
                ))}

                {/* Unmatched Oysters */}
                {unmatched.map((item, index) => (
                  <Card
                    key={`unmatched-${index}`}
                    mode="outlined"
                    style={[styles.resultCard, styles.unmatchedCard]}
                  >
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.unmatchedName}>
                        {item.detectedText}
                      </Text>
                      <Text variant="bodySmall" style={styles.unmatchedText}>
                        Not in database
                      </Text>
                      <View style={styles.unmatchedActions}>
                        <Button
                          mode="contained"
                          onPress={() => navigation.navigate('AddOyster', { name: item.detectedText })}
                          style={styles.addButton}
                          compact
                          icon="plus"
                        >
                          Add to Database
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                ))}

                <Button
                  mode="outlined"
                  onPress={() => {
                    setMatches([]);
                    setUnmatched([]);
                  }}
                  style={styles.scanAgainButton}
                  icon="camera"
                >
                  Scan Again
                </Button>
              </ScrollView>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  backButton: {
    marginTop: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  instructionContainer: {
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingBottom: 16,
  },
  instructionText: {
    color: '#fff',
    textAlign: 'center',
  },
  bottomContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    paddingHorizontal: 32,
  },
  resultsContainer: {
    width: '100%',
    padding: 16,
  },
  resultsTitle: {
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultsSubtitle: {
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  resultCard: {
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultOrigin: {
    marginBottom: 4,
    opacity: 0.7,
  },
  matchLabel: {
    marginTop: 4,
    fontWeight: '600',
  },
  scoreChip: {
    height: 32,
  },
  unmatchedCard: {
    borderColor: '#FFC107',
    borderWidth: 2,
  },
  unmatchedName: {
    marginBottom: 8,
  },
  unmatchedText: {
    opacity: 0.7,
    marginBottom: 12,
  },
  unmatchedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    flex: 1,
  },
  scanAgainButton: {
    marginTop: 16,
    marginBottom: 32,
  },
});
