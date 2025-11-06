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
