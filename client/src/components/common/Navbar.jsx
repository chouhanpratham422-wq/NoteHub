import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  BookOpen,
  Upload,
  FolderHeart,
  User,
  LogOut,
  LayoutDashboard,
  Users,
  FileText,
  Bookmark,
  ShieldAlert,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'text-indigo-600 bg-indigo-50 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const mobileNavLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 text-base font-medium rounded-xl transition ${
      isActive
        ? 'text-indigo-600 bg-indigo-50 font-semibold'
        : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                NoteHub
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                CSE Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkClasses}>
              Home
            </NavLink>
            <NavLink to="/browse" className={navLinkClasses}>
              <BookOpen className="w-4 h-4" />
              Browse Notes
            </NavLink>

            {user && (
              <>
                <NavLink to="/upload" className={navLinkClasses}>
                  <Upload className="w-4 h-4" />
                  Upload Notes
                </NavLink>
                <NavLink to="/my-uploads" className={navLinkClasses}>
                  <FolderHeart className="w-4 h-4" />
                  My Uploads
                </NavLink>
              </>
            )}

            {/* Admin Exclusive Links */}
            {isAdmin && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200 ml-1">
                <NavLink to="/admin" className={navLinkClasses} end>
                  <LayoutDashboard className="w-4 h-4 text-purple-600" />
                  Admin
                </NavLink>
                <NavLink to="/admin/users" className={navLinkClasses}>
                  <Users className="w-4 h-4 text-purple-600" />
                  Users
                </NavLink>
                <NavLink to="/admin/notes" className={navLinkClasses}>
                  <FileText className="w-4 h-4 text-purple-600" />
                  Notes
                </NavLink>
                <NavLink to="/admin/subjects" className={navLinkClasses}>
                  <Bookmark className="w-4 h-4 text-purple-600" />
                  Subjects
                </NavLink>
                <NavLink to="/admin/reports" className={navLinkClasses}>
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  Reports
                </NavLink>
              </div>
            )}
          </div>

          {/* Right Section: Auth buttons or User Profile */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-semibold text-slate-800 leading-tight">
                      {user.name?.split(' ')[0]}
                    </span>
                    <span className="block text-[10px] font-medium text-slate-400 capitalize">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {user.branch || 'CSE'} • Sem {user.semester || 5}
                      </span>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      Dashboard
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Profile & Settings
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-1">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavLinkClasses}
          >
            Home
          </NavLink>
          <NavLink
            to="/browse"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavLinkClasses}
          >
            <BookOpen className="w-5 h-5" />
            Browse Notes
          </NavLink>

          {user && (
            <>
              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                <LayoutDashboard className="w-5 h-5" />
                Student Dashboard
              </NavLink>
              <NavLink
                to="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                <Upload className="w-5 h-5" />
                Upload Notes
              </NavLink>
              <NavLink
                to="/my-uploads"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                <FolderHeart className="w-5 h-5" />
                My Uploads
              </NavLink>
              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                <User className="w-5 h-5" />
                My Profile
              </NavLink>
            </>
          )}

          {isAdmin && (
            <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
              <span className="block px-4 py-1 text-xs font-bold uppercase tracking-wider text-purple-600">
                Admin Panel
              </span>
              <NavLink
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
                end
              >
                <LayoutDashboard className="w-5 h-5 text-purple-600" />
                Admin Dashboard
              </NavLink>
              <NavLink
                to="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                <Users className="w-5 h-5 text-purple-600" />
                Manage Users
              </NavLink>
              <NavLink
                to="/admin/notes"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                <FileText className="w-5 h-5 text-purple-600" />
                Manage Notes
              </NavLink>
              <NavLink
                to="/admin/subjects"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                <Bookmark className="w-5 h-5 text-purple-600" />
                Manage Subjects
              </NavLink>
              <NavLink
                to="/admin/reports"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClasses}
              >
                <ShieldAlert className="w-5 h-5 text-purple-600" />
                Reports & Flags
              </NavLink>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out ({user.name})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
