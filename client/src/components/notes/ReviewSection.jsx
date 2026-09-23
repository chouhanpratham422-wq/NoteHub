import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, Trash2, Edit3, User } from 'lucide-react';
import StarRating from '../common/StarRating';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const ReviewSection = ({ noteId, onReviewsUpdated }) => {
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/notes/${noteId}/reviews`);
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (noteId) {
      fetchReviews();
    }
  }, [noteId]);

  // Check if current user already reviewed
  const userReview = reviews.find(
    (r) => r.user?._id === user?.id || r.user?._id === user?._id
  );

  useEffect(() => {
    if (userReview && !isEditing) {
      setRating(userReview.rating);
      setComment(userReview.comment);
    }
  }, [userReview, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      error('Please log in to submit a review.');
      return;
    }

    if (!comment.trim()) {
      error('Please write a review comment.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/notes/${noteId}/reviews`, {
        rating,
        comment: comment.trim(),
      });

      success(res.data.message || 'Review saved successfully!');
      setIsEditing(false);
      await fetchReviews();
      if (onReviewsUpdated) onReviewsUpdated();
    } catch (err) {
      error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await api.delete(`/reviews/${reviewId}`);
      success('Review deleted successfully');
      await fetchReviews();
      if (onReviewsUpdated) onReviewsUpdated();
    } catch (err) {
      error(err.message || 'Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-800">
            Student Reviews ({reviews.length})
          </h3>
        </div>
      </div>

      {/* Review Submission Box */}
      {user ? (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5">
          <h4 className="text-sm font-bold text-slate-800 mb-3">
            {userReview ? 'Your Review & Rating' : 'Leave a Rating & Review'}
          </h4>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Rating (Click to select 1 to 5 stars)
              </label>
              <div className="flex items-center gap-3">
                <StarRating
                  rating={rating}
                  interactive={true}
                  size="lg"
                  onRatingChange={(newVal) => setRating(newVal)}
                />
                <span className="text-sm font-bold text-indigo-700">
                  {rating} of 5 stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Your Feedback / Review Notes
              </label>
              <textarea
                rows="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share how helpful this note was for your studies or exam preparation..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Saving...' : userReview ? 'Update Review' : 'Submit Review'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center text-sm text-slate-600">
          <p>
            Please{' '}
            <a href="/login" className="font-semibold text-indigo-600 underline">
              log in
            </a>{' '}
            to rate and review this study material.
          </p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="text-center py-8 bg-white border border-slate-100 rounded-2xl text-slate-400 text-sm">
            No reviews yet. Be the first student to review this note!
          </div>
        ) : (
          reviews.map((rev) => {
            const isOwner =
              rev.user?._id === user?.id || rev.user?._id === user?._id;
            const canDelete = isOwner || isAdmin;

            return (
              <div
                key={rev._id}
                className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {rev.user?.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {rev.user?.name || 'Student'}
                        </span>
                        {rev.user?.branch && (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {rev.user.branch} • Sem {rev.user.semester}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={rev.rating} size="sm" />
                        <span className="text-[11px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(rev._id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                      title="Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {rev.comment}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
