import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    // =======================================
    // REPORTED NOTE
    // =======================================
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      required: [true, 'Reported note reference is required'],
    },

    // =======================================
    // USER WHO SUBMITTED THE REPORT
    // =======================================
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter user reference is required'],
    },

    // =======================================
    // REPORT REASON
    // =======================================
    reason: {
      type: String,
      required: [true, 'Reason for reporting is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },

    // =======================================
    // REPORT STATUS
    // =======================================
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
      index: true,
    },

    // =======================================
    // ADMIN WHO REVIEWED THE REPORT
    // =======================================
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // =======================================
    // WHEN ADMIN REVIEWED THE REPORT
    // =======================================
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model('Report', reportSchema);

export default Report;