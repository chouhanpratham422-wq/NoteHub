import mongoose from 'mongoose';
import Note from './Note.js';

const reviewSchema = new mongoose.Schema(
  {
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      required: [true, 'Note reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Please select a rating between 1 and 5'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Please write a review comment'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per note
reviewSchema.index({ note: 1, user: 1 }, { unique: true });

// Static method to recalculate average rating on note
reviewSchema.statics.calculateAverageRating = async function (noteId) {
  const stats = await this.aggregate([
    {
      $match: { note: new mongoose.Types.ObjectId(noteId) },
    },
    {
      $group: {
        _id: '$note',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  try {
    if (stats.length > 0) {
      await Note.findByIdAndUpdate(noteId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
      });
    } else {
      await Note.findByIdAndUpdate(noteId, {
        averageRating: 0,
        totalReviews: 0,
      });
    }
  } catch (error) {
    console.error('Error updating note average rating:', error);
  }
};

reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.note);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.note);
  }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
