import asyncHandler from 'express-async-handler';

import User from '../models/User.js';
import Note from '../models/Note.js';
import Subject from '../models/Subject.js';
import Report from '../models/Report.js';


// =======================================
// GET ADMIN DASHBOARD STATS
// =======================================
export const getStats = asyncHandler(async (req, res) => {

  // Only approved notes are considered
  // available notes.
  const approvedNoteFilter = {
    status: 'approved',
  };

  const [
    totalUsers,
    totalNotes,
    totalSubjects,
    totalReports,
    recentUsers,
    recentNotes,
    subjectDistribution,
  ] = await Promise.all([

    // -----------------------------------
    // TOTAL USERS
    // -----------------------------------
    User.countDocuments(),

    // -----------------------------------
    // TOTAL APPROVED NOTES
    // -----------------------------------
    Note.countDocuments(approvedNoteFilter),

    // -----------------------------------
    // TOTAL SUBJECTS
    // -----------------------------------
    Subject.countDocuments(),

    // -----------------------------------
    // PENDING REPORTS
    // -----------------------------------
    Report.countDocuments({
      status: 'pending',
    }),

    // -----------------------------------
    // RECENT USERS
    // -----------------------------------
    User.find()
      .select(
        'name email role college branch createdAt'
      )
      .sort({
        createdAt: -1,
      })
      .limit(5),

    // -----------------------------------
    // RECENT NOTES
    //
    // Admin dashboard can see recent notes
    // including their current status.
    // -----------------------------------
    Note.find()
      .populate(
        'subject',
        'name code'
      )
      .populate(
        'uploadedBy',
        'name email'
      )
      .sort({
        createdAt: -1,
      })
      .limit(5),

    // -----------------------------------
    // SUBJECT-WISE APPROVED NOTE COUNT
    // -----------------------------------
    Note.aggregate([
      {
        $match: approvedNoteFilter,
      },

      {
        $group: {
          _id: '$subject',
          count: {
            $sum: 1,
          },
        },
      },

      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject',
        },
      },

      {
        $unwind: {
          path: '$subject',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 0,
          subject: '$subject.name',
          code: '$subject.code',
          count: 1,
        },
      },

      {
        $sort: {
          count: -1,
        },
      },
    ]),
  ]);

  res.status(200).json({
    success: true,

    stats: {
      totalUsers,
      totalNotes,
      totalSubjects,
      totalReports,
    },

    recentUsers,
    recentNotes,
    subjectDistribution,
  });
});


// =======================================
// GET ALL USERS
// =======================================
export const getUsers = asyncHandler(async (req, res) => {

  const {
    search = '',
    role,
    page = 1,
    limit = 20,
  } = req.query;

  const query = {};

  // -----------------------------------
  // SEARCH
  // -----------------------------------
  if (search.trim()) {
    query.$or = [
      {
        name: {
          $regex: search.trim(),
          $options: 'i',
        },
      },
      {
        email: {
          $regex: search.trim(),
          $options: 'i',
        },
      },
      {
        college: {
          $regex: search.trim(),
          $options: 'i',
        },
      },
    ];
  }

  // -----------------------------------
  // ROLE FILTER
  // -----------------------------------
  if (
    role &&
    ['student', 'admin'].includes(role)
  ) {
    query.role = role;
  }

  const pageNumber = Math.max(
    Number(page) || 1,
    1
  );

  const limitNumber = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const skip =
    (pageNumber - 1) * limitNumber;

  const [
    users,
    totalUsers,
  ] = await Promise.all([

    User.find(query)
      .select('-password')
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limitNumber),

    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,

    count: users.length,

    total: totalUsers,

    page: pageNumber,

    pages: Math.ceil(
      totalUsers / limitNumber
    ),

    users,
  });
});


// =======================================
// DELETE USER
// =======================================
export const deleteUser = asyncHandler(
  async (req, res) => {

    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message:
          'Admin users cannot be deleted from this panel.',
      });
    }

    await User.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message:
        'User deleted successfully.',
    });
  }
);


// =======================================
// GET ALL ADMIN NOTES
// =======================================
//
// IMPORTANT:
// Admin Manage All Notes shows:
// - approved
// - pending
// - rejected
//
// So Admin can clearly see the status.
// =======================================
export const getAdminNotes = asyncHandler(
  async (req, res) => {

    const {
      search = '',
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // -----------------------------------
    // STATUS FILTER
    // -----------------------------------
    if (
      status &&
      [
        'pending',
        'approved',
        'rejected',
      ].includes(status)
    ) {
      query.status = status;
    }

    // -----------------------------------
    // SEARCH
    // -----------------------------------
    if (search.trim()) {

      query.$or = [
        {
          title: {
            $regex: search.trim(),
            $options: 'i',
          },
        },

        {
          description: {
            $regex: search.trim(),
            $options: 'i',
          },
        },

        {
          originalFileName: {
            $regex: search.trim(),
            $options: 'i',
          },
        },
      ];
    }

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const [
      notes,
      totalNotes,
    ] = await Promise.all([

      Note.find(query)
        .populate(
          'subject',
          'name code semester branch'
        )
        .populate(
          'uploadedBy',
          'name email college branch'
        )
        .populate(
          'reviewedBy',
          'name email'
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber),

      Note.countDocuments(query),
    ]);

    const totalPages = Math.ceil(
      totalNotes / limitNumber
    );

    res.status(200).json({
      success: true,

      count: notes.length,

      total: totalNotes,

      totalNotes,

      page: pageNumber,

      currentPage: pageNumber,

      pages: totalPages,

      totalPages,

      notes,
    });
  }
);


// =======================================
// GET PENDING NOTES
// =======================================
export const getPendingNotes =
  asyncHandler(async (req, res) => {

    const notes = await Note.find({
      status: 'pending',
    })
      .populate(
        'subject',
        'name code semester branch'
      )
      .populate(
        'uploadedBy',
        'name email college branch'
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,

      count: notes.length,

      notes,
    });
  });


// =======================================
// APPROVE NOTE
// =======================================
export const approveNote = asyncHandler(
  async (req, res) => {

    const note = await Note.findById(
      req.params.id
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
    }

    if (note.status === 'approved') {
      return res.status(400).json({
        success: false,
        message:
          'This note is already approved.',
      });
    }

    // -----------------------------------
    // APPROVE
    // -----------------------------------
    note.status = 'approved';

    note.rejectionReason = '';

    note.reviewedBy = req.user._id;

    note.reviewedAt = new Date();

    await note.save();

    const updatedNote =
      await Note.findById(note._id)
        .populate(
          'subject',
          'name code semester branch'
        )
        .populate(
          'uploadedBy',
          'name email'
        )
        .populate(
          'reviewedBy',
          'name email'
        );

    res.status(200).json({
      success: true,

      message:
        'Note approved successfully. It is now visible to students.',

      note: updatedNote,
    });
  }
);


// =======================================
// REJECT NOTE
// =======================================
export const rejectNote = asyncHandler(
  async (req, res) => {

    const {
      rejectionReason,
    } = req.body;

    const note = await Note.findById(
      req.params.id
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
    }

    if (note.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message:
          'This note is already rejected.',
      });
    }

    // -----------------------------------
    // REJECT
    // -----------------------------------
    note.status = 'rejected';

    note.rejectionReason =
      rejectionReason &&
      rejectionReason.trim()
        ? rejectionReason.trim()
        : 'Note did not meet the portal moderation requirements.';

    note.reviewedBy = req.user._id;

    note.reviewedAt = new Date();

    await note.save();

    const updatedNote =
      await Note.findById(note._id)
        .populate(
          'subject',
          'name code semester branch'
        )
        .populate(
          'uploadedBy',
          'name email'
        )
        .populate(
          'reviewedBy',
          'name email'
        );

    res.status(200).json({
      success: true,

      message:
        'Note rejected successfully.',

      note: updatedNote,
    });
  }
);


// =======================================
// DELETE ADMIN NOTE
// =======================================
export const deleteAdminNote =
  asyncHandler(async (req, res) => {

    const note = await Note.findById(
      req.params.id
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
    }

    // -----------------------------------
    // DELETE NOTE
    // -----------------------------------
    await Note.findByIdAndDelete(
      req.params.id
    );

    // -----------------------------------
    // MARK RELATED REPORTS AS REVIEWED
    // -----------------------------------
    await Report.updateMany(
      {
        note: req.params.id,

        status: {
          $in: [
            'pending',
            'dismissed',
          ],
        },
      },

      {
        $set: {
          status: 'reviewed',
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,

      message:
        'Note deleted successfully and related reports marked as reviewed.',
    });
  });


// =======================================
// GET REPORTS
// =======================================
export const getReports = asyncHandler(
  async (req, res) => {

    const {
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // -----------------------------------
    // STATUS FILTER
    // -----------------------------------
    if (
      status &&
      [
        'pending',
        'reviewed',
        'dismissed',
      ].includes(status)
    ) {
      query.status = status;
    }

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    // -----------------------------------
    // FIX OLD REPORTS
    // WHERE NOTE WAS ALREADY DELETED
    // -----------------------------------
    const existingNoteIds =
      await Note.find().distinct('_id');

    await Report.updateMany(
      {
        note: {
          $nin: existingNoteIds,
        },

        status: {
          $in: [
            'pending',
            'dismissed',
          ],
        },
      },

      {
        $set: {
          status: 'reviewed',
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        },
      }
    );

    // -----------------------------------
    // GET REPORTS
    // -----------------------------------
    const [
      reports,
      totalReports,
    ] = await Promise.all([

      Report.find(query)
        .populate(
          'reportedBy',
          'name email'
        )
        .populate(
          'note',
          'title originalFileName status'
        )
        .populate(
          'reviewedBy',
          'name email'
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber),

      Report.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,

      count: reports.length,

      total: totalReports,

      page: pageNumber,

      pages: Math.ceil(
        totalReports / limitNumber
      ),

      reports,
    });
  }
);


// =======================================
// UPDATE REPORT STATUS
// =======================================
export const updateReportStatus =
  asyncHandler(async (req, res) => {

    const { status } = req.body;

    if (
      ![
        'pending',
        'reviewed',
        'dismissed',
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid report status.',
      });
    }

    const report =
      await Report.findById(
        req.params.id
      );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }

    report.status = status;

    report.reviewedBy = req.user._id;

    report.reviewedAt = new Date();

    await report.save();

    const updatedReport =
      await Report.findById(report._id)
        .populate(
          'reportedBy',
          'name email'
        )
        .populate(
          'note',
          'title originalFileName status'
        )
        .populate(
          'reviewedBy',
          'name email'
        );

    res.status(200).json({
      success: true,

      message:
        'Report status updated successfully.',

      report: updatedReport,
    });
  });