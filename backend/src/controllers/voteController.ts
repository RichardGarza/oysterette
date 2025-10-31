import { Request, Response } from 'express';
import * as votingService from '../services/votingService';

/**
 * Vote Controller
 * Handles API endpoints for review voting
 */

// POST /api/reviews/:reviewId/vote
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

    // @ts-expect-error - TypeScript doesn't narrow req.userId after null check
    await votingService.voteOnReview((req.userId as string), reviewId, isAgree);

    res.json({ message: 'Vote recorded successfully' });
  } catch (error: any) {
    console.error('Error voting on review:', error);
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

    // @ts-expect-error - TypeScript doesn't narrow req.userId after null check
    await votingService.removeVote((req.userId as string), reviewId);

    res.json({ message: 'Vote removed successfully' });
  } catch (error: any) {
    console.error('Error removing vote:', error);
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
    const voteMap = await votingService.getUserVotes((req.userId as string), reviewIdArray);

    // Convert Map to object for JSON response
    const votes: Record<string, boolean | null> = {};
    voteMap.forEach((value, key) => {
      votes[key] = value;
    });

    res.json({ votes });
  } catch (error: any) {
    console.error('Error getting user votes:', error);
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
    console.error('Error getting user credibility:', error);
    res.status(500).json({ error: error.message });
  }
}
