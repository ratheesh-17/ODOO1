import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, Plus, Trash2, Search, CheckCircle, SlidersHorizontal, Image } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const CATEGORY_COLORS = {
  sightseeing: 'bg-blue-100 text-blue-700',
  food:        'bg-orange-100 text-orange-700',
  adventure:   'bg-red-100 text-red-700',
  culture:     'bg-purple-100 text-purple-700',
  shopping:    'bg-pink-100 text-pink-700',
};

const SORT_OPTIONS = [
  { value: '',             label: 'Default' },
  { value: 'cost_asc',    label: 'Cost: Low → High' },
  { value: 'cost_desc',   label: 'Cost: High → Low' },
  { value: 'duration_asc',label: 'Duration: Short first' },
  { value: 'name_asc',    label: 'Name: A → Z' },
];

const AddActivity = () => {
  const { tripId, stopId } = useParams();
  const navigate = useNavigate();
  const [stop, setStop]           = useState(null);
  const [activities, setActivities] = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState(null);
  const [removing, setRemoving]   = useState(null);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMaxCost, setFilterMaxCost]   = useState('');
  const [filterMaxDuration, setFilterMaxDuration] = useState('');
  const [sortBy, setSortBy]       = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const loadStop = async () => {
    const res = await API.get(`/trips/${tripId}/stops`);
    const found = res.data.find(s => s.id === parseInt(stopId));
    if (!found) { navigate(`/trips/${tripId}`); return null; }
    setStop(found);
    return found;
  };

  const loadActivities = async (cityId) => {
    const res = await API.get(`/cities/${cityId}/activities`);
    setActivities(res.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const found = await loadStop();
        if (!found) return;
        await loadActivities(found.city_id);
      } catch { navigate(`/trips/${tripId}`); }
      finally { setLoading(false); }
    };
    init();
  }, [tripId, stopId]); // eslint-disable-line

  // Client-side filter + sort
  useEffect(() => {
    let result = [...activities];
    if (search) result = result.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase()));
    if (filterCategory) result = result.filter(a => a.category === filterCategory);
    if (filterMaxCost) result = result.filter(a => a.estimated_cost <= parseFloat(filterMaxCost));
    if (filterMaxDuration) result = result.filter(a => a.duration_hours <= parseFloat(filterMaxDuration));
    if (sortBy === 'cost_asc')     result.sort((a, b) => a.estimated_cost - b.estimated_cost);
    if (sortBy === 'cost_desc')    result.sort((a, b) => b.estimated_cost - a.estimated_cost);
    if (sortBy === 'duration_asc') result.sort((a, b) => a.duration_hours - b.duration_hours);
    if (sortBy === 'name_asc')     result.sort((a, b) => a.name.localeCompare(b.name));
    setFiltered(result);
  }, [activities, search, filterCategory, filterMaxCost, filterMaxDuration, sortBy]);

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

  const clearFilters = () => { setSearch(''); setFilterCategory(''); setFilterMaxCost(''); setFilterMaxDuration(''); setSortBy(''); };
  const hasFilters = search || filterCategory || filterMaxCost || filterMaxDuration || sortBy;
  const categories = [...new Set(activities.map(a => a.category))];
  const addedIds = new Set(stop?.stop_activities?.map(sa => sa.activity_id) || []);
  const totalCost = stop?.stop_activities?.reduce((s, a) => s + (a.activity_cost || 0), 0) || 0;
  const totalDuration = stop?.stop_activities?.reduce((s, a) => s + (a.duration_hours || 0), 0) || 0;

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
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/trips/${tripId}`)}
            className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="page-title">Activity Search</h1>
            <p className="text-sm text-gray-500 mt-0.5">{stop?.city_name}, {stop?.city_country}</p>
          </div>
        </div>

        {error && <div className="alert-error mb-4">{error}</div>}

        {/* Added activities summary */}
        {stop?.stop_activities?.length > 0 && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Added to this stop
                <span className="badge-green">{stop.stop_activities.length}</span>
              </h2>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />{totalDuration.toFixed(1)}h total
                </span>
                <span className="font-semibold text-green-600">${totalCost.toFixed(0)} total</span>
              </div>
            </div>
            <div className="space-y-2">
              {stop.stop_activities.map(sa => (
                <div key={sa.id} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`badge shrink-0 ${CATEGORY_COLORS[sa.activity_category] || 'badge-gray'}`}>
                      {sa.activity_category}
                    </span>
                    <span className="font-medium text-gray-900 text-sm truncate">{sa.activity_name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
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
            <span className="text-xs text-gray-400 font-medium">{filtered.length} of {activities.length} activities</span>
          </div>

          {/* Filters row */}
          <div className="space-y-3 mb-5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search activities by name or description..."
                className="input-field pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Filter chips row */}
            <div className="flex flex-wrap gap-2">
              {/* Category filter */}
              <select className="input-field w-auto text-sm py-2" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All types</option>
                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>

              {/* Max cost */}
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input type="number" min="0" placeholder="Max cost"
                  className="input-field pl-7 w-28 text-sm py-2"
                  value={filterMaxCost} onChange={e => setFilterMaxCost(e.target.value)} />
              </div>

              {/* Max duration */}
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input type="number" min="0" step="0.5" placeholder="Max hrs"
                  className="input-field pl-7 w-28 text-sm py-2"
                  value={filterMaxDuration} onChange={e => setFilterMaxDuration(e.target.value)} />
              </div>

              {/* Sort */}
              <div className="relative">
                <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <select className="input-field pl-7 w-auto text-sm py-2" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline px-2 font-medium">
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Activity list */}
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No activities available for this city.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm mb-2">No activities match your filters.</p>
              <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">Clear filters</button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(act => {
                const isAdded = addedIds.has(act.id);
                const isExpanded = expandedId === act.id;
                return (
                  <div key={act.id}
                    className={`border rounded-xl overflow-hidden transition-all ${isAdded ? 'border-green-200 bg-green-50/40' : 'border-gray-100 hover:border-blue-200'}`}>

                    {/* Activity image */}
                    {isExpanded && act.image_url && (
                      <img src={act.image_url} alt={act.name}
                        className="w-full h-40 object-cover"
                        onError={e => e.target.style.display = 'none'} />
                    )}

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Name + category */}
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm">{act.name}</h3>
                            <span className={`badge ${CATEGORY_COLORS[act.category] || 'badge-gray'}`}>{act.category}</span>
                            {isAdded && <span className="badge-green">Added ✓</span>}
                          </div>

                          {/* Description — shown when expanded or truncated */}
                          {act.description && (
                            <p className={`text-xs text-gray-500 mb-2 ${isExpanded ? '' : 'line-clamp-1'}`}>
                              {act.description}
                            </p>
                          )}

                          {/* Cost + Duration */}
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1 font-medium">
                              <DollarSign className="h-3 w-3 text-green-500" />
                              ${act.estimated_cost}
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="h-3 w-3 text-blue-500" />
                              {act.duration_hours}h
                            </span>
                            {/* Quick view toggle */}
                            <button onClick={() => setExpandedId(isExpanded ? null : act.id)}
                              className="flex items-center gap-1 text-blue-500 hover:text-blue-700 hover:underline">
                              <Image className="h-3 w-3" />
                              {isExpanded ? 'Less' : 'Quick view'}
                            </button>
                          </div>
                        </div>

                        {/* Add/Added button */}
                        <button
                          onClick={() => !isAdded && handleAdd(act.id)}
                          disabled={isAdded || adding === act.id}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                            isAdded ? 'bg-green-100 text-green-600 cursor-default' :
                            adding === act.id ? 'bg-gray-100 text-gray-400 cursor-wait' :
                            'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}>
                          {isAdded ? (
                            <><CheckCircle className="h-4 w-4" /> Added</>
                          ) : adding === act.id ? (
                            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin block" />
                          ) : (
                            <><Plus className="h-4 w-4" /> Add</>
                          )}
                        </button>
                      </div>
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
