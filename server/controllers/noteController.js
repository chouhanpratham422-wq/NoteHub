import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Note from '../models/Note.js';
import Subject from '../models/Subject.js';
import Review from '../models/Review.js';
import Report from '../models/Report.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all notes with search, filter, sort, pagination
// @route   GET /api/notes
// @access  Public
export const getNotes = async (req, res, next) => {
  try {
    const { search, subject, semester, branch, sort, page = 1, limit = 9 } = req.query;

    const query = {};

    // Search filter
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    // Subject filter
    if (subject && subject !== 'all') {
      query.subject = subject;
    }

    // Semester filter
    if (semester && semester !== 'all') {
      query.semester = Number(semester);
    }

    // Branch filter
    if (branch && branch !== 'all') {
      query.branch = branch;
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default latest
    if (sort === 'popular') {
      sortOption = { downloadCount: -1, createdAt: -1 };
    } else if (sort === 'rating') {
      sortOption = { averageRating: -1, totalReviews: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 9;
    const skip = (pageNum - 1) * limitNum;

    const totalNotes = await Note.countDocuments(query);
    const totalPages = Math.ceil(totalNotes / limitNum);

    const notes = await Note.find(query)
      .populate('subject', 'name code semester branch')
      .populate('uploadedBy', 'name email college branch')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: notes.length,
      totalNotes,
      totalPages,
      currentPage: pageNum,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single note by ID with author and subject
// @route   GET /api/notes/:id
// @access  Public
export const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('subject', 'name code semester branch description')
      .populate('uploadedBy', 'name email college branch semester profileImage');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found with the specified ID',
      });
    }

    res.status(200).json({
      success: true,
      note,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload / Create a new note
// @route   POST /api/notes
// @access  Private (Student & Admin)
export const createNote = async (req, res, next) => {
  try {
    const { title, description, subject, semester, branch, tags } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF document for your note.',
      });
    }

    if (!title || !description || !subject || !semester || !branch) {
      // Clean up uploaded file if validation fails
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields: title, description, subject, semester, and branch.',
      });
    }

    // Verify subject exists
    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Selected subject does not exist.',
      });
    }

    // Parse tags array
    let parsedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else if (typeof tags === 'string') {
        parsedTags = tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }
    }

    const note = await Note.create({
      title: title.trim(),
      description: description.trim(),
      subject,
      semester: Number(semester),
      branch: branch.trim(),
      tags: parsedTags,
      fileUrl: req.file.filename,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
    });

    const populatedNote = await Note.findById(note._id)
      .populate('subject', 'name code')
      .populate('uploadedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Note uploaded successfully',
      note: populatedNote,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Update an uploaded note
// @route   PUT /api/notes/:id
// @access  Private (Owner or Admin)
export const updateNote = async (req, res, next) => {
  try {
    const { title, description, subject, semester, branch, tags } = req.body;
    let note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check ownership or admin
    if (note.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this note.',
      });
    }

    if (title) note.title = title.trim();
    if (description) note.description = description.trim();
    if (subject) note.subject = subject;
    if (semester) note.semester = Number(semester);
    if (branch) note.branch = branch.trim();
    if (tags) {
      if (Array.isArray(tags)) {
        note.tags = tags;
      } else if (typeof tags === 'string') {
        note.tags = tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }
    }

    note.updatedAt = Date.now();
    await note.save();

    const updatedNote = await Note.findById(note._id)
      .populate('subject', 'name code')
      .populate('uploadedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      note: updatedNote,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private (Owner or Admin)
export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check ownership or admin
    if (note.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this note.',
      });
    }

    // Delete PDF file from uploads directory
    const filePath = path.join(__dirname, '..', 'uploads', note.fileUrl);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (fileErr) {
        console.warn('Could not remove file from disk:', fileErr.message);
      }
    }

    // Delete associated reviews & reports
    await Review.deleteMany({ note: note._id });
    await Report.deleteMany({ note: note._id });

    // Delete note document
    await Note.findByIdAndDelete(note._id);

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notes uploaded by logged-in user
// @route   GET /api/notes/my-uploads
// @access  Private
export const getMyUploads = async (req, res, next) => {
  try {
    const notes = await Note.find({ uploadedBy: req.user.id })
      .populate('subject', 'name code semester branch')
      .sort({ createdAt: -1 });

    const totalDownloads = notes.reduce((sum, n) => sum + (n.downloadCount || 0), 0);
    const avgRating =
      notes.length > 0
        ? Math.round(
            (notes.reduce((sum, n) => sum + (n.averageRating || 0), 0) / notes.length) * 10
          ) / 10
        : 0;

    res.status(200).json({
      success: true,
      count: notes.length,
      totalDownloads,
      averageRating: avgRating,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download a note's PDF and increment download count
// @route   GET /api/notes/:id/download
// @access  Public
export const downloadNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    const filePath = path.join(__dirname, '..', 'uploads', note.fileUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'The requested PDF file is not available on the server.',
      });
    }

    // Increment download count
    note.downloadCount += 1;
    await note.save();

    // Send file with attachment header
    res.download(filePath, note.originalFileName || `${note.title}.pdf`);
  } catch (error) {
    next(error);
  }
};

// @desc    Report an inappropriate note
// @route   POST /api/notes/:id/report
// @access  Private
export const reportNote = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for reporting this note.',
      });
    }

    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    const report = await Report.create({
      note: note._id,
      reportedBy: req.user._id,
      reason: reason.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Thank you. The note has been flagged for admin review.',
      report,
    });
  } catch (error) {
    next(error);
  }
};
