/**
 * Rating Utilities
 *
 * Helper functions for converting and displaying oyster ratings.
 *
 * Purpose:
 * - Convert numerical scores to human-readable formats
 * - Map 0-10 scores to verdicts, emojis, stars
 * - Provide descriptive labels for attribute values
 * - Centralized rating logic used across UI
 *
 * Data Source:
 * - Reads from ../data/oyster-rating-labels.json
 * - Contains verdict ranges, emojis, and attribute descriptors
 * - Shared with backend for consistency
 *
 * Functions:
 *
 * 1. scoreToVerdict(score: number):
 *    - Converts 0-10 score to verdict object
 *    - Returns: { verdict, emoji, meaning }
 *    - Examples:
 *      - 9.5 → { verdict: "Outstanding", emoji: "🏆", meaning: "World-class!" }
 *      - 7.3 → { verdict: "Very Good", emoji: "😊", meaning: "Quite enjoyable" }
 *      - 4.8 → { verdict: "Mediocre", emoji: "😐", meaning: "Fine. Nothing special." }
 *      - 2.1 → { verdict: "Poor", emoji: "👎", meaning: "Not recommended" }
 *    - Used by: RatingDisplay component for detail views
 *
 * 2. scoreToStars(score: number):
 *    - Converts 0-10 score to 0-5 star rating
 *    - Formula: score / 2
 *    - Returns number with 1 decimal (e.g., 3.5)
 *    - Examples:
 *      - 10 → 5.0 stars
 *      - 8.6 → 4.3 stars
 *      - 7.0 → 3.5 stars
 *      - 5.2 → 2.6 stars
 *    - Used by: RatingDisplay component for list views
 *
 * 3. getAttributeDescriptor(attribute, score):
 *    - Maps numeric score to descriptive word
 *    - Attributes: size, body, sweet_brininess, flavorfulness, creaminess
 *    - Rounds score to nearest integer (1-10)
 *    - Returns string descriptor from JSON data
 *
 *    Examples:
 *    - size, 10 → "Huge"
 *    - body, 9 → "Baddy McFatty"
 *    - sweet_brininess, 1 → "Sweet AF"
 *    - flavorfulness, 5 → "Moderate"
 *    - creaminess, 10 → "Nothing but cream"
 *
 *    - Used by: AddReviewScreen, OysterDetailScreen for slider labels
 *
 * Verdict Ranges (from JSON):
 * - 9.0-10.0: Outstanding 🏆 "World-class oyster"
 * - 8.0-8.9: Excellent ⭐ "Exceptional quality"
 * - 7.0-7.9: Very Good 😊 "Quite enjoyable"
 * - 6.0-6.9: Good 👍 "Solid choice"
 * - 5.0-5.9: Decent 🆗 "Worth trying"
 * - 4.0-4.9: Mediocre 😐 "Fine. Nothing special."
 * - 0.0-3.9: Poor 👎 "Not recommended"
 *
 * Attribute Descriptors (examples from JSON):
 * Size: Tiny → Petite → Small → Medium → Large → XL → XXL → Jumbo → Gigantic → Huge
 * Body: Thin → Slim → Light → Medium → Full → Thick → Rich → Fat → Obese → Baddy McFatty
 * Sweet/Brininess: Sweet AF → Very Sweet → Sweet → Mild → Balanced → Briny → Salty → Very Salty → Ocean Water → Salt Lick
 * Flavorfulness: Boring AF → Bland → Subtle → Light → Moderate → Flavorful → Bold → Intense → Explosive → Flavor Bomb
 * Creaminess: None → Hint → Light → Some → Moderate → Creamy → Very Creamy → Rich → Decadent → Nothing but cream
 *
 * Integration:
 * - RatingDisplay: Uses scoreToVerdict and scoreToStars
 * - AddReviewScreen: Uses getAttributeDescriptor for dynamic slider labels
 * - OysterDetailScreen: Uses getAttributeDescriptor for attribute bars
 * - Backend uses same JSON for consistency
 *
 * Error Handling:
 * - scoreToVerdict: Falls back to "Meh" if no range matches
 * - getAttributeDescriptor: Falls back to numeric string if attribute not found
 * - Rounds scores to handle floating point edge cases
 */

import ratingLabels from '../data/oyster-rating-labels.json';

/**
 * Convert numeric score (0-10) to verdict with emoji and meaning
 */
export function scoreToVerdict(score: number): {
  verdict: string;
  emoji: string;
  meaning: string;
} {
  const verdicts = ratingLabels.overallVerdict;

  for (const item of verdicts) {
    const [min = 0, max = 10] = item.range;
    if (score >= min && score <= max) {
      return {
        verdict: item.verdict,
        emoji: item.emoji,
        meaning: item.meaning,
      };
    }
  }

  // Fallback to Meh
  return {
    verdict: 'Meh',
    emoji: '😐',
    meaning: 'Fine. Nothing special.',
  };
}

/**
 * Convert numeric score (0-10) to star rating (0-5)
 */
export function scoreToStars(score: number): number {
  return Number((score / 2).toFixed(1));
}

/**
 * Get attribute descriptor for a given attribute and score
 */
export function getAttributeDescriptor(
  attribute: 'size' | 'body' | 'sweet_brininess' | 'flavorfulness' | 'creaminess',
  score: number
): string {
  const rounded = Math.round(score);
  const descriptors = ratingLabels.descriptors[attribute];

  if (!descriptors) {
    return score.toString();
  }

  return descriptors[rounded.toString() as keyof typeof descriptors] || score.toString();
}
