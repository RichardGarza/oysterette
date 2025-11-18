/**
 * ScanMenuScreen
 *
 * AR menu scanner for detecting oyster names on restaurant menus.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ScrollView, Image } from 'react-native';
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
  // Add state for captured photo and analyzing
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showAnalyzing, setShowAnalyzing] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.getCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

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

      // Show static photo and analyzing overlay (disable live camera)
      setCapturedPhoto(photo.uri);
      setShowAnalyzing(true);

      // Process OCR
      const detectedTexts = await recognizeText(photo.uri);

      if (detectedTexts.length === 0) {
        Alert.alert('No Text Detected', 'Point camera at menu text and try again.');
        setShowAnalyzing(false);
        setCapturedPhoto(null);
        return;
      }

      // Match oysters with fixes
      const { matches: ocrMatches, unmatched: unmatchedItems } = matchOysters(detectedTexts, allOysters, { threshold: 0.7 }); // >70%

      // Dedupe matches by oyster.id, limit 20, sort by score desc then position
      const uniqueMatches = ocrMatches
        .filter((match, index, self) => self.findIndex(m => m.oyster.id === match.oyster.id) === index) // Dedupe
        .sort((a, b) => b.score - a.score || a.position - b.position) // Sort confidence desc, then position asc
        .slice(0, 20); // Limit 20

      // Calculate personalized scores
      const matchesWithScores: MatchedOyster[] = uniqueMatches.map((match) => ({
        oyster: match.oyster,
        score: match.score,
        personalizedScore: calculatePersonalizedScore(match.oyster),
        detectedText: match.detectedText,
        position: match.position,
      }));

      setMatches(matchesWithScores);
      setUnmatched(unmatchedItems.slice(0, 20)); // Limit unmatched too
      setShowAnalyzing(false);
      setCapturedPhoto(null); // Clear static photo after processing

      // Navigate to results if needed, or render below
    } catch (error) {
      setShowAnalyzing(false);
      setCapturedPhoto(null);
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
            Camera access is needed to scan oyster menus and match them with our database.
          </Text>
          <Button mode="contained" onPress={requestPermissions} style={styles.backButton}>
            Grant Camera Access
          </Button>
          <Button mode="text" onPress={() => navigation.goBack()} style={{ marginTop: 8 }}>
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

      {showAnalyzing ? (
        <View style={styles.analyzingContainer}>
          {capturedPhoto && <Image source={{ uri: capturedPhoto }} style={styles.staticPhoto} />}
          <View style={styles.analyzingOverlay}>
            <ActivityIndicator size="large" color={paperTheme.colors.primary} />
            <Text style={styles.analyzingText}>Analyzing...</Text>
          </View>
        </View>
      ) : (
        <CameraView style={styles.camera} ref={cameraRef}>
          <View style={styles.overlay}>
            <View style={styles.instructionContainer}>
              <Text variant="titleMedium" style={styles.instructionText}>
                Point camera at oyster menu
              </Text>
            </View>
          </View>
        </CameraView>
      )}

      {/* Existing bottomContainer with scan button (disabled during analyzing) */}
      <View style={styles.bottomContainer}>
        <Button
          mode="contained"
          onPress={handleScan}
          disabled={scanning || showAnalyzing}
          style={styles.scanButton}
          icon="camera"
        >
          {scanning ? 'Scanning...' : 'Scan Now'}
        </Button>
      </View>
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
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staticPhoto: {
    flex: 1,
    width: '100%',
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: 'white',
    marginTop: 10,
  },
});
