/**
 * Vote Controller
 *
 * Handles review voting operations including:
 * - Casting agree/disagree votes on reviews
 * - Removing votes
 * - Fetching user vote status for multiple reviews
 * - Retrieving user credibility scores
 *
 * All voting operations automatically trigger:
 * - Review weighted score recalculation
 * - Reviewer credibility score updates
 */

import { Request, Response } from 'express';
import logger from '../utils/logger';
import * as votingService from '../services/votingService';
import { awardXP, XP_REWARDS } from '../services/xpService';

/**
 * Cast a vote on a review
 *
 * Users can vote "agree" or "disagree" on reviews. Voting affects:
 * - Review's weighted score (increases/decreases influence)
 * - Reviewer's credibility score (improves/degrades over time)
 *
 * @route POST /api/reviews/:reviewId/vote
 * @requires Authentication
 * @param req.params.reviewId - Review UUID
 * @param req.body.isAgree - true for agree, false for disagree
 * @returns 200 - Success message
 * @returns 400 - Invalid vote type or error
 * @returns 401 - Not authenticated
 */
export async function voteOnReview(req: Request, res: Response) {
  try {
    const { reviewId } = req.params;
    const { isAgree } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (typeof isAgree !== 'boolean') {
      return res.status(400).json({ error: 'isAgree must be a boolean' });
    }

    await votingService.voteOnReview(req.userId!, reviewId!, isAgree);

    // Award XP for voting
    await awardXP(req.userId!, XP_REWARDS.VOTE, 'Vote on review');

    res.json({ message: 'Vote recorded successfully' });
  } catch (error: any) {
    logger.error('Error voting on review:', error);
    res.status(400).json({ error: error.message });
  }
}

// DELETE /api/reviews/:reviewId/vote
export async function removeVote(req: Request, res: Response) {
  try {
    const { reviewId } = req.params;

    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await votingService.removeVote(req.userId!, reviewId!);

    res.json({ message: 'Vote removed successfully' });
  } catch (error: any) {
    logger.error('Error removing vote:', error);
    res.status(400).json({ error: error.message });
  }
}

// GET /api/reviews/votes?reviewIds=id1,id2,id3
export async function getUserVotes(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { reviewIds } = req.query;

    if (!reviewIds || typeof reviewIds !== 'string') {
      return res.status(400).json({ error: 'reviewIds query parameter required' });
    }

    const reviewIdArray = reviewIds.split(',');
    const voteMap = await votingService.getUserVotes(req.userId!, reviewIdArray);

    // Convert Map to object for JSON response
    const votes: Record<string, boolean | null> = {};
    voteMap.forEach((value, key) => {
      votes[key] = value;
    });

    res.json({ votes });
  } catch (error: any) {
    logger.error('Error getting user votes:', error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/users/:userId/credibility
export async function getUserCredibility(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    const user = await require('../lib/prisma').default.user.findUnique({
      where: { id: userId },
      select: {
        credibilityScore: true,
        totalAgrees: true,
        totalDisagrees: true,
        reviewCount: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const badge = votingService.getCredibilityBadge(user.credibilityScore);

    res.json({
      credibilityScore: user.credibilityScore,
      totalAgrees: user.totalAgrees,
      totalDisagrees: user.totalDisagrees,
      reviewCount: user.reviewCount,
      badge,
    });
  } catch (error: any) {
    logger.error('Error getting user credibility:', error);
    res.status(500).json({ error: error.message });
  }
}
