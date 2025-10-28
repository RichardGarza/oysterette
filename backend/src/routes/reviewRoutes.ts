import express from 'express';
import {
  createReview,
  getOysterReviews,
  getUserReviews,
  updateReview,
  deleteReview,
} from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/oyster/:oysterId', getOysterReviews);

// Protected routes (require authentication)
router.post('/', authenticate, createReview);
router.get('/user', authenticate, getUserReviews);
router.put('/:reviewId', authenticate, updateReview);
router.delete('/:reviewId', authenticate, deleteReview);

export default router;
