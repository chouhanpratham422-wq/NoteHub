import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Trash2,
  Download,
  Eye,
  Star,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

import ConfirmationModal from '../../components/common/ConfirmationModal';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const ManageNotesPage = () => {
  const { success, error } = useToast();

  const [notes, setNotes] = useState([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // =======================================
  // FETCH ALL NOTES
  // =======================================
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const res = await api.get(
        `/admin/notes?${params.toString()}`
      );

      setNotes(res.data.notes || []);
      setTotalNotes(res.data.totalNotes || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Admin notes error:', err);

      error(
        err.response?.data?.message ||
          err.message ||
          'Failed to fetch notes for moderation'
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, error]);

  // =======================================
  // INITIAL LOAD
  // =======================================
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // =======================================
  // DELETE PROMPT
  // =======================================
  const handleDeletePrompt = (note) => {
    setNoteToDelete(note);
    setDeleteModalOpen(true);
  };

  // =======================================
  // CONFIRM DELETE
  // =======================================
  const confirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      setDeleting(true);

      await api.delete(
        `/admin/notes/${noteToDelete._id}`
      );

      success(
        `Note "${noteToDelete.title}" deleted by administrator.`
      );

      setDeleteModalOpen(false);
      setNoteToDelete(null);

      await fetchNotes();
    } catch (err) {
      console.error('Delete note error:', err);

      error(
        err.response?.data?.message ||
          err.message ||
          'Failed to delete note'
      );
    } finally {
      setDeleting(false);
    }
  };

  // =======================================
  // STATUS CONFIG
  // =======================================
  const getStatusInfo = (status) => {
    const normalizedStatus = status || 'approved';

    if (normalizedStatus === 'rejected') {
      return {
        label: 'REJECTED',
        className:
          'bg-rose-100 text-rose-700 border-rose-200',
        icon: XCircle,
      };
    }

    if (normalizedStatus === 'pending') {
      return {
        label: 'PENDING',
        className:
          'bg-amber-100 text-amber-700 border-amber-200',
        icon: Clock,
      };
    }

    return {
      label: 'APPROVED',
      className:
        'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* =======================================
          HEADER
      ======================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />

            <span>Content Moderation</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manage All Notes ({totalNotes})
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Inspect, review, download, or remove inappropriate or copyrighted study materials
          </p>
        </div>
      </div>

      {/* =======================================
          SEARCH BAR
      ======================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search notes by title or keywords..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* =======================================
          NOTES TABLE
      ======================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">

        {loading ? (
          <LoadingSpinner text="Loading notes for administration..." />
        ) : notes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No notes found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs text-slate-600">

              {/* TABLE HEADER */}
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">

                <tr>
                  <th className="px-6 py-4">
                    Title & Subject
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Uploader
                  </th>

                  <th className="px-6 py-4">
                    Sem & Branch
                  </th>

                  <th className="px-6 py-4">
                    Downloads
                  </th>

                  <th className="px-6 py-4">
                    Rating
                  </th>

                  <th className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>

              </thead>

              {/* TABLE BODY */}
              <tbody className="divide-y divide-slate-100">

                {notes.map((n) => {

                  const statusInfo = getStatusInfo(n.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr
                      key={n._id}
                      className="hover:bg-slate-50/70 transition"
                    >

                      {/* ===================================
                          TITLE + SUBJECT
                      =================================== */}
                      <td className="px-6 py-4 max-w-xs">

                        <p className="font-bold text-slate-900 truncate">
                          {n.title}
                        </p>

                        {n.subject && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            {n.subject?.code || 'Subject'}
                            {n.subject?.name
                              ? ` - ${n.subject.name}`
                              : ''}
                          </span>
                        )}

                        {/* Rejection Reason */}
                        {n.status === 'rejected' &&
                          n.rejectionReason && (
                            <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-100">
                              <p className="text-[10px] font-bold text-rose-700">
                                Rejection Reason
                              </p>

                              <p className="text-[10px] text-rose-600 mt-0.5">
                                {n.rejectionReason}
                              </p>
                            </div>
                          )}

                      </td>

                      {/* ===================================
                          STATUS
                      =================================== */}
                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-black ${statusInfo.className}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />

                          {statusInfo.label}
                        </span>

                      </td>

                      {/* ===================================
                          UPLOADER
                      =================================== */}
                      <td className="px-6 py-4">

                        <p className="font-semibold text-slate-800">
                          {n.uploadedBy?.name || 'Student'}
                        </p>

                        <p className="text-[11px] text-slate-400">
                          {n.uploadedBy?.email || ''}
                        </p>

                      </td>

                      {/* ===================================
                          SEMESTER + BRANCH
                      =================================== */}
                      <td className="px-6 py-4">

                        <p className="font-medium text-slate-700">
                          Sem {n.semester}
                        </p>

                        <p className="text-[11px] text-slate-400">
                          {n.branch}
                        </p>

                      </td>

                      {/* ===================================
                          DOWNLOADS
                      =================================== */}
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {n.downloadCount || 0}
                      </td>

                      {/* ===================================
                          RATING
                      =================================== */}
                      <td className="px-6 py-4">

                        <div className="flex items-center gap-1 font-semibold text-slate-700">

                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />

                          <span>
                            {n.averageRating
                              ? Number(n.averageRating).toFixed(1)
                              : '—'}
                          </span>

                        </div>

                      </td>

                      {/* ===================================
                          ACTIONS
                      =================================== */}
                      <td className="px-6 py-4 text-right">

                        <div className="flex items-center justify-end gap-1.5">

                          {/* VIEW */}
                          {n.status === 'approved' ? (
                            <Link
                              to={`/notes/${n._id}`}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="View Note"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          ) : (
                            <span
                              className="p-1.5 text-slate-200 cursor-not-allowed"
                              title={
                                n.status === 'rejected'
                                  ? 'Rejected notes are not publicly viewable'
                                  : 'Pending notes are not publicly viewable'
                              }
                            >
                              <Eye className="w-4 h-4" />
                            </span>
                          )}

                          {/* DOWNLOAD */}
                          {n.status === 'approved' ? (
                            <a
                              href={`/api/notes/${n._id}/download`}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          ) : (
                            <span
                              className="p-1.5 text-slate-200 cursor-not-allowed"
                              title="Only approved notes can be downloaded"
                            >
                              <Download className="w-4 h-4" />
                            </span>
                          )}

                          {/* DELETE */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDeletePrompt(n)
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

        {/* =======================================
            PAGINATION
        ======================================= */}
        <div className="p-4 border-t border-slate-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>

      </div>

      {/* =======================================
          CONFIRMATION MODAL
      ======================================= */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete note as administrator?"
        message={`Are you sure you want to delete "${noteToDelete?.title}"? This note file and all associated reviews will be permanently deleted.`}
        confirmText="Confirm Delete"
        isDanger={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />

    </div>
  );
};

export default ManageNotesPage;