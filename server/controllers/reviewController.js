import Review from '../models/Review.js';
import Note from '../models/Note.js';

// @desc    Get all reviews for a specific note
// @route   GET /api/notes/:id/reviews
// @access  Public
export const getReviewsForNote = async (req, res, next) => {
  try {
    const reviews = await Review.find({ note: req.params.id })
      .populate('user', 'name email college branch semester profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update review for a note
// @route   POST /api/notes/:id/reviews
// @access  Private
export const addOrUpdateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const noteId = req.params.id;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both rating (1-5) and a review comment.',
      });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check if user already reviewed this note
    let review = await Review.findOne({ note: noteId, user: req.user.id });

    if (review) {
      // Update existing review
      review.rating = Number(rating);
      review.comment = comment.trim();
      review.updatedAt = Date.now();
      await review.save();

      const populatedReview = await Review.findById(review._id).populate(
        'user',
        'name email college branch semester profileImage'
      );

      return res.status(200).json({
        success: true,
        message: 'Your review has been updated successfully',
        review: populatedReview,
      });
    }

    // Create new review
    review = await Review.create({
      note: noteId,
      user: req.user._id,
      rating: Number(rating),
      comment: comment.trim(),
    });

    const populatedReview = await Review.findById(review._id).populate(
      'user',
      'name email college branch semester profileImage'
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private (Author or Admin)
export const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this review.',
      });
    }

    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment.trim();
    review.updatedAt = Date.now();
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Author or Admin)
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this review.',
      });
    }

    const noteId = review.note;
    await Review.findByIdAndDelete(review._id);

    // Recalculate average rating
    await Review.calculateAverageRating(noteId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
