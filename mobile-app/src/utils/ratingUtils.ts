/**
 * Rating Utilities
 *
 * Helper functions for converting and displaying oyster ratings.
 * Data sourced from ../data/oyster-rating-labels.json for consistency with backend.
 */

import ratingLabels from '../data/oyster-rating-labels.json';

// ============================================================================
// TYPES
// ============================================================================

export type OysterAttribute = 'size' | 'body' | 'sweet_brininess' | 'sweetBrininess' | 'flavorfulness' | 'creaminess';

export interface VerdictResult {
  readonly verdict: string;
  readonly emoji: string;
  readonly meaning: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCORE_BOUNDS = {
  MIN: 0,
  MAX: 10,
} as const;

const STARS_MAX = 5;

const FALLBACK_VERDICT: VerdictResult = {
  verdict: 'Meh',
  emoji: '😐',
  meaning: 'Fine. Nothing special.',
};

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Convert numeric score (0-10) to verdict with emoji and meaning
 * @param score - Overall score between 0-10
 * @returns Verdict object with verdict, emoji, and meaning
 */
export function scoreToVerdict(score: number): VerdictResult {
  const verdicts = ratingLabels.overallVerdict;

  for (const item of verdicts) {
    const [min = SCORE_BOUNDS.MIN, max = SCORE_BOUNDS.MAX] = item.range;
    if (score >= min && score <= max) {
      return {
        verdict: item.verdict,
        emoji: item.emoji,
        meaning: item.meaning,
      };
    }
  }

  return FALLBACK_VERDICT;
}

/**
 * Convert numeric score (0-10) to star rating (0-5)
 * @param score - Overall score between 0-10
 * @returns Star rating with 1 decimal place
 */
export function scoreToStars(score: number): number {
  const stars = score / 2;
  return Number(stars.toFixed(1));
}

/**
 * Get descriptive label for an attribute score
 * @param attribute - The attribute type
 * @param score - Numeric score (1-10)
 * @returns Human-readable descriptor (e.g., "Huge", "Baddy McFatty")
 */
export function getAttributeDescriptor(
  attribute: OysterAttribute,
  score: number
): string {
  const rounded = Math.round(score);
  // Normalize camelCase to snake_case for JSON lookup
  const normalizedAttribute = attribute === 'sweetBrininess' ? 'sweet_brininess' : attribute;
  const descriptors = ratingLabels.descriptors[normalizedAttribute as keyof typeof ratingLabels.descriptors];

  if (!descriptors) {
    return score.toString();
  }

  return descriptors[rounded.toString() as keyof typeof descriptors] || score.toString();
}

/**
 * Clamp a score to valid bounds (0-10)
 * @param score - Raw score value
 * @returns Clamped score between 0-10
 */
export function clampScore(score: number): number {
  return Math.max(SCORE_BOUNDS.MIN, Math.min(SCORE_BOUNDS.MAX, score));
}

/**
 * Validate if a score is within valid range
 * @param score - Score to validate
 * @returns True if score is between 0-10
 */
export function isValidScore(score: number): boolean {
  return !isNaN(score) && score >= SCORE_BOUNDS.MIN && score <= SCORE_BOUNDS.MAX;
}
