import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, Plus, Trash2 } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const AddActivity = () => {
  const { tripId, stopId } = useParams();
  const navigate = useNavigate();
  const [stop, setStop] = useState(null);
  const [activities, setActivities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMaxCost, setFilterMaxCost] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const stopsRes = await API.get(`/trips/${tripId}/stops`);
        const found = stopsRes.data.find((s) => s.id === parseInt(stopId));
        if (!found) { navigate(`/trips/${tripId}`); return; }
        setStop(found);
        const actRes = await API.get(`/cities/${found.city_id}/activities`);
        setActivities(actRes.data);
        setFiltered(actRes.data);
      } catch {
        navigate(`/trips/${tripId}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId, stopId, navigate]);

  const handleAdd = async (activityId) => {
    setAdding(activityId);
    setError('');
    try {
      await API.post(`/trips/${tripId}/stops/${stopId}/activities`, { activity_id: activityId });
      // refresh stop to show updated activities
      const stopsRes = await API.get(`/trips/${tripId}/stops`);
      const found = stopsRes.data.find((s) => s.id === parseInt(stopId));
      setStop(found);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add activity');
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (saId) => {
    try {
      await API.delete(`/trips/${tripId}/stops/${stopId}/activities/${saId}`);
      const stopsRes = await API.get(`/trips/${tripId}/stops`);
      const found = stopsRes.data.find((s) => s.id === parseInt(stopId));
      setStop(found);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove activity');
    }
  };

  // apply filters whenever activities or filter values change
  useEffect(() => {
    let result = activities;
    if (filterCategory) result = result.filter((a) => a.category === filterCategory);
    if (filterMaxCost) result = result.filter((a) => a.estimated_cost <= parseFloat(filterMaxCost));
    setFiltered(result);
  }, [activities, filterCategory, filterMaxCost]);

  const categories = [...new Set(activities.map((a) => a.category))];
  const addedIds = new Set(stop?.stop_activities?.map((sa) => sa.activity_id) || []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(`/trips/${tripId}`)} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
            <p className="text-sm text-gray-600">{stop?.city_name}, {stop?.city_country}</p>
          </div>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {/* Added activities */}
        {stop?.stop_activities?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Added to this stop</h2>
            <div className="space-y-2">
              {stop.stop_activities.map((sa) => (
                <div key={sa.id} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-4 py-2">
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{sa.activity_name}</span>
                    <span className="text-xs text-gray-500 ml-2">({sa.activity_category})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-green-600">${sa.activity_cost}</span>
                    <button onClick={() => handleRemove(sa.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available activities */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Available in {stop?.city_name}</h2>
            <span className="text-xs text-gray-500">{filtered.length} of {activities.length}</span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              className="input-field w-auto text-sm py-1.5"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Max $</span>
              <input
                type="number" min="0" placeholder="Any cost"
                className="input-field pl-12 w-32 text-sm py-1.5"
                value={filterMaxCost}
                onChange={(e) => setFilterMaxCost(e.target.value)}
              />
            </div>
            {(filterCategory || filterMaxCost) && (
              <button
                onClick={() => { setFilterCategory(''); setFilterMaxCost(''); }}
                className="text-sm text-blue-600 hover:underline"
              >Clear</button>
            )}
          </div>

          {activities.length === 0 ? (
            <p className="text-gray-500 text-sm">No activities available for this city.</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500 text-sm">No activities match your filters.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((act) => {
                const isAdded = addedIds.has(act.id);
                return (
                  <div key={act.id} className={`border rounded-lg p-4 ${isAdded ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{act.name}</h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{act.category}</span>
                        {act.description && <p className="text-sm text-gray-600 mt-1">{act.description}</p>}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center"><DollarSign className="h-3 w-3 mr-1" />${act.estimated_cost}</span>
                          <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />{act.duration_hours}h</span>
                        </div>
                      </div>
                      <button
                        onClick={() => !isAdded && handleAdd(act.id)}
                        disabled={isAdded || adding === act.id}
                        className={`ml-4 p-2 rounded-lg transition-colors ${isAdded ? 'text-green-600 bg-green-100 cursor-default' : 'text-blue-600 hover:bg-blue-50'}`}
                      >
                        {isAdded ? '✓' : adding === act.id ? '...' : <Plus className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={() => navigate(`/trips/${tripId}`)} className="btn-secondary w-full">
          Done
        </button>
      </main>
    </div>
  );
};

export default AddActivity;
