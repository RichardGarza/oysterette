/**
 * Review Controller
 *
 * Handles review operations including:
 * - Creating reviews with duplicate detection
 * - Fetching reviews for oysters and users
 * - Updating and deleting reviews
 * - Checking for existing user reviews
 * - Automatic rating recalculation after mutations
 */

import { Request, Response } from 'express';
import logger from '../utils/logger';
import prisma from '../lib/prisma';
import { ReviewRating } from '@prisma/client';
import { recalculateOysterRatings } from '../services/ratingService';
import { invalidateCache, updateBaselineWithReview } from '../services/recommendationService';
import { awardXP, updateStreak, XP_REWARDS } from '../services/xpService';

/**
 * Create a new review for an oyster
 *
 * Validates that the oyster exists and prevents duplicate reviews via unique constraint.
 * Automatically triggers oyster rating recalculation after creation.
 *
 * @route POST /api/reviews
 * @requires Authentication
 * @param req.body.oysterId - UUID of oyster being reviewed
 * @param req.body.rating - Overall rating (LOVE_IT | LIKE_IT | OKAY | MEH)
 * @param req.body.size - Size rating 1-10 (optional)
 * @param req.body.body - Body rating 1-10 (optional)
 * @param req.body.sweetBrininess - Sweet/briny rating 1-10 (optional)
 * @param req.body.flavorfulness - Flavor rating 1-10 (optional)
 * @param req.body.creaminess - Creaminess rating 1-10 (optional)
 * @param req.body.notes - Personal tasting notes (optional)
 * @param req.body.photoUrls - Array of Cloudinary URLs for review photos (optional, max 5)
 * @returns 201 - Created review with user and oyster info
 * @returns 400 - Missing required fields or duplicate review
 * @returns 401 - Not authenticated
 * @returns 404 - Oyster not found
 * @returns 500 - Server error
 */
export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    // Allow anonymous reviews (userId can be null)

    const {
      oysterId,
      rating,
      size,
      body,
      sweetBrininess,
      flavorfulness,
      creaminess,
      notes,
      origin,
      species,
      photoUrls,
    } = req.body;

    // Validation
    if (!oysterId || !rating) {
      res.status(400).json({
        success: false,
        error: 'Oyster ID and rating are required',
      });
      return;
    }

    // Check if oyster exists
    const oyster = await prisma.oyster.findUnique({
      where: { id: oysterId },
    });

    if (!oyster) {
      res.status(404).json({
        success: false,
        error: 'Oyster not found',
      });
      return;
    }

    // Update oyster with crowd-sourced data if provided and missing
    const oysterUpdates: any = {};
    if (origin && origin.trim() && oyster.origin === 'Unknown') {
      oysterUpdates.origin = origin.trim();
    }
    if (species && species.trim() && oyster.species === 'Unknown') {
      oysterUpdates.species = species.trim();
    }

    // Apply updates if any
    if (Object.keys(oysterUpdates).length > 0) {
      await prisma.oyster.update({
        where: { id: oysterId },
        data: oysterUpdates,
      });
      logger.info(`Oyster ${oysterId} updated with crowd-sourced data:`, oysterUpdates);
    }

    // Check if authenticated user already reviewed this oyster
    if (req.userId) {
      const existingReview = await prisma.review.findUnique({
        where: {
          userId_oysterId: {
            userId: req.userId,
            oysterId,
          },
        },
      });

      if (existingReview) {
        res.status(400).json({
          success: false,
          error: 'You have already reviewed this oyster',
        });
        return;
      }
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: req.userId,
        oysterId,
        rating: rating as ReviewRating,
        size,
        body,
        sweetBrininess,
        flavorfulness,
        creaminess,
        notes,
        photoUrls: photoUrls || [],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        oyster: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Recalculate oyster ratings after creating review
    await recalculateOysterRatings(oysterId);

    // Award XP and update streak (only for authenticated users)
    if (req.userId) {
      const reviewCount = await prisma.review.count({ where: { userId: req.userId } });
      const isFirstReview = reviewCount === 1;
      const xpAmount = isFirstReview ? XP_REWARDS.FIRST_REVIEW : XP_REWARDS.REVIEW_OYSTER;

      await awardXP(req.userId, xpAmount, isFirstReview ? 'First review' : 'Review oyster');
      await updateStreak(req.userId);

      // Update user's baseline profile if this is a positive review
      await updateBaselineWithReview(req.userId, rating, {
        size,
        body,
        sweetBrininess,
        flavorfulness,
        creaminess,
      });

      // Invalidate recommendation cache since user's preferences changed
      invalidateCache(req.userId);
    }

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    logger.error('Create review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Get all reviews for a specific oyster
 *
 * Returns reviews ordered by most recent first.
 *
 * @route GET /api/reviews/oyster/:oysterId
 * @param req.params.oysterId - Oyster UUID
 * @returns 200 - Array of reviews with user info
 * @returns 500 - Server error
 */
export const getOysterReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { oysterId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { oysterId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    logger.error('Get oyster reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Get all reviews written by the authenticated user
 *
 * Returns reviews ordered by most recent first, with full oyster info.
 *
 * @route GET /api/reviews/user
 * @requires Authentication
 * @returns 200 - Array of user's reviews with oyster info
 * @returns 401 - Not authenticated
 * @returns 500 - Server error
 */
export const getUserReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const reviews = await prisma.review.findMany({
      where: { userId: req.userId },
      include: {
        oyster: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    logger.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Check if authenticated user has already reviewed an oyster
 *
 * Used by mobile app to determine whether to show "Add Review" or "Update Review"
 * button. Returns the existing review data if found for pre-filling the form.
 *
 * @route GET /api/reviews/check/:oysterId
 * @requires Authentication
 * @param req.params.oysterId - Oyster UUID to check
 * @returns 200 - { hasReview: true, data: review } or { hasReview: false, data: null }
 * @returns 401 - Not authenticated
 * @returns 500 - Server error
 */
export const checkExistingReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const { oysterId } = req.params;

    // Check if oyster exists
    const oyster = await prisma.oyster.findUnique({
      where: { id: oysterId! },
    });

    if (!oyster) {
      res.status(404).json({
        success: false,
        error: 'Oyster not found',
      });
      return;
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_oysterId: {
          userId: req.userId,
          oysterId: oysterId!,
        },
      },
      include: {
        oyster: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (existingReview) {
      res.status(200).json({
        success: true,
        hasReview: true,
        data: existingReview,
      });
    } else {
      res.status(200).json({
        success: true,
        hasReview: false,
        data: null,
      });
    }
  } catch (error) {
    logger.error('Check existing review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Update an existing review
 *
 * Only the review author can update their review. Automatically triggers
 * oyster rating recalculation after update.
 *
 * @route PUT /api/reviews/:reviewId
 * @requires Authentication
 * @param req.params.reviewId - Review UUID
 * @param req.body - Fields to update (partial review object)
 * @returns 200 - Updated review with oyster info
 * @returns 401 - Not authenticated
 * @returns 403 - Not authorized (not review author)
 * @returns 404 - Review not found
 * @returns 500 - Server error
 */
export const updateReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const { reviewId } = req.params;
    const updateData = req.body;

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      res.status(404).json({
        success: false,
        error: 'Review not found',
      });
      return;
    }

    if (existingReview.userId !== req.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this review',
      });
      return;
    }

    // Update review
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        oyster: true,
      },
    });

    // Recalculate oyster ratings after updating review
    await recalculateOysterRatings(existingReview.oysterId);

    // Update user's baseline profile if this is a positive review
    await updateBaselineWithReview(req.userId, review.rating, {
      size: review.size,
      body: review.body,
      sweetBrininess: review.sweetBrininess,
      flavorfulness: review.flavorfulness,
      creaminess: review.creaminess,
    });

    // Invalidate recommendation cache since user's preferences changed
    invalidateCache(req.userId);

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    logger.error('Update review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Delete a review
 *
 * Only the review author can delete their review. Automatically triggers
 * oyster rating recalculation after deletion.
 *
 * @route DELETE /api/reviews/:reviewId
 * @requires Authentication
 * @param req.params.reviewId - Review UUID
 * @returns 200 - Success confirmation
 * @returns 401 - Not authenticated
 * @returns 403 - Not authorized (not review author)
 * @returns 404 - Review not found
 * @returns 500 - Server error
 */
export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const { reviewId } = req.params;

    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      res.status(404).json({
        success: false,
        error: 'Review not found',
      });
      return;
    }

    if (existingReview.userId !== req.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this review',
      });
      return;
    }

    // Store oysterId before deleting
    const oysterId = existingReview.oysterId;

    // Delete review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Recalculate oyster ratings after deleting review
    await recalculateOysterRatings(oysterId);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};
