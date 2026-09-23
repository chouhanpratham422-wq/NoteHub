import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Heart, Github, BookOpen, ShieldCheck, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Brand & Project Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-slate-900">NoteHub</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              A peer-to-peer academic repository designed for college engineering students to share, search, and access verified lecture notes and exam guides.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Explore
            </h4>

            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/" className="hover:text-indigo-600 transition">
                  Home
                </Link>
              </li>

              <li>
                <Link to="/browse" className="hover:text-indigo-600 transition">
                  Browse All Notes
                </Link>
              </li>

              <li>
                <Link to="/upload" className="hover:text-indigo-600 transition">
                  Upload PDF Notes
                </Link>
              </li>

              <li>
                <Link to="/dashboard" className="hover:text-indigo-600 transition">
                  Student Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Academic Portal Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Guidelines
            </h4>

            <p className="text-xs text-slate-500 leading-relaxed">
              All notes uploaded must be strictly in PDF format under 100 MB. Inappropriate or copyright-infringing content can be flagged for immediate administrative review.
            </p>

            <div className="mt-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                Department:
              </span>{' '}
              Computer Science & Engineering
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} NoteHub.</p>

          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>using React, Node, Express & MongoDB</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
  
