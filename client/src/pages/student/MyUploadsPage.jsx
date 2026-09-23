import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderHeart,
  Upload,
  Download,
  Star,
  Edit,
  Trash2,
  Eye,
  FileText,
  Calendar,
  AlertCircle,
  X,
  Save,
} from 'lucide-react';
import StarRating from '../../components/common/StarRating';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const MyUploadsPage = () => {
  const { success, error } = useToast();

  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchMyUploads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notes/my-uploads');
      setNotes(res.data.notes || []);
    } catch (err) {
      error(err.message || 'Failed to fetch your uploads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyUploads();

    // Fetch subjects for edit dropdown
    api.get('/subjects').then((res) => {
      setSubjects(res.data.subjects || []);
    });
  }, []);

  const handleDeletePrompt = (note) => {
    setNoteToDelete(note);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/notes/${noteToDelete._id}`);
      success('Note deleted successfully.');
      setDeleteModalOpen(false);
      setNoteToDelete(null);
      await fetchMyUploads();
    } catch (err) {
      error(err.message || 'Failed to delete note.');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditPrompt = (note) => {
    setEditingNote({
      id: note._id,
      title: note.title,
      description: note.description,
      subject: note.subject?._id || note.subject,
      semester: note.semester,
      branch: note.branch,
      tags: note.tags ? note.tags.join(', ') : '',
    });
    setEditModalOpen(true);
  };

  const saveNoteEdit = async (e) => {
    e.preventDefault();
    if (!editingNote) return;

    try {
      setSavingEdit(true);
      await api.put(`/notes/${editingNote.id}`, {
        title: editingNote.title,
        description: editingNote.description,
        subject: editingNote.subject,
        semester: editingNote.semester,
        branch: editingNote.branch,
        tags: editingNote.tags,
      });

      success('Note updated successfully!');
      setEditModalOpen(false);
      setEditingNote(null);
      await fetchMyUploads();
    } catch (err) {
      error(err.message || 'Failed to update note.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <FolderHeart className="w-4 h-4" />
            <span>Author Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Uploaded Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your shared study materials, track downloads, and review feedback
          </p>
        </div>

        <Link
          to="/upload"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition self-start"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Another Note</span>
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading your uploads..." />
      ) : notes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <FolderHeart className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            No Uploads Found
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            You have not uploaded any notes yet. Share your handwritten notes or unit summaries to help your peers!
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Your First Note</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    {note.subject?.code} • {note.subject?.name}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    Sem {note.semester}
                  </span>
                </div>

                <Link to={`/notes/${note._id}`}>
                  <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition line-clamp-2">
                    {note.title}
                  </h3>
                </Link>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {note.description}
                </p>

                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1 font-semibold">
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>{note.downloadCount || 0} downloads</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold">
                    <StarRating rating={note.averageRating || 0} size="sm" />
                    <span>{note.averageRating ? Number(note.averageRating).toFixed(1) : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-400">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/notes/${note._id}`}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="View Note"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleEditPrompt(note)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="Edit Note"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePrompt(note)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Note Modal */}
      {editModalOpen && editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full p-6 relative">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Edit Note Information
            </h3>

            <form onSubmit={saveNoteEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, title: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={editingNote.description}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, description: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={editingNote.subject}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, subject: e.target.value })
                    }
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={editingNote.semester}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, semester: e.target.value })
                    }
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={editingNote.tags}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, tags: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete uploaded note?"
        message={`Are you sure you want to delete "${noteToDelete?.title}"? This cannot be undone.`}
        confirmText="Delete Note"
        isDanger={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default MyUploadsPage;
