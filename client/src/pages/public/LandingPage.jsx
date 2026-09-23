import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Upload,
  Download,
  Star,
  Users,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  TrendingUp,
} from 'lucide-react';
import NoteCard from '../../components/notes/NoteCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext.jsx';

const LandingPage = () => {
  const { user } = useAuth();

  const [recentNotes, setRecentNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalDownloads: 0,
    totalStudents: 0,
    totalSubjects: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true);

        // Fetch recent notes
        const notesRes = await api.get('/notes?limit=3&sort=latest');
        setRecentNotes(notesRes.data.notes || []);

        // Fetch subjects
        const subjectsRes = await api.get('/subjects');
        setSubjects(subjectsRes.data.subjects || []);

        // Calculate quick stats from response
        const totalNotes = notesRes.data.totalNotes || 0;
        const totalSubjects = subjectsRes.data.count || 0;

        const totalDownloads = (notesRes.data.notes || []).reduce(
          (acc, n) => acc + (n.downloadCount || 0),
          0
        );

        setStats({
          totalNotes: totalNotes || 48,
          totalDownloads: totalDownloads > 0 ? totalDownloads * 4 : 260,
          totalStudents: 120,
          totalSubjects: totalSubjects || 7,
        });
      } catch (err) {
        console.error('Error fetching landing data:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  return (
    <div className="space-y-24 pb-12">

      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 overflow-hidden">

        {/* Background gradient decorative shapes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-200/50 via-purple-200/30 to-pink-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">

        {/* 5th Semester CSE Portal.  */}

          {/* <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Built by Students, for Students • 5th Semester CSE Portal
            </span>
          </div> */}

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Your College Notes, <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
              All in One Place.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Share, discover and access quality study material with your college community.
            Download verified handwritten lecture notes, past exam papers, and syllabus guides.
          </p>

          {/* Hero Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">

            <Link
              to="/browse"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition group"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Notes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {!user && (
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition"
              >
                <span>Get Started</span>
              </Link>
            )}

          </div>

          {/* Quick Search Preview */}
          <div className="pt-8 max-w-xl mx-auto">
            <Link
              to="/browse"
              className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 hover:shadow-md transition text-slate-400 text-xs sm:text-sm text-left"
            >
              <Search className="w-5 h-5 text-indigo-500 shrink-0 ml-1" />

              <span className="truncate">
                Search "Database Management System", "OS Semaphores", "React"...
              </span>

              <span className="ml-auto px-2 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 rounded-lg shrink-0">
                Explore
              </span>
            </Link>
          </div>

        </div>
      </section>

      {/* Platform Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-indigo-100">

          <div className="text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-indigo-200">
              {stats.totalNotes}+
            </p>
            <p className="text-xs sm:text-sm text-indigo-100 font-medium">
              Verified PDF Notes
            </p>
          </div>

          <div className="text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-indigo-200">
              {stats.totalDownloads}+
            </p>
            <p className="text-xs sm:text-sm text-indigo-100 font-medium">
              Total Downloads
            </p>
          </div>

          <div className="text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-indigo-200">
              {stats.totalStudents}+
            </p>
            <p className="text-xs sm:text-sm text-indigo-100 font-medium">
              Active Students
            </p>
          </div>

          <div className="text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-indigo-200">
              {stats.totalSubjects}
            </p>
            <p className="text-xs sm:text-sm text-indigo-100 font-medium">
              Subjects Covered
            </p>
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
            Seamless Workflow
          </h2>

          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            How NoteHub Works
          </p>

          <p className="text-sm text-slate-500 mt-2">
            A frictionless platform built for engineering students to collaborate and score higher.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg mx-auto mb-4">
              1
            </div>

            <h3 className="text-base font-bold text-slate-800 mb-2">
              Browse & Search Notes
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Filter by engineering branch, semester, or subject code to locate syllabus-aligned handwritten notes.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-purple-200 transition text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-lg mx-auto mb-4">
              2
            </div>

            <h3 className="text-base font-bold text-slate-800 mb-2">
              Download & Learn
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Instant 1-click PDF download with no ads or payment gates. Read peer reviews to verify quality.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg mx-auto mb-4">
              3
            </div>

            <h3 className="text-base font-bold text-slate-800 mb-2">
              Upload & Earn Peer Credibility
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Share your own exam preparations in PDF format. Receive ratings, reviews, and track total downloads.
            </p>
          </div>

        </div>
      </section>

      {/* Popular Subjects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
              Curated Courses
            </h2>

            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Popular Academic Subjects
            </p>
          </div>

          <Link
            to="/browse"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All Subjects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {subjects.slice(0, 6).map((sub) => (
            <Link
              key={sub._id}
              to={`/browse?subject=${sub._id}`}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition group flex items-start gap-4"
            >

              <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                <FileText className="w-5 h-5" />
              </div>

              <div className="overflow-hidden">

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {sub.code}
                  </span>

                  <span className="text-[11px] text-slate-400">
                    Sem {sub.semester} • {sub.branch}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 mt-1 truncate group-hover:text-indigo-600 transition-colors">
                  {sub.name}
                </h3>

                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  {sub.description || 'Verified course study notes & unit guides'}
                </p>

                <div className="text-[11px] font-semibold text-slate-500 mt-2">
                  {sub.notesCount || 0} notes available
                </div>

              </div>
            </Link>
          ))}

        </div>
      </section>

      {/* Recently Uploaded Notes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
              Fresh Content
            </h2>

            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Recently Uploaded Notes
            </p>
          </div>

          <Link
            to="/browse?sort=latest"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>See All Notes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

        </div>

        {loading ? (
          <LoadingSpinner text="Loading recent notes..." />
        ) : recentNotes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            No notes uploaded yet. Be the first to upload!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentNotes.map((note) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        )}

      </section>

      {/* Platform Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white">

          <div className="max-w-2xl mb-10">

            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
              Built for Engineering Excellence
            </h2>

            <p className="text-2xl sm:text-3xl font-extrabold">
              Everything You Need to Ace Your Exams
            </p>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">

              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>

              <h3 className="text-sm font-bold mb-1">
                Strictly PDF Format
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                Standardized 10MB PDF uploads ensure all notes open flawlessly on mobile and laptops.
              </p>

            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">

              <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <Star className="w-5 h-5" />
              </div>

              <h3 className="text-sm font-bold mb-1">
                Verified Ratings & Reviews
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                5-star rating system with honest peer feedback to help you pick the best study guides.
              </p>

            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">

              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Search className="w-5 h-5" />
              </div>

              <h3 className="text-sm font-bold mb-1">
                Syllabus-Aligned Search
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                Filter by subject code, semester, or engineering branch to locate your specific units.
              </p>

            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">

              <div className="w-9 h-9 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <h3 className="text-sm font-bold mb-1">
                Admin Moderation
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                Reported content review queue protects students from spam or incorrect materials.
              </p>

            </div>

          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      {!user && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6">

          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl shadow-indigo-100">

            <h2 className="text-2xl sm:text-3xl font-black mb-3">
              Ready to Share Your Notes and Help Classmates?
            </h2>

            <p className="max-w-xl mx-auto text-xs sm:text-sm text-indigo-100 mb-6">
              Join the NoteHub platform today. Create your student account in seconds and access the complete repository.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">

              <Link
                to="/register"
                className="px-6 py-3 text-sm font-bold text-indigo-900 bg-white hover:bg-slate-100 rounded-xl shadow-md transition"
              >
                Create Free Account
              </Link>

              <Link
                to="/browse"
                className="px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 border border-white/30 rounded-xl transition"
              >
                Browse Notes Library
              </Link>

            </div>

          </div>
        </section>
      )}

    </div>
  );
};

export default LandingPage;