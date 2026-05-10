import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const Notes = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [tripRes, notesRes] = await Promise.all([
          API.get(`/trips/${tripId}`),
          API.get(`/trips/${tripId}/notes`),
        ]);
        setTrip(tripRes.data);
        setNotes(notesRes.data);
      } catch {
        navigate(`/trips/${tripId}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId, navigate]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newNote.content.trim()) return;
    try {
      const res = await API.post(`/trips/${tripId}/notes`, {
        title: newNote.title || null,
        content: newNote.content,
      });
      setNotes([res.data, ...notes]);
      setNewNote({ title: '', content: '' });
      setAdding(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add note');
    }
  };

  const handleEdit = async (noteId) => {
    try {
      const res = await API.put(`/trips/${tripId}/notes/${noteId}`, {
        title: editData.title || null,
        content: editData.content,
      });
      setNotes(notes.map((n) => (n.id === noteId ? res.data : n)));
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update note');
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await API.delete(`/trips/${tripId}/notes/${noteId}`);
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch {
      setError('Failed to delete note');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(`/trips/${tripId}`)} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trip Notes</h1>
              <p className="text-sm text-gray-600">{trip?.name}</p>
            </div>
          </div>
          <button onClick={() => setAdding(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Note</span>
          </button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {/* Add note form */}
        {adding && (
          <div className="card border-2 border-blue-200">
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                type="text"
                placeholder="Title (optional)"
                className="input-field"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
              <textarea
                required
                rows={4}
                placeholder="Write your note..."
                className="input-field"
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              />
              <div className="flex space-x-3">
                <button type="button" onClick={() => setAdding(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save Note</button>
              </div>
            </form>
          </div>
        )}

        {notes.length === 0 && !adding ? (
          <div className="card text-center py-12 text-gray-500">
            <p>No notes yet. Add one above!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="card">
              {editingId === note.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Title (optional)"
                    className="input-field"
                    value={editData.title || ''}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  />
                  <textarea
                    rows={4}
                    className="input-field"
                    value={editData.content}
                    onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                  />
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(note.id)} className="btn-primary flex items-center space-x-1 px-3 py-1.5 text-sm">
                      <Check className="h-4 w-4" /><span>Save</span>
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary flex items-center space-x-1 px-3 py-1.5 text-sm">
                      <X className="h-4 w-4" /><span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      {note.title && <h3 className="font-semibold text-gray-900">{note.title}</h3>}
                      <p className="text-xs text-gray-400">{new Date(note.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => { setEditingId(note.id); setEditData({ title: note.title || '', content: note.content }); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(note.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">{note.content}</p>
                </>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default Notes;
