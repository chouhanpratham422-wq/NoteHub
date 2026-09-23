import express from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getMyUploads,
  downloadNote,
  reportNote,
} from '../controllers/noteController.js';
import {
  getReviewsForNote,
  addOrUpdateReview,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Notes collection
router.route('/')
  .get(getNotes)
  .post(protect, upload.single('file'), createNote);

// User's own uploads
router.get('/my-uploads', protect, getMyUploads);

// Single note item
router.route('/:id')
  .get(getNoteById)
  .put(protect, updateNote)
  .delete(protect, deleteNote);

// Download PDF
router.get('/:id/download', downloadNote);

// Report note
router.post('/:id/report', protect, reportNote);

// Reviews on note
router.route('/:id/reviews')
  .get(getReviewsForNote)
  .post(protect, addOrUpdateReview);

export default router;
