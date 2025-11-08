/**
 * OCR Service
 *
 * Text recognition and oyster name matching from menu photos.
 */

import TextRecognition from '@react-native-ml-kit/text-recognition';
import Fuse from 'fuse.js';
import { Oyster } from '../types/Oyster';

interface OysterMatch {
  oyster: Oyster;
  score: number;
  detectedText: string;
}

/**
 * Extract text from image URI
 */
export const recognizeText = async (imageUri: string): Promise<string[]> => {
  try {
    const result = await TextRecognition.recognize(imageUri);

    // Extract all text blocks
    const textLines: string[] = [];
    result.blocks.forEach((block) => {
      block.lines.forEach((line) => {
        textLines.push(line.text);
      });
    });

    return textLines;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ [OCR] Text recognition error:', error);
    }
    return [];
  }
};

/**
 * Match detected text against oyster database
 */
export const matchOysters = (
  detectedTexts: string[],
  oysters: Oyster[]
): OysterMatch[] => {
  const fuse = new Fuse(oysters, {
    keys: ['name', 'species', 'origin'],
    threshold: 0.4,
    includeScore: true,
  });

  const matches: OysterMatch[] = [];
  const matchedOysterIds = new Set<string>();

  detectedTexts.forEach((text) => {
    const results = fuse.search(text);

    results.forEach((result: any) => {
      if (result.score && result.score < 0.4 && !matchedOysterIds.has(result.item.id)) {
        matches.push({
          oyster: result.item,
          score: 1 - result.score, // Convert to match percentage
          detectedText: text,
        });
        matchedOysterIds.add(result.item.id);
      }
    });
  });

  // Sort by match score (highest first)
  return matches.sort((a, b) => b.score - a.score);
};

/**
 * Calculate personalized recommendation score
 */
export const calculatePersonalizedScore = (
  oyster: Oyster,
  userPreferences?: {
    avgSize: number;
    avgBody: number;
    avgSweetBrininess: number;
    avgFlavorfulness: number;
    avgCreaminess: number;
  }
): number => {
  if (!userPreferences) {
    return 50; // Default neutral score
  }

  const oysterSize = oyster.avgSize || oyster.size;
  const oysterBody = oyster.avgBody || oyster.body;
  const oysterSweet = oyster.avgSweetBrininess || oyster.sweetBrininess;
  const oysterFlavor = oyster.avgFlavorfulness || oyster.flavorfulness;
  const oysterCream = oyster.avgCreaminess || oyster.creaminess;

  // Calculate similarity for each attribute (0-1 scale)
  const sizeMatch = 1 - Math.abs(oysterSize - userPreferences.avgSize) / 10;
  const bodyMatch = 1 - Math.abs(oysterBody - userPreferences.avgBody) / 10;
  const sweetMatch = 1 - Math.abs(oysterSweet - userPreferences.avgSweetBrininess) / 10;
  const flavorMatch = 1 - Math.abs(oysterFlavor - userPreferences.avgFlavorfulness) / 10;
  const creamMatch = 1 - Math.abs(oysterCream - userPreferences.avgCreaminess) / 10;

  // Average all matches
  const averageMatch = (sizeMatch + bodyMatch + sweetMatch + flavorMatch + creamMatch) / 5;

  // Convert to percentage
  return Math.round(averageMatch * 100);
};

/**
 * Get color for match score
 */
export const getMatchColor = (score: number): string => {
  if (score >= 90) return '#4CAF50'; // Green
  if (score >= 70) return '#FFC107'; // Yellow
  return '#F44336'; // Red
};

/**
 * Get match label
 */
export const getMatchLabel = (score: number): string => {
  if (score >= 90) return "You'll love this!";
  if (score >= 70) return 'Worth trying';
  return 'Not your style';
};
