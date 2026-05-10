import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, RotateCcw } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const CATEGORIES = ['clothing', 'toiletries', 'electronics', 'documents', 'medicines', 'other'];

const Packing = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [trip, setTrip] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', category: 'other' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [tripRes, itemsRes] = await Promise.all([
          API.get(`/trips/${tripId}`),
          API.get(`/trips/${tripId}/packing`),
        ]);
        setTrip(tripRes.data);
        setItems(itemsRes.data);
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
    if (!newItem.name.trim()) return;
    try {
      const res = await API.post(`/trips/${tripId}/packing`, newItem);
      setItems([...items, res.data]);
      setNewItem({ name: '', category: 'other' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add item');
    }
  };

  const handleToggle = async (item) => {
    try {
      const res = await API.put(`/trips/${tripId}/packing/${item.id}`, { is_packed: !item.is_packed });
      setItems(items.map((i) => (i.id === item.id ? res.data : i)));
    } catch {
      setError('Failed to update item');
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await API.delete(`/trips/${tripId}/packing/${itemId}`);
      setItems(items.filter((i) => i.id !== itemId));
    } catch {
      setError('Failed to delete item');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Uncheck all items?')) return;
    try {
      await API.post(`/trips/${tripId}/packing/reset`);
      setItems(items.map((i) => ({ ...i, is_packed: false })));
    } catch {
      setError('Failed to reset checklist');
    }
  };

  const packed = items.filter((i) => i.is_packed).length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(`/trips/${tripId}`)} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Packing List</h1>
              <p className="text-sm text-gray-600">{trip?.name} · {packed}/{items.length} packed</p>
            </div>
          </div>
          {items.length > 0 && (
            <button onClick={handleReset} className="btn-secondary flex items-center space-x-2">
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          )}
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {/* Add item */}
        <div className="card">
          <form onSubmit={handleAdd} className="flex space-x-3">
            <input
              type="text"
              placeholder="Add item..."
              className="input-field flex-1"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
            <select className="input-field w-36" value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" className="btn-primary px-3">
              <Plus className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Progress bar */}
        {items.length > 0 && (
          <div className="card">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{packed}/{items.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${items.length ? (packed / items.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Grouped items */}
        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="card">
            <h2 className="font-semibold text-gray-900 capitalize mb-3">{cat}</h2>
            <div className="space-y-2">
              {catItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={item.is_packed}
                      onChange={() => handleToggle(item)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className={`text-sm ${item.is_packed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {item.name}
                    </span>
                  </label>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="card text-center py-12 text-gray-500">
            <p>No items yet. Add something above!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Packing;
