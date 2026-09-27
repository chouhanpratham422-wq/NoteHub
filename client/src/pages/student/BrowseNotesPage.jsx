import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import { useSearchParams } from 'react-router-dom';

import {
  BookOpen,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';

import NoteFilter from '../../components/notes/NoteFilter';
import NoteCard from '../../components/notes/NoteCard';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';

const BrowseNotesPage = () => {
  const [searchParams, setSearchParams] =
    useSearchParams();

  // =======================================
  // NOTES
  // =======================================
  const [notes, setNotes] = useState([]);

  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] =
    useState(true);

  // =======================================
  // PAGINATION
  // =======================================
  const [currentPage, setCurrentPage] =
    useState(
      Math.max(
        parseInt(
          searchParams.get('page') || '1',
          10
        ) || 1,
        1
      )
    );

  const [totalPages, setTotalPages] =
    useState(1);

  const [totalNotes, setTotalNotes] =
    useState(0);

  // =======================================
  // FILTERS
  // =======================================
  const [filters, setFilters] =
    useState({
      search:
        searchParams.get('search') || '',

      subject:
        searchParams.get('subject') ||
        'all',

      semester:
        searchParams.get('semester') ||
        'all',

      branch:
        searchParams.get('branch') ||
        'all',

      sort:
        searchParams.get('sort') ||
        'latest',
    });

  // =======================================
  // CHECK WHETHER FILTERS ARE ACTIVE
  // =======================================
  const hasActiveFilters =
    Boolean(
      filters.search.trim() ||
      filters.subject !== 'all' ||
      filters.semester !== 'all' ||
      filters.branch !== 'all' ||
      filters.sort !== 'latest'
    );

  // =======================================
  // FETCH SUBJECTS
  // =======================================
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get(
          '/subjects'
        );

        setSubjects(
          res.data.subjects || []
        );
      } catch (err) {
        console.error(
          'Error fetching subjects:',
          err
        );
      }
    };

    fetchSubjects();
  }, []);

  // =======================================
  // FETCH NOTES
  // =======================================
  const fetchNotes = useCallback(
    async () => {
      try {
        setLoading(true);

        const params =
          new URLSearchParams();

        // Search
        if (
          filters.search &&
          filters.search.trim()
        ) {
          params.set(
            'search',
            filters.search.trim()
          );
        }

        // Subject
        if (
          filters.subject &&
          filters.subject !== 'all'
        ) {
          params.set(
            'subject',
            filters.subject
          );
        }

        // Semester
        if (
          filters.semester &&
          filters.semester !== 'all'
        ) {
          params.set(
            'semester',
            filters.semester
          );
        }

        // Branch
        if (
          filters.branch &&
          filters.branch !== 'all'
        ) {
          params.set(
            'branch',
            filters.branch
          );
        }

        // Sort
        params.set(
          'sort',
          filters.sort || 'latest'
        );

        // Pagination
        params.set(
          'page',
          String(currentPage)
        );

        params.set(
          'limit',
          '9'
        );

        // Update browser URL
        setSearchParams(params);

        // API request
        const res = await api.get(
          `/notes?${params.toString()}`
        );

        const receivedNotes =
          res.data.notes || [];

        const receivedTotalNotes =
          Number(
            res.data.totalNotes ?? 0
          );

        const receivedTotalPages =
          Number(
            res.data.totalPages ?? 1
          );

        setNotes(receivedNotes);

        setTotalNotes(
          receivedTotalNotes
        );

        setTotalPages(
          Math.max(
            receivedTotalPages,
            1
          )
        );
      } catch (err) {
        console.error(
          'Error fetching notes:',
          err
        );

        setNotes([]);

        setTotalNotes(0);

        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [
      filters,
      currentPage,
      setSearchParams,
    ]
  );

  // =======================================
  // FETCH WHEN FILTER/PAGE CHANGES
  // =======================================
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // =======================================
  // FILTER CHANGE
  // =======================================
  const handleFilterChange = (
    key,
    value
  ) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));

    // Always return to first page
    // when changing a filter.
    setCurrentPage(1);
  };

  // =======================================
  // RESET ALL FILTERS
  // =======================================
  const handleResetFilters = () => {
    const resetFilters = {
      search: '',
      subject: 'all',
      semester: 'all',
      branch: 'all',
      sort: 'latest',
    };

    setFilters(resetFilters);

    setCurrentPage(1);

    // Clear URL immediately
    setSearchParams({});
  };

  // =======================================
  // PAGE CHANGE
  // =======================================
  const handlePageChange = (page) => {
    const safePage = Math.max(
      Number(page) || 1,
      1
    );

    setCurrentPage(safePage);

    // Scroll to top after changing page
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // =======================================
  // RESULT TEXT
  // =======================================
  const getResultText = () => {
    if (loading) {
      return 'Searching...';
    }

    if (totalNotes === 0) {
      return 'No notes found';
    }

    if (hasActiveFilters) {
      return `Showing filtered results: ${totalNotes} note${
        totalNotes === 1 ? '' : 's'
      }`;
    }

    return `Showing all verified notes: ${totalNotes} note${
      totalNotes === 1 ? '' : 's'
    }`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ===================================
          HEADER
      =================================== */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />

          <span>
            Subject Notes Repository
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Browse Academic Notes
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Discover verified unit notes,
          solved problems, and revision
          cheatsheets
        </p>
      </div>

      {/* ===================================
          FILTERS
      =================================== */}
      <NoteFilter
        filters={filters}
        subjects={subjects}
        onFilterChange={
          handleFilterChange
        }
        onReset={
          handleResetFilters
        }
      />

      {/* ===================================
          RESULTS HEADER
      =================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <div className="flex items-center gap-2">

            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700">
                {getResultText()}
              </p>

              {!loading &&
                hasActiveFilters && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Results match your selected
                    search and filters.
                  </p>
                )}
            </div>

          </div>

          {!loading &&
            totalNotes > 0 && (
              <span className="text-xs font-semibold text-slate-500">
                Page {currentPage} of{' '}
                {totalPages}
              </span>
            )}

        </div>
      </div>

      {/* ===================================
          NOTES
      =================================== */}
      <div>

        {loading ? (
          <LoadingSpinner
            text="Searching study materials..."
          />
        ) : notes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">

            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-800">
              No Notes Match Your Filters
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              We couldn't find any verified
              notes matching your selected
              search, subject, semester, or
              branch filters.
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={
                  handleResetFilters
                }
                className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
              >
                Clear All Filters
              </button>
            )}

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {notes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
              />
            ))}

          </div>
        )}

        {/* =================================
            PAGINATION
        ================================= */}
        {!loading &&
          notes.length > 0 &&
          totalPages > 1 && (
            <Pagination
              currentPage={
                currentPage
              }
              totalPages={
                totalPages
              }
              onPageChange={
                handlePageChange
              }
            />
          )}

      </div>
    </div>
  );
};

export default BrowseNotesPage;