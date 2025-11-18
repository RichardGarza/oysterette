import prisma from '../lib/prisma';

/**
 * Voting Service
 * Handles review voting and reviewer credibility calculations
 */

// Configuration for voting weight calculations
const VOTING_CONFIG = {
  // Vote weights
  agreeWeight: 1.0,      // +1.0 per agree vote
  disagreeWeight: -0.6,  // -0.6 per disagree vote

  // Credibility score bounds
  minCredibility: 0.5,   // Minimum credibility multiplier
  maxCredibility: 1.5,   // Maximum credibility multiplier
  neutralCredibility: 1.0, // Neutral starting point

  // Weighted score bounds for reviews
  minWeightedScore: 0.4,  // Minimum review weight
  maxWeightedScore: 1.5,  // Maximum review weight
};

/**
 * Calculate credibility score for a user based on their vote history
 * Formula: 1.0 + (netVotes / totalReviews) * 0.5
 * Where netVotes = agrees - disagrees
 */
function calculateCredibilityScore(
  totalAgrees: number,
  totalDisagrees: number,
  reviewCount: number
): number {
  if (reviewCount === 0) {
    return VOTING_CONFIG.neutralCredibility;
  }

  // Net vote bias: more agrees = positive, more disagrees = negative
  const netVotes = totalAgrees - totalDisagrees;

  // Scale by review count to prevent single-review users from having extreme scores
  const biasRatio = netVotes / Math.max(reviewCount, 1);

  // Apply scaling factor (0.5 means max deviation is ±0.5 from neutral 1.0)
  const credibility = VOTING_CONFIG.neutralCredibility + (biasRatio * 0.5);

  // Clamp to bounds
  return Math.max(
    VOTING_CONFIG.minCredibility,
    Math.min(VOTING_CONFIG.maxCredibility, credibility)
  );
}

/**
 * Calculate weighted score for a review based on community voting
 * Formula: 1.0 + (netVoteScore / 10)
 * Where netVoteScore = (agrees * 1.0) + (disagrees * -0.6)
 */
function calculateReviewWeightedScore(agreeCount: number, disagreeCount: number): {
  netVoteScore: number;
  weightedScore: number;
} {
  // Calculate net vote score
  const netVoteScore =
    (agreeCount * VOTING_CONFIG.agreeWeight) +
    (disagreeCount * VOTING_CONFIG.disagreeWeight);

  // Convert to weight multiplier (neutral at 1.0)
  const weightedScore = 1.0 + (netVoteScore / 10);

  // Clamp to bounds
  const clampedScore = Math.max(
    VOTING_CONFIG.minWeightedScore,
    Math.min(VOTING_CONFIG.maxWeightedScore, weightedScore)
  );

  return {
    netVoteScore,
    weightedScore: clampedScore,
  };
}

/**
 * Cast or update a vote on a review
 */
export async function voteOnReview(
  userId: string,
  reviewId: string,
  isAgree: boolean
): Promise<void> {
  // Check if vote already exists
  const existingVote = await prisma.reviewVote.findUnique({
    where: {
      userId_reviewId: {
        userId,
        reviewId,
      },
    },
  });

  // Get review to check it's not the user's own review
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  // Cannot vote on own review (skip check for anonymous reviews)
  if (review.userId && review.userId === userId) {
    throw new Error('Cannot vote on your own review');
  }

  // Use transaction to ensure consistency
  await prisma.$transaction(async (tx: any) => {
    if (existingVote) {
      // Update existing vote if it changed
      if (existingVote.isAgree !== isAgree) {
        await tx.reviewVote.update({
          where: { id: existingVote.id },
          data: { isAgree },
        });

        // Update review counts
        const agreeChange = isAgree ? 1 : -1;
        const disagreeChange = isAgree ? -1 : 1;

        await tx.review.update({
          where: { id: reviewId },
          data: {
            agreeCount: { increment: agreeChange },
            disagreeCount: { increment: disagreeChange },
          },
        });

        // Update reviewer's totals (only for authenticated reviews)
        if (review.userId) {
          await tx.user.update({
            where: { id: review.userId },
            data: {
              totalAgrees: { increment: agreeChange },
              totalDisagrees: { increment: disagreeChange },
            },
          });
        }
      }
      // If vote didn't change, do nothing
    } else {
      // Create new vote
      await tx.reviewVote.create({
        data: {
          userId,
          reviewId,
          isAgree,
        },
      });

      // Update review counts
      await tx.review.update({
        where: { id: reviewId },
        data: {
          agreeCount: isAgree ? { increment: 1 } : undefined,
          disagreeCount: !isAgree ? { increment: 1 } : undefined,
        },
      });

      // Update reviewer's totals (only for authenticated reviews)
      if (review.userId) {
        await tx.user.update({
          where: { id: review.userId },
          data: {
            totalAgrees: isAgree ? { increment: 1 } : undefined,
            totalDisagrees: !isAgree ? { increment: 1 } : undefined,
          },
        });
      }
    }
  });

  // Recalculate review weighted score
  await recalculateReviewScore(reviewId);

  // Recalculate reviewer credibility (only for authenticated reviews)
  if (review.userId) {
    await recalculateUserCredibility(review.userId);
  }
}

/**
 * Remove a vote from a review
 */
export async function removeVote(userId: string, reviewId: string): Promise<void> {
  const vote = await prisma.reviewVote.findUnique({
    where: {
      userId_reviewId: {
        userId,
        reviewId,
      },
    },
    include: {
      review: true,
    },
  });

  if (!vote) {
    throw new Error('Vote not found');
  }

  // Use transaction
  await prisma.$transaction(async (tx: any) => {
    // Delete vote
    await tx.reviewVote.delete({
      where: { id: vote.id },
    });

    // Update review counts
    await tx.review.update({
      where: { id: reviewId },
      data: {
        agreeCount: vote.isAgree ? { decrement: 1 } : undefined,
        disagreeCount: !vote.isAgree ? { decrement: 1 } : undefined,
      },
    });

    // Update reviewer's totals (only for authenticated reviews)
    if (vote.review.userId) {
      await tx.user.update({
        where: { id: vote.review.userId },
        data: {
          totalAgrees: vote.isAgree ? { decrement: 1 } : undefined,
          totalDisagrees: !vote.isAgree ? { decrement: 1 } : undefined,
        },
      });
    }
  });

  // Recalculate review weighted score
  await recalculateReviewScore(reviewId);

  // Recalculate reviewer credibility (only for authenticated reviews)
  if (vote.review.userId) {
    await recalculateUserCredibility(vote.review.userId);
  }
}

/**
 * Recalculate weighted score for a specific review
 */
export async function recalculateReviewScore(reviewId: string): Promise<void> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  const { netVoteScore, weightedScore } = calculateReviewWeightedScore(
    review.agreeCount,
    review.disagreeCount
  );

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      netVoteScore,
      weightedScore,
    },
  });
}

/**
 * Recalculate credibility score for a user
 */
export async function recalculateUserCredibility(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const credibilityScore = calculateCredibilityScore(
    user.totalAgrees,
    user.totalDisagrees,
    user.reviewCount
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      credibilityScore,
    },
  });
}

/**
 * Get vote status for a user on multiple reviews
 */
export async function getUserVotes(
  userId: string,
  reviewIds: string[]
): Promise<Map<string, boolean | null>> {
  const votes = await prisma.reviewVote.findMany({
    where: {
      userId,
      reviewId: { in: reviewIds },
    },
  });

  const voteMap = new Map<string, boolean | null>();
  reviewIds.forEach((id) => {
    const vote = votes.find((v: any) => v.reviewId === id);
    voteMap.set(id, vote ? vote.isAgree : null);
  });

  return voteMap;
}

/**
 * Get reviewer credibility badge
 */
export function getCredibilityBadge(credibilityScore: number): {
  level: string;
  color: string;
  icon: string;
} {
  if (credibilityScore >= 1.3) {
    return { level: 'Expert', color: '#f39c12', icon: '⭐' };
  } else if (credibilityScore >= 1.15) {
    return { level: 'Trusted', color: '#3498db', icon: '✓' };
  } else if (credibilityScore >= 0.85) {
    return { level: 'Standard', color: '#95a5a6', icon: '' };
  } else {
    return { level: 'New', color: '#95a5a6', icon: '' };
  }
}
