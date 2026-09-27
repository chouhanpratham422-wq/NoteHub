import express from 'express';

import {
  getStats,
  getUsers,
  deleteUser,
  getAdminNotes,
  getPendingNotes,
  approveNote,
  rejectNote,
  deleteAdminNote,
  getReports,
  updateReportStatus,
} from '../controllers/adminController.js';

import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();


// =======================================
// ADMIN AUTHENTICATION
// =======================================

// Every route in this file requires:
// 1. Logged-in user
// 2. Admin role
router.use(protect, admin);


// =======================================
// DASHBOARD
// =======================================

router.get('/stats', getStats);


// =======================================
// USERS
// =======================================

// Get all users
router.get('/users', getUsers);

// Delete user
router.delete('/users/:id', deleteUser);


// =======================================
// PENDING NOTES
// =======================================

// IMPORTANT:
// /notes/pending must come BEFORE /notes/:id
// so "pending" is not treated as a note ID.

// Get all pending notes
router.get('/notes/pending', getPendingNotes);

// Approve a note
router.put('/notes/:id/approve', approveNote);

// Reject a note
router.put('/notes/:id/reject', rejectNote);


// =======================================
// ALL ADMIN NOTES
// =======================================

// Get all notes for Admin.
//
// This list can contain:
// - APPROVED
// - PENDING
// - REJECTED
//
// The frontend should display the status clearly.
router.get('/notes', getAdminNotes);

// Delete any note as Admin
router.delete('/notes/:id', deleteAdminNote);


// =======================================
// REPORTS
// =======================================

// Get all reports
router.get('/reports', getReports);

// Update report status
router.put('/reports/:id', updateReportStatus);


export default router;