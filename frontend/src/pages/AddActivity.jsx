import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, Plus, Trash2, Search, CheckCircle } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const CATEGORY_COLORS = {
  sightseeing: 'bg-blue-100 text-blue-700',
  food:        'bg-orange-100 text-orange-700',
  adventure:   'bg-red-100 text-red-700',
  culture:     'bg-purple-100 text-purple-700',
  shopping:    'bg-pink-100 text-pink-700',
};

const AddActivity = () => {
  const { tripId, stopId } = useParams();
  const navigate = useNavigate();
  const [stop, setStop] = useState(null);
  const [activities, setActivities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMaxCost, setFilterMaxCost] = useState('');
  const [search, setSearch] = useState('');

  const loadStop = async () => {
    const stopsRes = await API.get(`/trips/${tripId}/stops`);
    const found = stopsRes.data.find(s => s.id === parseInt(stopId));
    if (!found) { navigate(`/trips/${tripId}`); return null; }
    setStop(found);
    return found;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const found = await loadStop();
        if (!found) return;
        const actRes = await API.get(`/cities/${found.city_id}/activities`);
        setActivities(actRes.data);
        setFiltered(actRes.data);
      } catch { navigate(`/trips/${tripId}`); }
      finally { setLoading(false); }
    };
    load();
  }, [tripId, stopId]); // eslint-disable-line

  useEffect(() => {
    let result = activities;
    if (search) result = result.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
    if (filterCategory) result = result.filter(a => a.category === filterCategory);
    if (filterMaxCost) result = result.filter(a => a.estimated_cost <= parseFloat(filterMaxCost));
    setFiltered(result);
  }, [activities, search, filterCategory, filterMaxCost]);

  const handleAdd = async (activityId) => {
    setAdding(activityId); setError('');
    try {
      await API.post(`/trips/${tripId}/stops/${stopId}/activities`, { activity_id: activityId });
      await loadStop();
    } catch (err) { setError(err.response?.data?.detail || 'Failed to add activity'); }
    finally { setAdding(null); }
  };

  const handleRemove = async (saId) => {
    setRemoving(saId);
    try {
      await API.delete(`/trips/${tripId}/stops/${stopId}/activities/${saId}`);
      await loadStop();
    } catch (err) { setError(err.response?.data?.detail || 'Failed to remove activity'); }
    finally { setRemoving(null); }
  };

  const categories = [...new Set(activities.map(a => a.category))];
  const addedIds = new Set(stop?.stop_activities?.map(sa => sa.activity_id) || []);
  const totalCost = stop?.stop_activities?.reduce((s, a) => s + (a.activity_cost || 0), 0) || 0;

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

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(`/trips/${tripId}`)}
            className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="page-title">Manage Activities</h1>
            <p className="text-sm text-gray-500 mt-0.5">{stop?.city_name}, {stop?.city_country}</p>
          </div>
        </div>

        {error && <div className="alert-error mb-4">{error}</div>}

        {/* Added activities */}
        {stop?.stop_activities?.length > 0 && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Added to this stop
              </h2>
              <span className="text-sm font-semibold text-green-600">Total: ${totalCost.toFixed(0)}</span>
            </div>
            <div className="space-y-2">
              {stop.stop_activities.map(sa => (
                <div key={sa.id} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className={`badge ${CATEGORY_COLORS[sa.activity_category] || 'badge-gray'}`}>{sa.activity_category}</span>
                    <span className="font-medium text-gray-900 text-sm">{sa.activity_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-green-600">${sa.activity_cost}</span>
                    <button onClick={() => handleRemove(sa.id)} disabled={removing === sa.id}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40">
                      {removing === sa.id
                        ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                        : <Trash2 className="h-4 w-4" />}
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
            <h2 className="section-title">Available in {stop?.city_name}</h2>
            <span className="text-xs text-gray-400">{filtered.length} of {activities.length}</span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search activities..." className="input-field pl-9 text-sm py-2"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input-field w-auto text-sm py-2" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">Max $</span>
              <input type="number" min="0" placeholder="Any" className="input-field pl-12 w-28 text-sm py-2"
                value={filterMaxCost} onChange={e => setFilterMaxCost(e.target.value)} />
            </div>
            {(search || filterCategory || filterMaxCost) && (
              <button onClick={() => { setSearch(''); setFilterCategory(''); setFilterMaxCost(''); }}
                className="text-sm text-blue-600 hover:underline px-1">Clear</button>
            )}
          </div>

          {activities.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No activities available for this city.</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No activities match your filters.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(act => {
                const isAdded = addedIds.has(act.id);
                return (
                  <div key={act.id}
                    className={`border rounded-xl p-4 transition-all ${isAdded ? 'border-green-200 bg-green-50/50' : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/20'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{act.name}</h3>
                          <span className={`badge ${CATEGORY_COLORS[act.category] || 'badge-gray'}`}>{act.category}</span>
                        </div>
                        {act.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{act.description}</p>}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${act.estimated_cost}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{act.duration_hours}h</span>
                        </div>
                      </div>
                      <button
                        onClick={() => !isAdded && handleAdd(act.id)}
                        disabled={isAdded || adding === act.id}
                        className={`shrink-0 p-2 rounded-xl transition-all ${
                          isAdded ? 'bg-green-100 text-green-600 cursor-default' :
                          adding === act.id ? 'bg-gray-100 cursor-wait' :
                          'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                        {isAdded ? <CheckCircle className="h-5 w-5" /> :
                         adding === act.id ? <span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin block" /> :
                         <Plus className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={() => navigate(`/trips/${tripId}`)} className="btn-secondary w-full mt-4">
          Done — Back to Trip
        </button>
      </main>
    </div>
  );
};

export default AddActivity;
