import { Request, Response } from 'express';
import logger from '../utils/logger';
import prisma from '../lib/prisma';
import { ReviewRating } from '@prisma/client';
import { recalculateOysterRatings } from '../services/ratingService';

// Create a review
export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const {
      oysterId,
      rating,
      size,
      body,
      sweetBrininess,
      flavorfulness,
      creaminess,
      notes,
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

    // Check if user already reviewed this oyster
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

// Get reviews for an oyster
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

// Get user's reviews
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

// Check if user has existing review for an oyster
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

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_oysterId: {
          userId: req.userId,
          oysterId,
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

// Update a review
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

// Delete a review
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
