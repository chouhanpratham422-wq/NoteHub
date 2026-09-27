import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Download,
  Calendar,
  User,
  Eye,
  FileText,
  Lock,
} from 'lucide-react';

import StarRating from '../common/StarRating';

import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

import api from '../../services/api';

const NoteCard = ({ note, onDownloadSuccess }) => {
  const navigate = useNavigate();

  const { success, error } = useToast();
  const { user, token } = useAuth();

  const [downloading, setDownloading] = useState(false);

  const [downloadCount, setDownloadCount] = useState(
    note?.downloadCount || 0
  );

  // =====================================================
  // NOTE ID
  // =====================================================

  const noteId =
    note?._id ||
    note?.id ||
    note?.noteId ||
    '';

  const detailsUrl = `/notes/${noteId}`;

  // =====================================================
  // VIEW DETAILS
  // =====================================================

  const handleViewDetails = (e) => {
    if (!user) {
      e.preventDefault();
      e.stopPropagation();

      error('Please login to view this note');

      navigate('/login', {
        state: {
          from: detailsUrl,
        },
      });

      return;
    }

    navigate(detailsUrl);
  };

  // =====================================================
  // DOWNLOAD PDF
  // =====================================================

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // -----------------------------------------------------
    // LOGIN CHECK
    // -----------------------------------------------------

    if (!user) {
      error('Please login to download this note');

      navigate('/login', {
        state: {
          from: detailsUrl,
        },
      });

      return;
    }

    // -----------------------------------------------------
    // TOKEN CHECK
    // -----------------------------------------------------

    const savedToken =
      token ||
      localStorage.getItem('notehub_token');

    if (!savedToken) {
      error('Login session expired. Please login again.');

      navigate('/login', {
        state: {
          from: detailsUrl,
        },
      });

      return;
    }

    // -----------------------------------------------------
    // NOTE ID CHECK
    // -----------------------------------------------------

    if (!noteId) {
      error('Note identifier is missing');
      return;
    }

    try {
      setDownloading(true);

      console.log('Downloading note:', noteId);
      console.log(
        'JWT token available:',
        Boolean(savedToken)
      );

      // ---------------------------------------------------
      // AUTHENTICATED API REQUEST
      // ---------------------------------------------------

      const response = await api.get(
        `/notes/${noteId}/download`,
        {
          responseType: 'blob',

          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        }
      );

      // ---------------------------------------------------
      // CREATE PDF BLOB
      // ---------------------------------------------------

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

      // ---------------------------------------------------
      // OPEN PDF
      // ---------------------------------------------------

      const newWindow = window.open(
        blobUrl,
        '_blank'
      );

      if (!newWindow) {
        error(
          'Please allow popups to open the PDF'
        );

        window.URL.revokeObjectURL(
          blobUrl
        );

        return;
      }

      // ---------------------------------------------------
      // DOWNLOAD COUNT
      // ---------------------------------------------------

      setDownloadCount(
        (prev) => prev + 1
      );

      success(
        `Opening "${note?.title || 'PDF'}"...`
      );

      if (onDownloadSuccess) {
        onDownloadSuccess(noteId);
      }

      // ---------------------------------------------------
      // RELEASE BLOB URL
      // ---------------------------------------------------

      setTimeout(() => {
        window.URL.revokeObjectURL(
          blobUrl
        );
      }, 60000);

    } catch (err) {
      console.error(
        'Download error:',
        err
      );

      let message =
        'Download failed. Please try again.';

      // ---------------------------------------------------
      // BLOB ERROR FROM BACKEND
      // ---------------------------------------------------

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
      }

      // ---------------------------------------------------
      // NORMAL AXIOS ERROR
      // ---------------------------------------------------

      else if (
        err?.response?.data?.message
      ) {
        message =
          err.response.data.message;
      }

      else if (err?.message) {
        message = err.message;
      }

      error(message);

    } finally {
      setDownloading(false);
    }
  };

  // =====================================================
  // INVALID NOTE
  // =====================================================

  if (!note || !noteId) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-5">
        <div className="flex items-center gap-2 text-amber-600">
          <FileText className="w-5 h-5" />

          <span className="text-sm font-semibold">
            Note identifier is missing
          </span>
        </div>
      </div>
    );
  }

  // =====================================================
  // DATE
  // =====================================================

  const formattedDate =
    note.createdAt
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
      : '';

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between overflow-hidden group">

      {/* MAIN CONTENT */}

      <div className="p-5">

        {/* Subject + Semester */}

        <div className="flex items-center justify-between gap-2 mb-3">

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 truncate max-w-[65%]">

            <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />

            {note.subject?.code
              ? `${note.subject.code} • `
              : ''}

            {note.subject?.name ||
              'General Subject'}

          </span>

          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">

            Sem {note.semester} • {note.branch}

          </span>

        </div>

        {/* TITLE */}

        <button
          type="button"
          onClick={handleViewDetails}
          className="block w-full text-left"
        >
          <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {note.title ||
              'Untitled Note'}
          </h3>
        </button>

        {/* DESCRIPTION */}

        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">

          {note.description ||
            'No description available.'}

        </p>

        {/* TAGS */}

        {Array.isArray(note.tags) &&
          note.tags.length > 0 && (

            <div className="flex flex-wrap gap-1 mt-3">

              {note.tags
                .slice(0, 3)
                .map(
                  (tag, index) => (

                    <span
                      key={`${tag}-${index}`}
                      className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded"
                    >
                      #{tag}
                    </span>

                  )
                )}

              {note.tags.length > 3 && (

                <span className="text-[10px] font-medium text-slate-400">

                  +{note.tags.length - 3}

                </span>

              )}

            </div>

          )}

        {/* UPLOADER + DATE */}

        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">

          <span className="flex items-center gap-1 truncate font-medium text-slate-600">

            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {note.uploadedBy?.name ||
              'Peer Student'}

          </span>

          <span className="flex items-center gap-1 shrink-0 ml-auto">

            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {formattedDate}

          </span>

        </div>

      </div>

      {/* FOOTER */}

      <div className="bg-slate-50/80 px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3">

        {/* Rating + Downloads */}

        <div className="flex items-center gap-3">

          <div className="flex items-center gap-1.5">

            <StarRating
              rating={
                note.averageRating || 0
              }
              size="sm"
            />

            <span className="text-xs font-bold text-slate-700">

              {note.averageRating
                ? Number(
                    note.averageRating
                  ).toFixed(1)
                : 'New'}

            </span>

          </div>

          <span className="text-slate-300">
            •
          </span>

          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">

            <Download className="w-3.5 h-3.5 text-slate-400" />

            {downloadCount}

          </span>

        </div>

        {/* BUTTONS */}

        <div className="flex items-center gap-1.5">

          {/* VIEW DETAILS */}

          <button
            type="button"
            onClick={handleViewDetails}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
            title={
              user
                ? 'View Details'
                : 'Login to View Details'
            }
          >

            {user ? (
              <Eye className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}

          </button>

          {/* DOWNLOAD */}

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
            title={
              user
                ? 'Download PDF'
                : 'Login to Download'
            }
          >

            {user ? (
              <Download className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}

            <span>

              {!user
                ? 'Login'
                : downloading
                ? '...'
                : 'PDF'}

            </span>

          </button>

        </div>

      </div>

    </div>
  );
};

export default NoteCard;