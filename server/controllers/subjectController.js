import Subject from '../models/Subject.js';
import Note from '../models/Note.js';

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Public
export const getSubjects = async (req, res, next) => {
  try {
    const { semester, branch } = req.query;
    const query = {};

    if (semester && semester !== 'all') {
      query.semester = Number(semester);
    }
    if (branch && branch !== 'all') {
      query.branch = branch;
    }

    const subjects = await Subject.find(query).sort({ semester: 1, name: 1 });

    // Aggregate note count per subject
    const subjectStats = await Note.aggregate([
      {
        $group: {
          _id: '$subject',
          noteCount: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    subjectStats.forEach((s) => {
      countMap[s._id.toString()] = s.noteCount;
    });

    const subjectsWithCount = subjects.map((sub) => ({
      ...sub.toObject(),
      notesCount: countMap[sub._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      count: subjectsWithCount.length,
      subjects: subjectsWithCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
export const createSubject = async (req, res, next) => {
  try {
    const { name, code, semester, branch, description } = req.body;

    if (!name || !code || !semester || !branch) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subject name, code, semester, and branch.',
      });
    }

    const existingCode = await Subject.findOne({ code: code.trim().toUpperCase() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `A subject with code '${code.trim().toUpperCase()}' already exists.`,
      });
    }

    const subject = await Subject.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      semester: Number(semester),
      branch: branch.trim(),
      description: description ? description.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
export const updateSubject = async (req, res, next) => {
  try {
    const { name, code, semester, branch, description } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    if (code && code.trim().toUpperCase() !== subject.code) {
      const codeCheck = await Subject.findOne({ code: code.trim().toUpperCase() });
      if (codeCheck) {
        return res.status(400).json({
          success: false,
          message: `Subject code '${code.trim().toUpperCase()}' is already in use.`,
        });
      }
      subject.code = code.trim().toUpperCase();
    }

    if (name) subject.name = name.trim();
    if (semester) subject.semester = Number(semester);
    if (branch) subject.branch = branch.trim();
    if (description !== undefined) subject.description = description.trim();

    await subject.save();

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    // Check if any notes are mapped to this subject
    const noteCount = await Note.countDocuments({ subject: subject._id });
    if (noteCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject. It currently contains ${noteCount} uploaded note(s). Please reassign or delete these notes first.`,
      });
    }

    await Subject.findByIdAndDelete(subject._id);

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
