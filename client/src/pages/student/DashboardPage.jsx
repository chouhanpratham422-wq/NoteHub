import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Upload,
  FolderHeart,
  Download,
  Star,
  FileText,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NoteCard from '../../components/notes/NoteCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';

const DashboardPage = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalAvailable: 0,
    myUploadsCount: 0,
    myTotalDownloads: 0,
    myAverageRating: 0,
  });

  const [recentNotes, setRecentNotes] = useState([]);
  const [popularNotes, setPopularNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch user's own uploads stats
        const myRes = await api.get('/notes/my-uploads');
        const myCount = myRes.data.count || 0;
        const myDownloads = myRes.data.totalDownloads || 0;
        const myRating = myRes.data.averageRating || 0;

        // Fetch general notes
        const generalRes = await api.get('/notes?limit=4&sort=latest');
        const totalNotes = generalRes.data.totalNotes || 0;
        setRecentNotes(generalRes.data.notes || []);

        // Fetch popular notes
        const popRes = await api.get('/notes?limit=4&sort=popular');
        setPopularNotes(popRes.data.notes || []);

        setStats({
          totalAvailable: totalNotes,
          myUploadsCount: myCount,
          myTotalDownloads: myDownloads,
          myAverageRating: myRating,
        });
      } catch (err) {
        console.error('Error loading student dashboard:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading student dashboard..." fullPage={true} />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Student Academic Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name}!
          </h1>

          <p className="text-xs sm:text-sm text-indigo-200 mt-1 leading-relaxed">
            {user?.college || 'Engineering Institute'} • {user?.branch || 'CSE'} (Semester {user?.semester || 5})
          </p>

          <div className="flex flex-wrap gap-2.5 mt-6">
            <Link
              to="/browse"
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-950 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-100 transition"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Browse All Notes</span>
            </Link>
            <Link
              to="/upload"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl border border-white/20 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New PDF Note</span>
            </Link>
            <Link
              to="/my-uploads"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition"
            >
              <FolderHeart className="w-4 h-4" />
              <span>My Uploads</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Available */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-800">
            {stats.totalAvailable}
          </span>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Total Notes Available
          </p>
        </div>

        {/* My Uploads */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <FolderHeart className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-800">
            {stats.myUploadsCount}
          </span>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            My Uploaded Notes
          </p>
        </div>

        {/* Total Downloads on My Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Download className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-800">
            {stats.myTotalDownloads}
          </span>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Total Downloads Received
          </p>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Star className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-800">
            {stats.myAverageRating ? Number(stats.myAverageRating).toFixed(1) : '—'}
          </span>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Average Peer Rating
          </p>
        </div>
      </div>

      {/* Popular Notes Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Popular Notes Among Classmates
            </h2>
          </div>
          <Link
            to="/browse?sort=popular"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularNotes.map((note) => (
            <NoteCard key={note._id} note={note} />
          ))}
        </div>
      </section>

      {/* Recently Uploaded Notes Section */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Recently Uploaded Notes
            </h2>
          </div>
          <Link
            to="/browse?sort=latest"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {recentNotes.map((note) => (
            <NoteCard key={note._id} note={note} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
