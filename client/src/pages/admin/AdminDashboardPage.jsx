import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  Bookmark,
  Download,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Calendar,
  Sparkles,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const AdminDashboardPage = () => {
  const { error } = useToast();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/stats');
        setStats(res.data.stats);
        setCharts(res.data.charts);
        setActivity(res.data.recentActivity);
      } catch (err) {
        error(err.message || 'Failed to load administrator statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Compiling administrative analytics..." fullPage={true} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Admin Dashboard & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time platform metrics, user growth, uploaded content, and moderation queue
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            {stats?.totalStudents || 0}
          </span>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Total Students Registered
          </p>
        </Link>

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
            Total Notes Uploaded
          </p>
        </Link>

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

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900">
            {stats?.totalDownloads || 0}
          </span>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Total Platform Downloads
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Subject Distribution & Note Popularity */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>Most Popular Subjects (Notes & Downloads)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Distribution</span>
          </div>

          <div className="space-y-3 pt-2">
            {charts?.subjectDistribution && charts.subjectDistribution.length > 0 ? (
              charts.subjectDistribution.map((item, idx) => {
                const maxCount = Math.max(...charts.subjectDistribution.map((c) => c.count || 1));
                const percentage = Math.round(((item.count || 1) / maxCount) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        {item.code} - {item.name}
                      </span>
                      <span className="text-slate-500">
                        {item.count} notes • {item.downloads || 0} downloads
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 15)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Not enough subject activity to render distribution yet.
              </p>
            )}
          </div>
        </div>

        {/* Chart 2: Notes Upload Activity Over Time */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Note Uploads & Registrations Timeline</span>
            </h3>
            <span className="text-[11px] text-slate-400">Activity Trend</span>
          </div>

          {/* Clean SVG Line & Area Visualization */}
          <div className="pt-4">
            <div className="h-44 w-full flex items-end justify-between gap-3 px-2 border-b border-slate-100">
              {charts?.notesOverTime && charts.notesOverTime.length > 0 ? (
                charts.notesOverTime.map((d, index) => {
                  const barHeight = Math.min(Math.max((d.count / (stats?.totalNotes || 1)) * 120, 24), 110);
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition">
                        {d.count}
                      </span>
                      <div
                        className="w-full max-w-[28px] bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-lg transition-all duration-300 group-hover:brightness-110"
                        style={{ height: `${barHeight}px` }}
                      />
                      <span className="text-[10px] text-slate-400 truncate w-full text-center">
                        {d._id?.day}/{d._id?.month}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center text-xs text-slate-400 py-12">
                  Daily tracking trend will populate as uploads increase.
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 mt-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                Uploaded Study Notes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Recent Uploads</span>
            </h3>
            <Link to="/admin/notes" className="text-xs font-bold text-purple-600 hover:text-purple-800">
              Manage Notes →
            </Link>
          </div>

          <div className="space-y-3">
            {activity?.recentNotes?.map((n) => (
              <div
                key={n._id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="overflow-hidden mr-3">
                  <p className="font-bold text-slate-800 truncate">{n.title}</p>
                  <p className="text-[11px] text-slate-400">
                    By {n.uploadedBy?.name || 'Student'} • {n.subject?.code}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Moderation & Pending Reports */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Pending Moderation Flags</span>
            </h3>
            <Link to="/admin/reports" className="text-xs font-bold text-rose-600 hover:text-rose-800">
              View All Reports →
            </Link>
          </div>

          <div className="space-y-3">
            {activity?.recentReports && activity.recentReports.length > 0 ? (
              activity.recentReports.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs"
                >
                  <div className="overflow-hidden mr-3">
                    <p className="font-bold text-rose-950 truncate">
                      {r.note?.title || 'Reported Note'}
                    </p>
                    <p className="text-[11px] text-rose-700 truncate">
                      Reason: "{r.reason}"
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 shrink-0 uppercase">
                    {r.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                All clear! No pending content reports require review.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
