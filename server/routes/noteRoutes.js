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

// ==========================================
// Notes collection
// ==========================================

// Browse notes can remain public.
// Only approved notes should be returned by getNotes().
router.route('/')
  .get(getNotes)
  .post(protect, upload.single('file'), createNote);


// ==========================================
// User's own uploads
// ==========================================

router.get('/my-uploads', protect, getMyUploads);


// ==========================================
// Single note item
// ==========================================

// Login required to view a single note.
// This prevents logged-out users from opening
// /api/notes/:id directly.
router.route('/:id')
  .get(protect, getNoteById)
  .put(protect, updateNote)
  .delete(protect, deleteNote);


// ==========================================
// Download PDF
// ==========================================

// Login required to download/open PDF.
// This also protects direct API download URLs.
router.get('/:id/download', protect, downloadNote);


// ==========================================
// Report note
// ==========================================

router.post('/:id/report', protect, reportNote);


// ==========================================
// Reviews on note
// ==========================================

router.route('/:id/reviews')
  .get(getReviewsForNote)
  .post(protect, addOrUpdateReview);


export default router;