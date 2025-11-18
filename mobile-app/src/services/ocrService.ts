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
  detectedTexts: string[],
  allOysters: Oyster[],
  options = { threshold: 0.7 }
): { matches: any[], unmatched: any[] } => {
  // Filter words: split, >3 chars, no numbers/prices
  const priceRegex = /^\d+\.?\d*$/; // e.g., 12.99
  const currencyRegex = /[$€£]/; // Currency symbols
  const filteredWords = detectedTexts
    .flatMap(text => text.split(/\s+/))
    .filter(word => word.length > 3 && !isNaN(word).toString() !== word && !priceRegex.test(word) && !currencyRegex.test(word));

  if (filteredWords.length === 0) {
    return { matches: [], unmatched: detectedTexts.map((text, pos) => ({ detectedText: text, position: pos })) };
  }

  // Fuzzy search on filtered words
  const fuse = new Fuse(allOysters, {
    keys: ['name'],
    threshold: options.threshold, // 0.7 = good matches only
    includeScore: true,
  });

  const allMatches = filteredWords.map(word => {
    const results = fuse.search(word);
    return results.map(result => ({ ...result, detectedText: word, position: detectedTexts.indexOf(word) }));
  }).flat();

  // Dedupe by oyster.id (keep highest score)
  const uniqueMatches = allMatches.reduce((acc, match) => {
    const existing = acc.find(m => m.item.id === match.item.id);
    if (!existing || match.score < existing.score) {
      acc.push(match);
    }
    return acc;
  }, []);

  // Sort: confidence (score) desc, then position asc
  uniqueMatches.sort((a, b) => (b.score - a.score) || (a.item.position - b.item.position)); // Note: position from detect, may need adjust

  // Limit to 20
  const matches = uniqueMatches.slice(0, 20);

  // Unmatched: Original detectedTexts not in matches (simplified)
  const matchedTexts = new Set(matches.map(m => m.detectedText));
  const unmatched = detectedTexts
    .filter(text => !matchedTexts.has(text.split(/\s+/)[0])) // Simplified
    .map((text, pos) => ({ detectedText: text, position: pos }));

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
