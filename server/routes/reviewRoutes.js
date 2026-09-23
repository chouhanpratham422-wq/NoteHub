import express from 'express';
import {
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

export default router;
