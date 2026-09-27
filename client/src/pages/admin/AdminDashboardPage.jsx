import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  Bookmark,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle,
  XCircle,
  RefreshCw,
  UserCheck,
  Eye,
  ExternalLink,
} from 'lucide-react';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const AdminDashboardPage = () => {
  const { error, success } = useToast();

  const [stats, setStats] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [subjectDistribution, setSubjectDistribution] = useState([]);
  const [pendingNotes, setPendingNotes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);

  const [processingId, setProcessingId] = useState(null);

  // =======================================
  // GET PDF URL
  // =======================================
  const getPdfUrl = (note) => {
    if (!note?.fileUrl) {
      return '';
    }

    // Cloudinary / external URL
    if (
      note.fileUrl.startsWith('http://') ||
      note.fileUrl.startsWith('https://')
    ) {
      return note.fileUrl;
    }

    // Old/local uploaded file
    const apiBaseUrl = api.defaults.baseURL || '';

    const cleanBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

    return `${cleanBaseUrl}${note.fileUrl.startsWith('/') ? '' : '/'}${note.fileUrl}`;
  };

  // =======================================
  // OPEN PENDING PDF
  // =======================================
  const handleViewPdf = (note) => {
    const pdfUrl = getPdfUrl(note);

    if (!pdfUrl) {
      error('PDF file is not available for this note.');
      return;
    }

    window.open(
      pdfUrl,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // =======================================
  // FETCH DASHBOARD DATA
  // =======================================
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const res = await api.get('/admin/stats');

      setStats(res.data.stats || {});
      setRecentNotes(res.data.recentNotes || []);
      setSubjectDistribution(
        res.data.subjectDistribution || []
      );
    } catch (err) {
      console.error('Admin stats error:', err);

      error(
        err.response?.data?.message ||
          err.message ||
          'Failed to load administrator statistics'
      );
    } finally {
      setLoading(false);
    }
  };

  // =======================================
  // FETCH PENDING NOTES
  // =======================================
  const fetchPendingNotes = async () => {
    try {
      setPendingLoading(true);

      const res = await api.get('/admin/notes/pending');

      setPendingNotes(res.data.notes || []);
    } catch (err) {
      console.error('Pending notes error:', err);

      error(
        err.response?.data?.message ||
          err.message ||
          'Failed to load pending notes'
      );
    } finally {
      setPendingLoading(false);
    }
  };

  // =======================================
  // REFRESH EVERYTHING
  // =======================================
  const refreshDashboard = async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchPendingNotes(),
    ]);
  };

  // =======================================
  // INITIAL LOAD
  // =======================================
  useEffect(() => {
    refreshDashboard();
  }, []);

  // =======================================
  // APPROVE NOTE
  // =======================================
  const handleApprove = async (noteId) => {
    try {
      setProcessingId(noteId);

      const res = await api.put(
        `/admin/notes/${noteId}/approve`
      );

      success(
        res.data.message ||
          'Note approved successfully.'
      );

      await refreshDashboard();
    } catch (err) {
      console.error('Approve note error:', err);

      error(
        err.response?.data?.message ||
          err.message ||
          'Failed to approve note'
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =======================================
  // REJECT NOTE
  // =======================================
  const handleReject = async (noteId) => {
    const rejectionReason = window.prompt(
      'Enter rejection reason for this note:'
    );

    if (rejectionReason === null) {
      return;
    }

    try {
      setProcessingId(noteId);

      const res = await api.put(
        `/admin/notes/${noteId}/reject`,
        {
          rejectionReason,
        }
      );

      success(
        res.data.message ||
          'Note rejected successfully.'
      );

      await refreshDashboard();
    } catch (err) {
      console.error('Reject note error:', err);

      error(
        err.response?.data?.message ||
          err.message ||
          'Failed to reject note'
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =======================================
  // LOADING
  // =======================================
  if (loading) {
    return (
      <LoadingSpinner
        text="Compiling administrative analytics..."
        fullPage={true}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* =======================================
          HEADER
      ======================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>
              Administrator Control Center
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Admin Dashboard & Analytics
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Platform metrics, users, uploaded notes, and moderation queue
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <button
            type="button"
            onClick={refreshDashboard}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <Link
            to="/admin/subjects"
            className="px-3 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition"
          >
            + Add New Subject
          </Link>

          <Link
            to="/admin/reports"
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition"
          >
            Review Reports
          </Link>

        </div>
      </div>

      {/* =======================================
          PENDING APPROVAL BANNER
      ======================================= */}
      {pendingNotes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

            <div className="flex items-start gap-3">

              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>

              <div>

                <h2 className="font-black text-amber-950">
                  {pendingNotes.length} Note
                  {pendingNotes.length !== 1
                    ? 's'
                    : ''}{' '}
                  Waiting for Approval
                </h2>

                <p className="text-xs text-amber-800 mt-1">
                  Students have uploaded notes that need admin approval
                  before they become visible to everyone.
                </p>

              </div>

            </div>

            <span className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-amber-200 text-amber-900 text-xs font-black">
              Pending Review
            </span>

          </div>

        </div>
      )}

      {/* =======================================
          4 KEY METRIC CARDS
      ======================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Students */}
        <Link
          to="/admin/users"
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-purple-200 transition group"
        >
          <div className="flex items-center justify-between mb-2">

            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>

            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-colors" />

          </div>

          <span className="text-2xl font-black text-slate-900">
            {stats?.totalUsers || 0}
          </span>

          <p className="text-xs font-semibold text-slate-500 mt-1">
            Total Users Registered
          </p>
        </Link>

        {/* Notes */}
        <Link
          to="/admin/notes"
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition group"
        >
          <div className="flex items-center justify-between mb-2">

            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>

            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />

          </div>

          <span className="text-2xl font-black text-slate-900">
            {stats?.totalNotes || 0}
          </span>

          <p className="text-xs font-semibold text-slate-500 mt-1">
            Approved Notes
          </p>
        </Link>

        {/* Subjects */}
        <Link
          to="/admin/subjects"
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition group"
        >
          <div className="flex items-center justify-between mb-2">

            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>

            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />

          </div>

          <span className="text-2xl font-black text-slate-900">
            {stats?.totalSubjects || 0}
          </span>

          <p className="text-xs font-semibold text-slate-500 mt-1">
            Total Academic Subjects
          </p>
        </Link>

        {/* Pending */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">

          <div className="flex items-center justify-between mb-2">

            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>

          </div>

          <span className="text-2xl font-black text-slate-900">
            {pendingNotes.length}
          </span>

          <p className="text-xs font-semibold text-slate-500 mt-1">
            Notes Waiting for Approval
          </p>

        </div>

      </div>

      {/* =======================================
          PENDING NOTE APPROVAL SECTION
      ======================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="p-6 border-b border-slate-100">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

            <div>

              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-600" />
                Pending Note Approval
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Open and review student-uploaded PDFs before making them public.
              </p>

            </div>

            <span className="text-xs font-black px-3 py-1.5 rounded-full bg-amber-100 text-amber-800">
              {pendingNotes.length} Pending
            </span>

          </div>

        </div>

        {pendingLoading ? (

          <div className="p-10 text-center">

            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />

            <p className="text-xs text-slate-400 mt-3">
              Loading pending notes...
            </p>

          </div>

        ) : pendingNotes.length === 0 ? (

          <div className="p-10 text-center">

            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>

            <h3 className="font-black text-slate-800 mt-4">
              No Pending Notes
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              All uploaded notes have been reviewed.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {pendingNotes.map((note) => (

              <div
                key={note._id}
                className="p-5 hover:bg-slate-50/70 transition"
              >

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

                  {/* ===================================
                      NOTE INFORMATION
                  =================================== */}
                  <div className="flex items-start gap-4 min-w-0">

                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">

                      <h3 className="font-black text-slate-900 truncate">
                        {note.title}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {note.description ||
                          'No description provided.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-3">

                        {note.subject?.code && (
                          <span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-black">
                            {note.subject.code}
                          </span>
                        )}

                        {note.subject?.name && (
                          <span className="text-[10px] font-semibold text-slate-500">
                            {note.subject.name}
                          </span>
                        )}

                        {note.semester && (
                          <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                            Semester {note.semester}
                          </span>
                        )}

                        {note.branch && (
                          <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {note.branch}
                          </span>
                        )}

                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-slate-400">

                        <span>
                          Uploaded by{' '}
                          <strong className="text-slate-600">
                            {note.uploadedBy?.name ||
                              'Student'}
                          </strong>
                        </span>

                        {note.uploadedBy?.email && (
                          <>
                            <span>•</span>

                            <span>
                              {note.uploadedBy.email}
                            </span>
                          </>
                        )}

                        <span>•</span>

                        <span>
                          {note.createdAt
                            ? new Date(
                                note.createdAt
                              ).toLocaleDateString()
                            : ''}
                        </span>

                      </div>

                      {note.originalFileName && (
                        <p className="text-[10px] text-slate-400 mt-2 truncate">
                          PDF: {note.originalFileName}
                        </p>
                      )}

                    </div>

                  </div>

                  {/* ===================================
                      ACTIONS
                  =================================== */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">

                    {/* VIEW PDF */}
                    <button
                      type="button"
                      disabled={
                        processingId === note._id
                      }
                      onClick={() =>
                        handleViewPdf(note)
                      }
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-700 border border-indigo-200 text-xs font-black transition"
                    >
                      <Eye className="w-4 h-4" />

                      View PDF

                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    {/* APPROVE */}
                    <button
                      type="button"
                      disabled={
                        processingId === note._id
                      }
                      onClick={() =>
                        handleApprove(note._id)
                      }
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black transition"
                    >
                      <CheckCircle className="w-4 h-4" />

                      {processingId === note._id
                        ? 'Processing...'
                        : 'Approve'}
                    </button>

                    {/* REJECT */}
                    <button
                      type="button"
                      disabled={
                        processingId === note._id
                      }
                      onClick={() =>
                        handleReject(note._id)
                      }
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed text-rose-700 border border-rose-200 text-xs font-black transition"
                    >
                      <XCircle className="w-4 h-4" />

                      Reject
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* =======================================
          SUBJECT DISTRIBUTION
      ======================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

        <div className="flex items-center justify-between mb-5">

          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span>
              Subject-wise Approved Notes
            </span>
          </h3>

          <span className="text-[11px] text-slate-400">
            Distribution
          </span>

        </div>

        <div className="space-y-4">

          {subjectDistribution.length > 0 ? (

            subjectDistribution.map(
              (item, index) => {

                const maxCount = Math.max(
                  ...subjectDistribution.map(
                    (subject) =>
                      subject.count || 1
                  )
                );

                const percentage =
                  Math.round(
                    ((item.count || 1) /
                      maxCount) *
                      100
                  );

                return (
                  <div
                    key={`${item.code || 'subject'}-${index}`}
                    className="space-y-1"
                  >

                    <div className="flex items-center justify-between text-xs">

                      <span className="font-bold text-slate-700">
                        {item.code
                          ? `${item.code} - `
                          : ''}
                        {item.subject ||
                          'Unknown Subject'}
                      </span>

                      <span className="text-slate-500">
                        {item.count || 0} notes
                      </span>

                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">

                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(
                            percentage,
                            8
                          )}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              }
            )

          ) : (

            <p className="text-xs text-slate-400 py-6 text-center">
              No approved notes available for subject distribution yet.
            </p>

          )}

        </div>

      </div>

      {/* =======================================
          RECENT UPLOADS
      ======================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

        <div className="flex items-center justify-between mb-4">

          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>
              Recent Note Activity
            </span>
          </h3>

          <Link
            to="/admin/notes"
            className="text-xs font-bold text-purple-600 hover:text-purple-800"
          >
            Manage Notes →
          </Link>

        </div>

        <div className="space-y-3">

          {recentNotes.length > 0 ? (

            recentNotes.map((note) => (

              <div
                key={note._id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >

                <div className="overflow-hidden">

                  <p className="font-bold text-slate-800 truncate">
                    {note.title}
                  </p>

                  <p className="text-[11px] text-slate-400">
                    By{' '}
                    {note.uploadedBy?.name ||
                      'Student'}
                    {note.subject?.code
                      ? ` • ${note.subject.code}`
                      : ''}
                  </p>

                  {note.status && (
                    <span
                      className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        note.status ===
                        'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : note.status ===
                            'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {note.status}
                    </span>
                  )}

                </div>

                <span className="text-[11px] text-slate-400 shrink-0">
                  {note.createdAt
                    ? new Date(
                        note.createdAt
                      ).toLocaleDateString()
                    : ''}
                </span>

              </div>

            ))

          ) : (

            <p className="text-xs text-slate-400 py-6 text-center">
              No recent notes available.
            </p>

          )}

        </div>

      </div>

      {/* =======================================
          ADMIN QUICK ACTIONS
      ======================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <Link
          to="/admin/users"
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-purple-300 hover:shadow-md transition group"
        >
          <Users className="w-6 h-6 text-purple-600 mb-3" />

          <h3 className="font-black text-slate-900">
            Manage Users
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            View and manage registered students.
          </p>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 mt-3">
            Open Users
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          to="/admin/notes"
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition group"
        >
          <FileText className="w-6 h-6 text-indigo-600 mb-3" />

          <h3 className="font-black text-slate-900">
            Manage Notes
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Review approved and uploaded notes.
          </p>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 mt-3">
            Open Notes
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <Link
          to="/admin/reports"
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-rose-300 hover:shadow-md transition group"
        >
          <ShieldAlert className="w-6 h-6 text-rose-600 mb-3" />

          <h3 className="font-black text-slate-900">
            Review Reports
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Handle reported notes and moderation issues.
          </p>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 mt-3">
            Open Reports
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </Link>

      </div>

    </div>
  );
};

export default AdminDashboardPage;