import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Trash2,
  User,
} from 'lucide-react';

import ConfirmationModal from '../../components/common/ConfirmationModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const ReportsPage = () => {
  const { success, error } = useToast();

  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [processing, setProcessing] = useState(false);

  // =======================================
  // FETCH REPORTS
  // =======================================
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);

      const url =
        statusFilter === 'all'
          ? '/admin/reports'
          : `/admin/reports?status=${statusFilter}`;

      const res = await api.get(url);

      setReports(res.data.reports || []);
    } catch (err) {
      console.error('Error fetching reports:', err);

      error(
        err.response?.data?.message ||
          err.message ||
          'Failed to load reported content'
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, error]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // =======================================
  // UPDATE REPORT STATUS
  // =======================================
  const updateStatus = async (reportId, newStatus) => {
    try {
      await api.put(`/admin/reports/${reportId}`, {
        status: newStatus,
      });

      success(
        newStatus === 'reviewed'
          ? 'Report marked as reviewed.'
          : 'Report dismissed successfully.'
      );

      await fetchReports();
    } catch (err) {
      console.error('Error updating report:', err);

      error(
        err.response?.data?.message ||
          err.message ||
          'Failed to update report status'
      );
    }
  };

  // =======================================
  // OPEN DELETE CONFIRMATION
  // =======================================
  const handleDeleteNotePrompt = (report) => {
    setSelectedReport(report);
    setDeleteModalOpen(true);
  };

  // =======================================
  // DELETE REPORTED NOTE
  // AND MARK REPORT AS REVIEWED
  // =======================================
  const confirmDeleteNote = async () => {
    if (!selectedReport || !selectedReport.note) {
      return;
    }

    try {
      setProcessing(true);

      // -----------------------------------
      // STEP 1: DELETE THE REPORTED NOTE
      // -----------------------------------
      await api.delete(
        `/admin/notes/${selectedReport.note._id}`
      );

      // -----------------------------------
      // STEP 2: MARK REPORT AS REVIEWED
      // -----------------------------------
      await api.put(
        `/admin/reports/${selectedReport._id}`,
        {
          status: 'reviewed',
        }
      );

      success(
        'Reported note deleted successfully and report marked as reviewed.'
      );

      setDeleteModalOpen(false);
      setSelectedReport(null);

      await fetchReports();
    } catch (err) {
      console.error('Error deleting reported note:', err);

      error(
        err.response?.data?.message ||
          err.message ||
          'Failed to delete reported note'
      );
    } finally {
      setProcessing(false);
    }
  };

  // =======================================
  // STATUS BADGE
  // =======================================
  const getStatusBadge = (status) => {
    const statusStyles = {
      pending:
        'bg-amber-100 text-amber-800 border-amber-200',

      reviewed:
        'bg-emerald-100 text-emerald-800 border-emerald-200',

      dismissed:
        'bg-slate-100 text-slate-700 border-slate-200',
    };

    return (
      <span
        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
          statusStyles[status] ||
          statusStyles.pending
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ===================================
          PAGE HEADER
      =================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />

            <span>Moderation Queue</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Reported Content & Flags ({reports.length})
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review inappropriate content, syllabus violations, or copyright complaints
          </p>
        </div>

        {/* STATUS FILTER */}
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm self-start"
        >
          <option value="all">
            All Statuses
          </option>

          <option value="pending">
            Pending Only
          </option>

          <option value="reviewed">
            Reviewed
          </option>

          <option value="dismissed">
            Dismissed
          </option>
        </select>
      </div>

      {/* ===================================
          REPORT LIST
      =================================== */}
      {loading ? (
        <LoadingSpinner text="Fetching content reports..." />
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          No reports found with the selected filter.
        </div>
      ) : (
        <div className="space-y-4">

          {reports.map((rep) => (
            <div
              key={rep._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
            >

              {/* =================================
                  TOP ROW
              ================================= */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

                <div className="flex items-center gap-2">

                  {getStatusBadge(rep.status)}

                  <span className="text-[11px] text-slate-400">
                    Reported on{' '}
                    {new Date(
                      rep.createdAt
                    ).toLocaleDateString()}
                  </span>

                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-2">

                  {/* MARK REVIEWED */}
                  {rep.status === 'pending' && (
                    <button
                      onClick={() =>
                        updateStatus(
                          rep._id,
                          'reviewed'
                        )
                      }
                      className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                    >
                      Mark as Reviewed
                    </button>
                  )}

                  {/* DISMISS */}
                  {rep.status !== 'dismissed' && (
                    <button
                      onClick={() =>
                        updateStatus(
                          rep._id,
                          'dismissed'
                        )
                      }
                      className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      Dismiss
                    </button>
                  )}

                  {/* DELETE NOTE */}
                  {rep.note && rep.status !== 'reviewed' && (
                    <button
                      onClick={() =>
                        handleDeleteNotePrompt(rep)
                      }
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />

                      <span>
                        Delete Note
                      </span>
                    </button>
                  )}

                </div>
              </div>

              {/* =================================
                  REPORT REASON
              ================================= */}
              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-xs">

                <span className="font-bold text-rose-950 block mb-0.5">
                  Report Reason:
                </span>

                <p className="text-rose-800 leading-relaxed">
                  {rep.reason}
                </p>

              </div>

              {/* =================================
                  NOTE + REPORTER
              ================================= */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">

                {/* NOTE */}
                <div>
                  {rep.note ? (
                    <div className="flex items-center gap-2">

                      <span className="font-semibold text-slate-700">
                        Note:
                      </span>

                      <Link
                        to={`/notes/${rep.note._id}`}
                        className="font-bold text-indigo-600 hover:underline truncate max-w-sm"
                      >
                        {rep.note.title}
                      </Link>

                    </div>
                  ) : (
                    <span className="italic text-slate-400">
                      (Note has already been removed)
                    </span>
                  )}
                </div>

                {/* REPORTER */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">

                  <User className="w-3.5 h-3.5" />

                  <span>
                    Reported by{' '}
                    {rep.reportedBy?.name ||
                      'Student'}{' '}
                    (
                    {rep.reportedBy?.email ||
                      'Unknown'}
                    )
                  </span>

                </div>

              </div>

              {/* =================================
                  REVIEW INFORMATION
              ================================= */}
              {rep.status === 'reviewed' &&
                rep.reviewedBy && (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">

                    Reviewed by{' '}
                    <span className="font-bold">
                      {rep.reviewedBy.name ||
                        rep.reviewedBy.email}
                    </span>

                    {rep.reviewedAt && (
                      <>
                        {' '}on{' '}
                        {new Date(
                          rep.reviewedAt
                        ).toLocaleString()}
                      </>
                    )}

                  </div>
                )}

            </div>
          ))}

        </div>
      )}

      {/* ===================================
          DELETE CONFIRMATION MODAL
      =================================== */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete reported note?"
        message={`This will permanently remove "${selectedReport?.note?.title}" from NoteHub and mark this report as Reviewed.`}
        confirmText="Delete and Review"
        isDanger={true}
        loading={processing}
        onConfirm={confirmDeleteNote}
        onClose={() => {
          if (!processing) {
            setDeleteModalOpen(false);
            setSelectedReport(null);
          }
        }}
      />

    </div>
  );
};

export default ReportsPage;