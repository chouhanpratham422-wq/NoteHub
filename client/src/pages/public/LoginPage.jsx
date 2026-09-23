import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const LoginPage = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      error('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);

      const user = await login(email, password);

      success(`Welcome back, ${user.name}!`);

      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from === '/admin' ? '/dashboard' : from);
      }
    } catch (err) {
      error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-100 mb-3">
            <GraduationCap className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign In to NoteHub
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Access subject notes, uploads, reviews, and course materials
          </p>
        </div>

        {/* Demo Accounts Quick Login */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 text-xs">

          <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Examiner / Demo Quick Logins</span>
          </div>

          <div className="grid grid-cols-2 gap-2">

            {/* Student Demo */}
            <button
              type="button"
              onClick={() =>
                handleQuickLogin(
                  'student@college.edu',
                  'Password123!'
                )
              }
              className="px-3 py-2 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 rounded-xl font-semibold text-indigo-700 transition shadow-sm text-center"
            >
              Fill Student Demo
              <span className="block text-[10px] opacity-75 font-normal">
                student@college.edu
              </span>
            </button>

            {/* Admin Demo */}
            <button
              type="button"
              onClick={() =>
                handleQuickLogin(
                  'admin@college.edu',
                  'Admin123!'
                )
              }
              className="px-3 py-2 bg-white hover:bg-purple-600 hover:text-white border border-purple-200 rounded-xl font-semibold text-purple-700 transition shadow-sm text-center"
            >
              Fill Admin Demo
              <span className="block text-[10px] opacity-75 font-normal">
                admin@college.edu
              </span>
            </button>

            {/* Separate Admin Login */}
            <button
              type="button"
              onClick={() =>
                handleQuickLogin(
                  'admin@college.edu',
                  'Admin123!'
                )
              }
              className="col-span-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition shadow-sm text-center"
            >
              🔐 Admin Login
            </button>

          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Email Address
              </label>

              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-100 transition disabled:opacity-50 mt-2"
            >
              <LogIn className="w-4 h-4" />

              <span>
                {loading ? 'Authenticating...' : 'Sign In'}
              </span>
            </button>

          </form>

          {/* Register Link */}
          <div className="text-center mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            Don't have an account yet?{' '}

            <Link
              to="/register"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Create an Account
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;