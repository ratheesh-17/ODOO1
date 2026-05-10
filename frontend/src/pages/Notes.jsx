import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, StickyNote } from 'lucide-react';
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
    Promise.all([API.get(`/trips/${tripId}`), API.get(`/trips/${tripId}/notes`)])
      .then(([t, n]) => { setTrip(t.data); setNotes(n.data); })
      .catch(() => navigate(`/trips/${tripId}`))
      .finally(() => setLoading(false));
  }, [tripId, navigate]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newNote.content.trim()) return;
    try {
      const res = await API.post(`/trips/${tripId}/notes`, { title: newNote.title || null, content: newNote.content });
      setNotes(p => [res.data, ...p]);
      setNewNote({ title: '', content: '' });
      setAdding(false);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to add note'); }
  };

  const handleEdit = async (noteId) => {
    try {
      const res = await API.put(`/trips/${tripId}/notes/${noteId}`, { title: editData.title || null, content: editData.content });
      setNotes(p => p.map(n => n.id === noteId ? res.data : n));
      setEditingId(null);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to update note'); }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    await API.delete(`/trips/${tripId}/notes/${noteId}`);
    setNotes(p => p.filter(n => n.id !== noteId));
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50"><Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="page-container max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/trips/${tripId}`)}
              className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="page-title">Trip Notes</h1>
              <p className="text-sm text-gray-500 mt-0.5">{trip?.name}</p>
            </div>
          </div>
          <button onClick={() => setAdding(true)} className="btn-primary"><Plus className="h-4 w-4" /> Add Note</button>
        </div>

        {error && <div className="alert-error mb-4">{error}</div>}

        {adding && (
          <div className="card border-2 border-blue-200 mb-4">
            <form onSubmit={handleAdd} className="space-y-3">
              <input type="text" placeholder="Title (optional)" className="input-field"
                value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })} />
              <textarea required rows={4} placeholder="Write your note..." className="input-field resize-none"
                value={newNote.content} onChange={e => setNewNote({ ...newNote, content: e.target.value })} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setAdding(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save Note</button>
              </div>
            </form>
          </div>
        )}

        {notes.length === 0 && !adding ? (
          <div className="card text-center py-16">
            <StickyNote className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No notes yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map(note => (
              <div key={note.id} className="card">
                {editingId === note.id ? (
                  <div className="space-y-3">
                    <input type="text" placeholder="Title (optional)" className="input-field"
                      value={editData.title || ''} onChange={e => setEditData({ ...editData, title: e.target.value })} />
                    <textarea rows={4} className="input-field resize-none"
                      value={editData.content} onChange={e => setEditData({ ...editData, content: e.target.value })} />
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(note.id)} className="btn-primary text-sm py-1.5 px-3">
                        <Check className="h-4 w-4" /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary text-sm py-1.5 px-3">
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        {note.title && <h3 className="font-semibold text-gray-900 mb-0.5">{note.title}</h3>}
                        <p className="text-xs text-gray-400">{new Date(note.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingId(note.id); setEditData({ title: note.title || '', content: note.content }); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(note.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notes;
