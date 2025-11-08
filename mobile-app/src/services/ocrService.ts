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
  position: number;
}

interface UnmatchedOyster {
  detectedText: string;
  position: number;
}

interface TextWithPosition {
  text: string;
  position: number;
}

/**
 * Extract text from image URI with position tracking
 */
export const recognizeText = async (imageUri: string): Promise<TextWithPosition[]> => {
  try {
    const result = await TextRecognition.recognize(imageUri);

    // Extract all text blocks with position
    const textLines: TextWithPosition[] = [];
    result.blocks.forEach((block, blockIndex) => {
      block.lines.forEach((line, lineIndex) => {
        textLines.push({
          text: line.text,
          position: blockIndex * 100 + lineIndex, // Simple position tracking
        });
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
  detectedTexts: TextWithPosition[],
  oysters: Oyster[]
): { matches: OysterMatch[]; unmatched: UnmatchedOyster[] } => {
  const fuse = new Fuse(oysters, {
    keys: ['name', 'species', 'origin'],
    threshold: 0.4,
    includeScore: true,
  });

  const matches: OysterMatch[] = [];
  const unmatched: UnmatchedOyster[] = [];
  const matchedOysterIds = new Set<string>();
  const processedTexts = new Set<string>();

  detectedTexts.forEach((item) => {
    const results = fuse.search(item.text);

    let foundMatch = false;
    results.forEach((result: any) => {
      if (result.score && result.score < 0.4 && !matchedOysterIds.has(result.item.id)) {
        matches.push({
          oyster: result.item,
          score: 1 - result.score, // Convert to match percentage
          detectedText: item.text,
          position: item.position,
        });
        matchedOysterIds.add(result.item.id);
        foundMatch = true;
      }
    });

    // Track unmatched if text looks like an oyster name (3+ chars, not processed)
    if (!foundMatch && item.text.length >= 3 && !processedTexts.has(item.text.toLowerCase())) {
      unmatched.push({
        detectedText: item.text,
        position: item.position,
      });
      processedTexts.add(item.text.toLowerCase());
    }
  });

  // Sort by position to maintain menu order
  matches.sort((a, b) => a.position - b.position);
  unmatched.sort((a, b) => a.position - b.position);

  return { matches, unmatched };
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
