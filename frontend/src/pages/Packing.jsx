import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, RotateCcw, Package, Edit2, Check, X, CheckCircle2 } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const CATEGORIES = ['clothing', 'documents', 'electronics', 'toiletries', 'medicines', 'other'];

const CAT_META = {
  clothing:    { color: 'bg-pink-100 text-pink-700',   icon: '👕' },
  documents:   { color: 'bg-blue-100 text-blue-700',   icon: '📄' },
  electronics: { color: 'bg-purple-100 text-purple-700',icon: '💻' },
  toiletries:  { color: 'bg-teal-100 text-teal-700',   icon: '🧴' },
  medicines:   { color: 'bg-red-100 text-red-700',     icon: '💊' },
  other:       { color: 'bg-gray-100 text-gray-600',   icon: '📦' },
};

const Packing = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [items, setItems]     = useState([]);
  const [trip, setTrip]       = useState(null);
  const [newItem, setNewItem] = useState({ name: '', category: 'other' });
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName]   = useState('');
  const [filterCat, setFilterCat] = useState('all');

  useEffect(() => {
    Promise.all([API.get(`/trips/${tripId}`), API.get(`/trips/${tripId}/packing`)])
      .then(([t, i]) => { setTrip(t.data); setItems(i.data); })
      .catch(() => navigate(`/trips/${tripId}`))
      .finally(() => setLoading(false));
  }, [tripId, navigate]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) { setNameError('Item name is required'); return; }
    setNameError('');
    try {
      const res = await API.post(`/trips/${tripId}/packing`, { name: newItem.name.trim(), category: newItem.category });
      setItems(p => [...p, res.data]);
      setNewItem({ name: '', category: newItem.category }); // keep category for quick multi-add
    } catch (err) { setError(err.response?.data?.detail || 'Failed to add item'); }
  };

  const handleToggle = async (item) => {
    try {
      const res = await API.put(`/trips/${tripId}/packing/${item.id}`, { is_packed: !item.is_packed });
      setItems(p => p.map(i => i.id === item.id ? res.data : i));
    } catch { setError('Failed to update item'); }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/trips/${tripId}/packing/${id}`);
      setItems(p => p.filter(i => i.id !== id));
    } catch { setError('Failed to delete item'); }
  };

  const handleReset = async () => {
    if (!window.confirm('Uncheck all items?')) return;
    try {
      await API.post(`/trips/${tripId}/packing/reset`);
      setItems(p => p.map(i => ({ ...i, is_packed: false })));
    } catch { setError('Failed to reset checklist'); }
  };

  const handleBulkDeletePacked = async () => {
    if (!window.confirm('Delete all packed items?')) return;
    const packedItems = items.filter(i => i.is_packed);
    try {
      await Promise.all(packedItems.map(i => API.delete(`/trips/${tripId}/packing/${i.id}`)));
      setItems(p => p.filter(i => !i.is_packed));
    } catch { setError('Failed to delete packed items'); }
  };

  const startEdit = (item) => { setEditingId(item.id); setEditName(item.name); };

  const handleEditSave = async (id) => {
    if (!editName.trim()) return;
    try {
      const res = await API.put(`/trips/${tripId}/packing/${id}`, { name: editName.trim() });
      setItems(p => p.map(i => i.id === id ? res.data : i));
      setEditingId(null);
    } catch { setError('Failed to update item'); }
  };

  const packed   = items.filter(i => i.is_packed).length;
  const total    = items.length;
  const pct      = total > 0 ? Math.round((packed / total) * 100) : 0;
  const allDone  = total > 0 && packed === total;

  const visibleItems = filterCat === 'all' ? items : items.filter(i => i.category === filterCat);
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = visibleItems.filter(i => i.category === cat);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {});

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
      <main className="page-container max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/trips/${tripId}`)}
              className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="page-title">Packing List</h1>
              <p className="text-sm text-gray-500 mt-0.5">{trip?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {packed > 0 && (
              <button onClick={handleBulkDeletePacked}
                className="btn-secondary text-sm py-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
                <Trash2 className="h-4 w-4" /> Delete packed
              </button>
            )}
            {total > 0 && (
              <button onClick={handleReset} className="btn-secondary text-sm py-2">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            )}
          </div>
        </div>

        {error && <div className="alert-error mb-4 flex items-center gap-2"><X className="h-4 w-4 shrink-0" />{error}</div>}

        {/* All done celebration */}
        {allDone && (
          <div className="card mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-800">All packed! You're ready to go 🎉</p>
            <p className="text-sm text-green-600 mt-1">{total} items packed for {trip?.name}</p>
          </div>
        )}

        {/* Add item form */}
        <div className="card mb-4">
          <form onSubmit={handleAdd} className="flex gap-3" noValidate>
            <div className="flex-1">
              <input type="text" placeholder="Add item (e.g. Passport, Charger...)"
                className={`input-field ${nameError ? 'border-red-400 focus:ring-red-400' : ''}`}
                value={newItem.name}
                onChange={e => { setNewItem(p => ({ ...p, name: e.target.value })); setNameError(''); }} />
              {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
            </div>
            <select className="input-field w-36 shrink-0" value={newItem.category}
              onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{CAT_META[c].icon} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary px-4 shrink-0">
              <Plus className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="card mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Packing Progress</span>
              <span className={`text-sm font-bold ${allDone ? 'text-green-600' : 'text-blue-600'}`}>
                {packed}/{total} · {pct}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className={`h-3 rounded-full transition-all duration-500 ${allDone ? 'bg-green-500' : 'bg-blue-600'}`}
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* Category filter tabs */}
        {total > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setFilterCat('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                ${filterCat === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
              All ({total})
            </button>
            {CATEGORIES.filter(c => items.some(i => i.category === c)).map(c => {
              const count = items.filter(i => i.category === c).length;
              return (
                <button key={c} onClick={() => setFilterCat(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                    ${filterCat === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {CAT_META[c].icon} {c.charAt(0).toUpperCase() + c.slice(1)} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Grouped items */}
        {Object.entries(grouped).map(([cat, catItems]) => {
          const catPacked = catItems.filter(i => i.is_packed).length;
          return (
            <div key={cat} className="card mb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`badge ${CAT_META[cat].color}`}>
                    {CAT_META[cat].icon} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </span>
                  <span className="text-xs text-gray-400">{catPacked}/{catItems.length}</span>
                </div>
                {catPacked === catItems.length && catItems.length > 0 && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Done
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {catItems.map(item => (
                  <div key={item.id} className={`flex items-center justify-between rounded-xl px-3 py-2 group transition-all
                    ${item.is_packed ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                    {editingId === item.id ? (
                      // Inline edit mode
                      <div className="flex items-center gap-2 flex-1">
                        <input type="text" className="input-field py-1 text-sm flex-1"
                          value={editName} onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleEditSave(item.id); if (e.key === 'Escape') setEditingId(null); }}
                          autoFocus />
                        <button onClick={() => handleEditSave(item.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                          <input type="checkbox" checked={item.is_packed} onChange={() => handleToggle(item)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 shrink-0" />
                          <span className={`text-sm transition-all truncate ${item.is_packed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {item.name}
                          </span>
                        </label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => startEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {total === 0 && (
          <div className="card text-center py-14">
            <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-700 mb-1">Your packing list is empty</p>
            <p className="text-sm text-gray-400">Add items above to start organizing your trip</p>
          </div>
        )}

        {/* No items in filter */}
        {total > 0 && Object.keys(grouped).length === 0 && (
          <div className="card text-center py-8">
            <p className="text-gray-500 text-sm">No items in this category.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Packing;
