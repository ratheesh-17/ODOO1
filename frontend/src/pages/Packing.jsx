import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, RotateCcw, Package } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const CATEGORIES = ['clothing', 'documents', 'electronics', 'toiletries', 'medicines', 'other'];
const CAT_COLORS = { clothing: 'bg-pink-50 text-pink-700', documents: 'bg-blue-50 text-blue-700', electronics: 'bg-purple-50 text-purple-700', toiletries: 'bg-teal-50 text-teal-700', medicines: 'bg-red-50 text-red-700', other: 'bg-gray-50 text-gray-600' };

const Packing = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [trip, setTrip] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', category: 'other' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([API.get(`/trips/${tripId}`), API.get(`/trips/${tripId}/packing`)])
      .then(([t, i]) => { setTrip(t.data); setItems(i.data); })
      .catch(() => navigate(`/trips/${tripId}`))
      .finally(() => setLoading(false));
  }, [tripId, navigate]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    try {
      const res = await API.post(`/trips/${tripId}/packing`, newItem);
      setItems(p => [...p, res.data]);
      setNewItem({ name: '', category: 'other' });
    } catch (err) { setError(err.response?.data?.detail || 'Failed to add item'); }
  };

  const handleToggle = async (item) => {
    const res = await API.put(`/trips/${tripId}/packing/${item.id}`, { is_packed: !item.is_packed });
    setItems(p => p.map(i => i.id === item.id ? res.data : i));
  };

  const handleDelete = async (id) => {
    await API.delete(`/trips/${tripId}/packing/${id}`);
    setItems(p => p.filter(i => i.id !== id));
  };

  const handleReset = async () => {
    if (!window.confirm('Uncheck all items?')) return;
    await API.post(`/trips/${tripId}/packing/reset`);
    setItems(p => p.map(i => ({ ...i, is_packed: false })));
  };

  const packed = items.filter(i => i.is_packed).length;
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat);
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/trips/${tripId}`)}
              className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="page-title">Packing List</h1>
              <p className="text-sm text-gray-500 mt-0.5">{trip?.name} · {packed}/{items.length} packed</p>
            </div>
          </div>
          {items.length > 0 && (
            <button onClick={handleReset} className="btn-secondary"><RotateCcw className="h-4 w-4" /> Reset</button>
          )}
        </div>

        {error && <div className="alert-error mb-4">{error}</div>}

        {/* Add item */}
        <div className="card mb-4">
          <form onSubmit={handleAdd} className="flex gap-3">
            <input type="text" placeholder="Add item..." className="input-field flex-1"
              value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
            <select className="input-field w-36" value={newItem.category}
              onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <button type="submit" className="btn-primary px-3"><Plus className="h-5 w-5" /></button>
          </form>
        </div>

        {/* Progress */}
        {items.length > 0 && (
          <div className="card mb-4">
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Progress</span>
              <span className="text-blue-600">{packed}/{items.length} items packed</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${items.length ? (packed / items.length) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {/* Grouped items */}
        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="card mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className={`badge ${CAT_COLORS[cat]}`}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
              <span className="text-xs text-gray-400">{catItems.filter(i => i.is_packed).length}/{catItems.length}</span>
            </div>
            <div className="space-y-2">
              {catItems.map(item => (
                <div key={item.id} className="flex items-center justify-between group">
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input type="checkbox" checked={item.is_packed} onChange={() => handleToggle(item)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                    <span className={`text-sm transition-all ${item.is_packed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.name}
                    </span>
                  </label>
                  <button onClick={() => handleDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="card text-center py-12">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No items yet. Add something above!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Packing;
