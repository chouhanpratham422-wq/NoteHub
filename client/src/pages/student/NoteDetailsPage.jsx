import React, { useState, useEffect } from 'react';

import { useParams, Link, useNavigate } from 'react-router-dom';

import {
  Download,
  FileText,
  Flag,
  Share2,
  Trash2,
  ArrowLeft,
  ExternalLink,
  Lock,
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

  const { user, token, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // =====================================================
  // FETCH NOTE
  // =====================================================

  const fetchNote = async () => {
    try {
      setLoading(true);

      if (!user) {
        error('Please login to view this note');

        navigate('/login', {
          replace: true,
          state: {
            from: `/notes/${id}`,
          },
        });

        return;
      }

      if (!id) {
        error('Note identifier is missing');
        navigate('/browse');
        return;
      }

      const res = await api.get(`/notes/${id}`);

      if (!res.data?.note) {
        error('Note not found');
        navigate('/browse');
        return;
      }

      setNote(res.data.note);
    } catch (err) {
      console.error('Failed to load note:', err);

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        error('Please login to view this note');

        navigate('/login', {
          replace: true,
          state: {
            from: `/notes/${id}`,
          },
        });

        return;
      }

      error(
        err.response?.data?.message ||
          err.message ||
          'Failed to load note details'
      );

      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNote();
  }, [id, user]);

  // =====================================================
  // GET PDF URL
  // =====================================================

  const getPdfUrl = (fileUrl) => {
    if (!fileUrl) {
      return '';
    }

    // Cloudinary / external URL
    if (
      fileUrl.startsWith('http://') ||
      fileUrl.startsWith('https://')
    ) {
      return fileUrl;
    }

    // Old local upload support
    const serverBaseUrl = api.defaults.baseURL.replace(
      /\/api\/?$/,
      ''
    );

    return `${serverBaseUrl}/uploads/${fileUrl}`;
  };

  // =====================================================
  // DOWNLOAD PDF
  // =====================================================

  const handleDownload = async () => {
    if (!user) {
      error('Please login to download this note');

      navigate('/login', {
        state: {
          from: `/notes/${id}`,
        },
      });

      return;
    }

    if (!note) {
      return;
    }

    if (!id) {
      error('Note identifier is missing');
      return;
    }

    const savedToken =
      token ||
      localStorage.getItem('notehub_token');

    if (!savedToken) {
      error('Login session expired. Please login again.');

      navigate('/login', {
        state: {
          from: `/notes/${id}`,
        },
      });

      return;
    }

    try {
      setDownloading(true);

      console.log('Downloading note:', id);
      console.log(
        'JWT token available:',
        Boolean(savedToken)
      );

      // IMPORTANT:
      // Do NOT use window.open() directly.
      // Axios sends the JWT Authorization header.
      const response = await api.get(
        `/notes/${id}/download`,
        {
          responseType: 'blob',

          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        }
      );

      const contentType =
        response.headers?.['content-type'] ||
        'application/pdf';

      const blob = new Blob(
        [response.data],
        {
          type: contentType,
        }
      );

      const blobUrl =
        window.URL.createObjectURL(blob);

      const newWindow = window.open(
        blobUrl,
        '_blank'
      );

      if (!newWindow) {
        error(
          'Please allow popups to open the PDF'
        );

        window.URL.revokeObjectURL(blobUrl);

        return;
      }

      // Backend should already increment the real count.
      // This only updates the current page UI.
      setNote((prev) => ({
        ...prev,
        downloadCount:
          (prev.downloadCount || 0) + 1,
      }));

      success(
        `Opening "${note.title || 'PDF'}"...`
      );

      // Release blob URL later
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);

    } catch (err) {
      console.error(
        'Download error:',
        err
      );

      let message =
        'Download failed. Please try again.';

      if (
        err?.response?.data instanceof Blob
      ) {
        try {
          const text =
            await err.response.data.text();

          const data =
            JSON.parse(text);

          if (data?.message) {
            message = data.message;
          }
        } catch {
          // Keep default message
        }
      } else if (
        err?.response?.data?.message
      ) {
        message =
          err.response.data.message;
      } else if (err?.message) {
        message = err.message;
      }

      error(message);

    } finally {
      setDownloading(false);
    }
  };

  // =====================================================
  // OPEN FULL SCREEN PDF
  // =====================================================

  const handleFullScreenPdf = (event) => {
    if (!user) {
      event.preventDefault();

      error('Please login to view the PDF');

      navigate('/login', {
        state: {
          from: `/notes/${id}`,
        },
      });

      return;
    }

    if (!pdfViewUrl) {
      event.preventDefault();
      error('PDF file is not available');
    }
  };

  // =====================================================
  // SHARE
  // =====================================================

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: note.title,
          text: `Check out these study notes on NoteHub: ${note.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          window.location.href
        );

        success(
          'Note link copied to clipboard!'
        );
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        error('Unable to share this note');
      }
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async () => {
    try {
      setDeleting(true);

      await api.delete(`/notes/${id}`);

      success(
        'Note deleted successfully'
      );

      navigate('/my-uploads');

    } catch (err) {
      console.error(
        'Delete error:',
        err
      );

      error(
        err.response?.data?.message ||
          err.message ||
          'Failed to delete note'
      );

    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <LoadingSpinner
        text="Loading study note..."
        fullPage={true}
      />
    );
  }

  // =====================================================
  // NO NOTE
  // =====================================================

  if (!note) {
    return null;
  }

  // =====================================================
  // OWNER CHECK
  // =====================================================

  const isOwner =
    user &&
    (
      note.uploadedBy?._id === user.id ||
      note.uploadedBy?._id === user._id
    );

  const canModify =
    isOwner || isAdmin;

  // =====================================================
  // PDF URL
  // =====================================================

  const pdfViewUrl =
    getPdfUrl(note.fileUrl);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ==================================================
          BACK BUTTON
      ================================================== */}

      <div>
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />

          <span>
            Back to Browse Notes
          </span>
        </Link>
      </div>

      {/* ==================================================
          NOTE INFORMATION
      ================================================== */}

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">

        {/* Top Row */}

        <div className="flex flex-wrap items-center justify-between gap-3">

          {/* Badges */}

          <div className="flex flex-wrap items-center gap-2">

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">

              <FileText className="w-3.5 h-3.5" />

              {note.subject?.code
                ? `${note.subject.code} • `
                : ''}

              {note.subject?.name ||
                'General Subject'}

            </span>

            <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600">
              Semester {note.semester}
            </span>

            <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600">
              {note.branch}
            </span>

          </div>

          {/* Actions */}

          <div className="flex items-center gap-2">

            {/* Share */}

            <button
              type="button"
              onClick={handleShare}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              title="Share Link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Report */}

            {user && (
              <button
                type="button"
                onClick={() =>
                  setReportModalOpen(true)
                }
                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                title="Report Note"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}

            {/* Delete */}

            {canModify && (
              <button
                type="button"
                onClick={() =>
                  setDeleteModalOpen(true)
                }
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

        {note.tags &&
          note.tags.length > 0 && (

            <div className="flex flex-wrap gap-1.5 pt-2">

              {note.tags.map(
                (tag, index) => (

                  <span
                    key={`${tag}-${index}`}
                    className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60"
                  >
                    #{tag}
                  </span>

                )
              )}

            </div>

          )}

        {/* ==================================================
            NOTE STATS
        ================================================== */}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">

          {/* Downloads */}

          <div>

            <span className="block text-lg font-black text-slate-800">
              {note.downloadCount || 0}
            </span>

            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Downloads
            </span>

          </div>

          {/* Rating */}

          <div>

            <div className="flex items-center justify-center gap-1">

              <StarRating
                rating={
                  note.averageRating || 0
                }
                size="sm"
              />

              <span className="text-base font-black text-slate-800">

                {note.averageRating
                  ? Number(
                      note.averageRating
                    ).toFixed(1)
                  : 'New'}

              </span>

            </div>

            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">

              {note.totalReviews || 0} Rating
              {note.totalReviews === 1
                ? ''
                : 's'}

            </span>

          </div>

          {/* File Size */}

          <div>

            <span className="block text-base font-bold text-slate-800">

              {note.fileSize
                ? `${(
                    note.fileSize /
                    1024 /
                    1024
                  ).toFixed(1)} MB`
                : '< 10 MB'}

            </span>

            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              File Size
            </span>

          </div>

          {/* Format */}

          <div>

            <span className="block text-xs font-bold text-slate-800 truncate">

              {note.originalFileName ||
                'Academic_Note.pdf'}

            </span>

            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Format: PDF
            </span>

          </div>

        </div>

        {/* ==================================================
            UPLOADER + BUTTONS
        ================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">

          {/* Uploader */}

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm">

              {note.uploadedBy?.name?.charAt(0) ||
                'U'}

            </div>

            <div>

              <p className="text-xs font-bold text-slate-800">

                Uploaded by{' '}

                {note.uploadedBy?.name ||
                  'Classmate'}

              </p>

              <p className="text-[11px] text-slate-400">

                {note.uploadedBy?.college ||
                  'College of Engineering'}

                {' • '}

                {note.createdAt
                  ? new Date(
                      note.createdAt
                    ).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )
                  : ''}

              </p>

            </div>

          </div>

          {/* PDF Buttons */}

          <div className="flex items-center gap-3">

            {/* ==================================================
                FULL SCREEN PDF
            ================================================== */}

            {user ? (

              <a
                href={
                  pdfViewUrl || '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={
                  handleFullScreenPdf
                }
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
              >

                <ExternalLink className="w-4 h-4 text-slate-400" />

                <span>
                  Full Screen PDF
                </span>

              </a>

            ) : (

              <button
                type="button"
                onClick={() =>
                  navigate('/login', {
                    state: {
                      from: `/notes/${id}`,
                    },
                  })
                }
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
              >

                <Lock className="w-4 h-4 text-slate-400" />

                <span>
                  Login to View PDF
                </span>

              </button>

            )}

            {/* ==================================================
                DOWNLOAD PDF
            ================================================== */}

            <button
              type="button"
              onClick={handleDownload}
              disabled={
                downloading || !user
              }
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 transition disabled:opacity-50"
            >

              {user ? (
                <Download className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}

              <span>

                {!user
                  ? 'Login to Download'
                  : downloading
                  ? 'Opening...'
                  : 'Download PDF'}

              </span>

            </button>

          </div>

        </div>

      </div>

      {/* ==================================================
          PDF VIEWER
      ================================================== */}

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 overflow-hidden">

        <div className="flex items-center justify-between mb-4">

          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">

            <FileText className="w-4 h-4 text-indigo-600" />

            <span>
              Interactive PDF Document Viewer
            </span>

          </h3>

          <span className="text-xs text-slate-400">
            Scroll inside to read pages
          </span>

        </div>

        <div className="w-full h-[650px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">

          {user && pdfViewUrl ? (

            <iframe
              src={`${pdfViewUrl}#toolbar=1&navpanes=0`}
              title={note.title}
              className="w-full h-full"
              frameBorder="0"
            />

          ) : (

            <div className="w-full h-full flex flex-col items-center justify-center text-center text-sm text-slate-500 gap-3">

              <Lock className="w-8 h-8 text-slate-400" />

              <div>

                <p className="font-bold text-slate-700">
                  Login required
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Please login to view the PDF document.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  navigate('/login', {
                    state: {
                      from: `/notes/${id}`,
                    },
                  })
                }
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                Login to Continue
              </button>

            </div>

          )}

        </div>

      </div>

      {/* ==================================================
          REVIEWS
      ================================================== */}

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">

        <ReviewSection
          noteId={note._id}
          onReviewsUpdated={fetchNote}
        />

      </div>

      {/* ==================================================
          REPORT MODAL
      ================================================== */}

      <ReportModal
        isOpen={reportModalOpen}
        noteId={note._id}
        noteTitle={note.title}
        onClose={() =>
          setReportModalOpen(false)
        }
      />

      {/* ==================================================
          DELETE MODAL
      ================================================== */}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete this note?"
        message="Are you sure you want to permanently delete this uploaded note and all its reviews? This action cannot be reversed."
        confirmText="Delete Note"
        isDanger={true}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() =>
          setDeleteModalOpen(false)
        }
      />

    </div>
  );
};

export default NoteDetailsPage;