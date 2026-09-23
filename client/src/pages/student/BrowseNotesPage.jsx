import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, AlertCircle } from 'lucide-react';
import NoteFilter from '../../components/notes/NoteFilter';
import NoteCard from '../../components/notes/NoteCard';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';

const BrowseNotesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotes, setTotalNotes] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    subject: searchParams.get('subject') || 'all',
    semester: searchParams.get('semester') || 'all',
    branch: searchParams.get('branch') || 'all',
    sort: searchParams.get('sort') || 'latest',
  });

  // Fetch subjects once
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/subjects');
        setSubjects(res.data.subjects || []);
      } catch (err) {
        console.error('Error fetching subjects:', err.message);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch notes based on current filters and page
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.subject && filters.subject !== 'all') params.set('subject', filters.subject);
      if (filters.semester && filters.semester !== 'all') params.set('semester', filters.semester);
      if (filters.branch && filters.branch !== 'all') params.set('branch', filters.branch);
      if (filters.sort) params.set('sort', filters.sort);
      params.set('page', currentPage.toString());
      params.set('limit', '9');

      // Update URL search parameters
      setSearchParams(params);

      const res = await api.get(`/notes?${params.toString()}`);
      setNotes(res.data.notes || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalNotes(res.data.totalNotes || 0);
    } catch (err) {
      console.error('Error fetching notes:', err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, setSearchParams]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to page 1 on filter modification
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      subject: 'all',
      semester: 'all',
      branch: 'all',
      sort: 'latest',
    });
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Subject Notes Repository</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Browse Academic Notes
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Discover verified unit notes, solved problems, and revision cheatsheets
        </p>
      </div>

      {/* Filter Component */}
      <NoteFilter
        filters={filters}
        subjects={subjects}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Notes Grid and States */}
      <div>
        <div className="flex items-center justify-between mb-4 text-xs font-semibold text-slate-500">
          <span>Found {totalNotes} note{totalNotes === 1 ? '' : 's'}</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>

        {loading ? (
          <LoadingSpinner text="Searching study materials..." />
        ) : notes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No Notes Match Your Filters
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We couldn't find any notes matching your search keywords or branch/semester filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </div>
    </div>
  );
};

export default BrowseNotesPage;
