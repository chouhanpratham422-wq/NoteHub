import User from '../models/User.js';
import Note from '../models/Note.js';
import Subject from '../models/Subject.js';
import Review from '../models/Review.js';
import Report from '../models/Report.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get dashboard statistics and chart analytics for Admin
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalNotes = await Note.countDocuments();
    const totalSubjects = await Subject.countDocuments();

    // Total downloads aggregation
    const downloadStats = await Note.aggregate([
      {
        $group: {
          _id: null,
          totalDownloads: { $sum: '$downloadCount' },
        },
      },
    ]);
    const totalDownloads = downloadStats.length > 0 ? downloadStats[0].totalDownloads : 0;

    // Recent activity
    const recentNotes = await Note.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('uploadedBy', 'name email')
      .populate('subject', 'name code');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role college branch createdAt');

    const recentReports = await Report.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('note', 'title')
      .populate('reportedBy', 'name email');

    // Chart 1: Notes uploaded over time (last 6 months or 7 days)
    const notesOverTime = await Note.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 10 },
    ]);

    // Chart 2: Notes per subject
    const subjectDistribution = await Note.aggregate([
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          downloads: { $sum: '$downloadCount' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subjectInfo',
        },
      },
      { $unwind: '$subjectInfo' },
      {
        $project: {
          name: '$subjectInfo.name',
          code: '$subjectInfo.code',
          count: 1,
          downloads: 1,
        },
      },
    ]);

    // Chart 3: Registrations over time
    const registrationsOverTime = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalNotes,
        totalSubjects,
        totalDownloads,
      },
      charts: {
        notesOverTime,
        subjectDistribution,
        registrationsOverTime,
      },
      recentActivity: {
        recentNotes,
        recentUsers,
        recentReports,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with search, role filter, pagination
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { college: regex }];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get note counts per user
    const userIds = users.map((u) => u._id);
    const noteCounts = await Note.aggregate([
      { $match: { uploadedBy: { $in: userIds } } },
      { $group: { _id: '$uploadedBy', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    noteCounts.forEach((nc) => {
      countMap[nc._id.toString()] = nc.count;
    });

    const usersWithStats = users.map((u) => ({
      ...u.toObject(),
      notesCount: countMap[u._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      count: users.length,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limitNum),
      currentPage: pageNum,
      users: usersWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrative account.',
      });
    }

    // Delete user's notes and their files
    const userNotes = await Note.find({ uploadedBy: user._id });
    for (const note of userNotes) {
      const filePath = path.join(__dirname, '..', 'uploads', note.fileUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('File delete warning:', e.message);
        }
      }
      await Review.deleteMany({ note: note._id });
      await Report.deleteMany({ note: note._id });
    }
    await Note.deleteMany({ uploadedBy: user._id });

    // Delete reviews by user
    await Review.deleteMany({ user: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: 'User and associated data removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all notes for Admin moderation
// @route   GET /api/admin/notes
// @access  Private/Admin
export const getAdminNotes = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const totalNotes = await Note.countDocuments(query);
    const notes = await Note.find(query)
      .populate('subject', 'name code semester branch')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: notes.length,
      totalNotes,
      totalPages: Math.ceil(totalNotes / limitNum),
      currentPage: pageNum,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete inappropriate note (Admin)
// @route   DELETE /api/admin/notes/:id
// @access  Private/Admin
export const deleteAdminNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    const filePath = path.join(__dirname, '..', 'uploads', note.fileUrl);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('File delete warning:', e.message);
      }
    }

    await Review.deleteMany({ note: note._id });
    await Report.deleteMany({ note: note._id });
    await Note.findByIdAndDelete(note._id);

    res.status(200).json({
      success: true,
      message: 'Note deleted by administrator successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getReports = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate({
        path: 'note',
        select: 'title subject originalFileName uploadedBy',
        populate: {
          path: 'uploadedBy',
          select: 'name email',
        },
      })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update report status
// @route   PUT /api/admin/reports/:id
// @access  Private/Admin
export const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'reviewed', 'dismissed', 'actioned'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    report.status = status;
    await report.save();

    res.status(200).json({
      success: true,
      message: `Report marked as ${status}`,
      report,
    });
  } catch (error) {
    next(error);
  }
};
