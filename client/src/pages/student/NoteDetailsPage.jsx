import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Download,
  Calendar,
  User,
  Building,
  BookOpen,
  FileText,
  Star,
  Flag,
  Share2,
  Trash2,
  Edit,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import StarRating from '../../components/common/StarRating';
import ReviewSection from '../../components/notes/ReviewSection';
import ReportModal from '../../components/notes/ReportModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const NoteDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/notes/${id}`);
      setNote(res.data.note);
    } catch (err) {
      error(err.message || 'Failed to load note details');
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNote();
  }, [id]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const downloadUrl = `/api/notes/${id}/download`;

      // Trigger browser download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', note.originalFileName || `${note.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setNote((prev) => ({
        ...prev,
        downloadCount: (prev.downloadCount || 0) + 1,
      }));
      success(`Downloading "${note.title}"...`);
    } catch (err) {
      error(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/notes/${id}`);
      success('Note deleted successfully');
      navigate('/my-uploads');
    } catch (err) {
      error(err.message || 'Failed to delete note');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: note.title,
        text: `Check out these study notes on NoteHub: ${note.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      success('Note link copied to clipboard!');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading study note..." fullPage={true} />;
  }

  if (!note) return null;

  const isOwner =
    user && (note.uploadedBy?._id === user.id || note.uploadedBy?._id === user._id);
  const canModify = isOwner || isAdmin;
  const pdfViewUrl = `/uploads/${note.fileUrl}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse Notes</span>
        </Link>
      </div>

      {/* Main Note Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Subject & Semester Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <FileText className="w-3.5 h-3.5" />
              {note.subject?.code} • {note.subject?.name}
            </span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600">
              Semester {note.semester}
            </span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600">
              {note.branch}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              title="Share Link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {user && (
              <button
                onClick={() => setReportModalOpen(true)}
                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                title="Report Note"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}

            {canModify && (
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="Delete Note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          {note.title}
        </h1>

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {note.description}
        </p>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {note.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Note Stats & Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
          <div>
            <span className="block text-lg font-black text-slate-800">
              {note.downloadCount || 0}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Downloads
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1">
              <StarRating rating={note.averageRating || 0} size="sm" />
              <span className="text-base font-black text-slate-800">
                {note.averageRating ? Number(note.averageRating).toFixed(1) : 'New'}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {note.totalReviews || 0} Rating{note.totalReviews === 1 ? '' : 's'}
            </span>
          </div>

          <div>
            <span className="block text-base font-bold text-slate-800">
              {note.fileSize ? `${(note.fileSize / 1024 / 1024).toFixed(1)} MB` : '< 10 MB'}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              File Size
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-800 truncate">
              {note.originalFileName || 'Academic_Note.pdf'}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Format: PDF
            </span>
          </div>
        </div>

        {/* Author Details & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm">
              {note.uploadedBy?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Uploaded by {note.uploadedBy?.name || 'Classmate'}
              </p>
              <p className="text-[11px] text-slate-400">
                {note.uploadedBy?.college || 'College of Engineering'} •{' '}
                {new Date(note.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={pdfViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>Full Screen PDF</span>
            </a>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded PDF Viewer Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Interactive PDF Document Viewer</span>
          </h3>
          <span className="text-xs text-slate-400">
            Scroll inside to read pages
          </span>
        </div>

        <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative">
          <iframe
            src={`${pdfViewUrl}#toolbar=1&navpanes=0`}
            title={note.title}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <ReviewSection noteId={note._id} onReviewsUpdated={fetchNote} />
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        noteId={note._id}
        noteTitle={note.title}
        onClose={() => setReportModalOpen(false)}
      />

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete this note?"
        message="Are you sure you want to permanently delete this uploaded note and all its reviews? This action cannot be reversed."
        confirmText="Delete Note"
        isDanger={true}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default NoteDetailsPage;
