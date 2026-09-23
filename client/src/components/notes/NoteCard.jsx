import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Calendar,
  User,
  Eye,
  FileText,
} from 'lucide-react';
import StarRating from '../common/StarRating';
import { useToast } from '../../context/ToastContext';

const NoteCard = ({ note, onDownloadSuccess }) => {
  const { success, error } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [downloadCount, setDownloadCount] = useState(note.downloadCount || 0);

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setDownloading(true);

      // Production backend download URL
      const downloadUrl = `https://notehub-extk.onrender.com/api/notes/${note._id}/download`;

      // Trigger browser download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute(
        'download',
        note.originalFileName || `${note.title}.pdf`
      );
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadCount((prev) => prev + 1);
      success(`Downloading "${note.title}"...`);

      if (onDownloadSuccess) {
        onDownloadSuccess(note._id);
      }
    } catch (err) {
      error(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const formattedDate = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      <div className="p-5">

        {/* Badges: Subject & Semester/Branch */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            {note.subject?.code ? `${note.subject.code} • ` : ''}
            {note.subject?.name || 'General Subject'}
          </span>

          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            Sem {note.semester} • {note.branch}
          </span>
        </div>

        {/* Note Title */}
        <Link to={`/notes/${note._id}`}>
          <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {note.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
          {note.description}
        </p>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}

            {note.tags.length > 3 && (
              <span className="text-[10px] font-medium text-slate-400">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Uploader & Date */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 truncate font-medium text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {note.uploadedBy?.name || 'Peer Student'}
          </span>

          <span className="flex items-center gap-1 shrink-0 ml-auto">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Footer bar */}
      <div className="bg-slate-50/80 px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3">

        {/* Rating and Downloads */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <StarRating rating={note.averageRating || 0} size="sm" />

            <span className="text-xs font-bold text-slate-700">
              {note.averageRating
                ? Number(note.averageRating).toFixed(1)
                : 'New'}
            </span>
          </div>

          <span className="text-slate-300">•</span>

          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
            <Download className="w-3.5 h-3.5 text-slate-400" />
            {downloadCount}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5">

          {/* View Details */}
          <Link
            to={`/notes/${note._id}`}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>

          {/* Download PDF */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />

            <span>
              {downloading ? '...' : 'PDF'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;