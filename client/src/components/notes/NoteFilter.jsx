import React from 'react';
import { Search, SlidersHorizontal, RotateCcw, X } from 'lucide-react';

const NoteFilter = ({
  filters,
  subjects = [],
  onFilterChange,
  onReset,
}) => {
  const branches = [
    { label: 'All Branches', value: 'all' },
    { label: 'Computer Science (CSE)', value: 'CSE' },
    { label: 'Information Technology (IT)', value: 'IT' },
    { label: 'Electronics & Comm (ECE)', value: 'ECE' },
    { label: 'Mechanical Eng (ME)', value: 'ME' },
    { label: 'Civil Eng (CE)', value: 'CE' },
  ];

  const semesters = ['all', '1', '2', '3', '4', '5', '6', '7', '8'];

  const sortOptions = [
    { label: 'Latest Uploads', value: 'latest' },
    { label: 'Most Downloaded', value: 'popular' },
    { label: 'Highest Rated', value: 'rating' },
    { label: 'Oldest First', value: 'oldest' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onFilterChange('search', e.target.value)}
          placeholder="Search notes by title, topic, keyword, or tags (e.g. DBMS, normalization)..."
          className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange('search', '')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Semester Filter Pills */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Semester
        </label>
        <div className="flex flex-wrap gap-1.5">
          {semesters.map((sem) => (
            <button
              key={sem}
              type="button"
              onClick={() => onFilterChange('semester', sem)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                filters.semester === sem
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sem === 'all' ? 'All Semesters' : `Sem ${sem}`}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
        {/* Branch Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Engineering Branch
          </label>
          <select
            value={filters.branch || 'all'}
            onChange={(e) => onFilterChange('branch', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          >
            {branches.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Subject
          </label>
          <select
            value={filters.subject || 'all'}
            onChange={(e) => onFilterChange('subject', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Sort Order
          </label>
          <select
            value={filters.sort || 'latest'}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reset Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <span className="text-slate-400">
          Showing filtered results
        </span>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All Filters
        </button>
      </div>
    </div>
  );
};

export default NoteFilter;
