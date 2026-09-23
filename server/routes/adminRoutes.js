import express from 'express';
import {
  getStats,
  getUsers,
  deleteUser,
  getAdminNotes,
  deleteAdminNote,
  getReports,
  updateReportStatus,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect and admin middleware to all admin routes
router.use(protect, admin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.get('/notes', getAdminNotes);
router.delete('/notes/:id', deleteAdminNote);
router.get('/reports', getReports);
router.put('/reports/:id', updateReportStatus);

export default router;
