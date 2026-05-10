import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, MapPin, Star, Plus, Bookmark, BookmarkCheck, X, Search } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const CATEGORY_COLORS = {
  sightseeing: 'bg-blue-100 text-blue-700',
  food:        'bg-orange-100 text-orange-700',
  adventure:   'bg-red-100 text-red-700',
  culture:     'bg-purple-100 text-purple-700',
  shopping:    'bg-pink-100 text-pink-700',
};

function AddToTripModal({ city, onClose }) {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/trips').then(r => setTrips(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <X className="h-5 w-5" />
        </button>
        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-900">Add {city.name} to a Trip</h3>
          <p className="text-sm text-gray-500 mt-1">Select which trip to add this city as a stop</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-4">No trips yet. Create one first.</p>
            <Link to="/trips/new" className="btn-primary text-sm">Create a Trip</Link>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {trips.map(trip => (
              <button key={trip.id}
                onClick={() => navigate(`/trips/${trip.id}/stops/new?city_id=${city.id}&city_name=${encodeURIComponent(city.name)}&city_country=${encodeURIComponent(city.country)}`)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left group">
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 text-sm">{trip.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' · '}{trip.stop_count} stop{trip.stop_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <Plus className="h-4 w-4 text-blue-500 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const CityDetail = () => {
  const { cityId } = useParams();
  const navigate = useNavigate();
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [savingId, setSavingId] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actSearch, setActSearch] = useState('');
  const [actCategory, setActCategory] = useState('');

  useEffect(() => {
    Promise.all([
      API.get(`/cities/${cityId}`),
      API.get('/users/me/saved-destinations'),
    ])
      .then(([cityRes, savedRes]) => {
        setCity(cityRes.data);
        setSaved(savedRes.data.some(c => c.id === parseInt(cityId)));
      })
      .catch(err => { if (err.response?.status === 404) navigate('/cities'); })
      .finally(() => setLoading(false));
  }, [cityId, navigate]);

  const toggleSave = async () => {
    setSavingId(true);
    try {
      if (saved) {
        await API.delete(`/users/me/saved-destinations/${cityId}`);
        setSaved(false);
      } else {
        await API.post(`/users/me/saved-destinations/${cityId}`);
        setSaved(true);
      }
    } catch {} finally { setSavingId(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50"><Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!city) return null;

  const categories = [...new Set(city.activities?.map(a => a.category) || [])];
  const filteredActivities = (city.activities || []).filter(a => {
    const matchSearch = !actSearch || a.name.toLowerCase().includes(actSearch.toLowerCase());
    const matchCat = !actCategory || a.category === actCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="page-container">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/cities')}
            className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="page-title">{city.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {city.country}{city.region ? ` · ${city.region}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleSave} disabled={savingId}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
                ${saved ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600'}`}>
              {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {saved ? 'Saved' : 'Save'}
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Add to Trip
            </button>
          </div>
        </div>

        {/* Hero image */}
        {city.image_url && (
          <img src={city.image_url} alt={city.name}
            className="w-full h-72 object-cover rounded-2xl mb-6 shadow-sm"
            onError={e => e.target.style.display = 'none'} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main */}
          <div className="lg:col-span-2 space-y-5">

            {/* About */}
            {city.description && (
              <div className="card">
                <h2 className="section-title mb-3">About {city.name}</h2>
                <p className="text-gray-600 leading-relaxed">{city.description}</p>
              </div>
            )}

            {/* Activities */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Activities</h2>
                <span className="text-xs text-gray-400">{filteredActivities.length} of {city.activities?.length || 0}</span>
              </div>

              {/* Activity filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-40">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Search activities..." className="input-field pl-9 text-sm py-2"
                    value={actSearch} onChange={e => setActSearch(e.target.value)} />
                </div>
                <select className="input-field w-auto text-sm py-2" value={actCategory} onChange={e => setActCategory(e.target.value)}>
                  <option value="">All categories</option>
                  {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
                {(actSearch || actCategory) && (
                  <button onClick={() => { setActSearch(''); setActCategory(''); }}
                    className="text-sm text-blue-600 hover:underline">Clear</button>
                )}
              </div>

              {filteredActivities.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No activities match your filters.</p>
              ) : (
                <div className="space-y-3">
                  {filteredActivities.map(act => (
                    <div key={act.id} className="flex items-start justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-100 hover:bg-blue-50/20 transition-all">
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick Info */}
            <div className="card">
              <h2 className="section-title mb-4">Quick Info</h2>
              <div className="space-y-3">
                {[
                  { label: 'Country', value: city.country },
                  { label: 'Region', value: city.region || '—' },
                  { label: 'Avg. daily cost', value: `$${city.avg_daily_cost}` },
                  { label: 'Popularity', value: `★ ${city.popularity_score} / 100` },
                  { label: 'Activities', value: `${city.activities?.length || 0} available` },
                  { label: 'Featured', value: city.is_featured ? '✅ Yes' : 'No' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category breakdown */}
            {categories.length > 0 && (
              <div className="card">
                <h2 className="section-title mb-4">Activity Categories</h2>
                <div className="space-y-2">
                  {categories.map(cat => {
                    const count = city.activities.filter(a => a.category === cat).length;
                    return (
                      <button key={cat} onClick={() => setActCategory(actCategory === cat ? '' : cat)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all
                          ${actCategory === cat ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                        <span className={`badge ${CATEGORY_COLORS[cat] || 'badge-gray'}`}>{cat}</span>
                        <span className="text-gray-500 font-medium">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            <button onClick={() => setShowAddModal(true)} className="btn-primary w-full">
              <Plus className="h-4 w-4" /> Add {city.name} to a Trip
            </button>
          </div>
        </div>
      </main>

      {showAddModal && <AddToTripModal city={city} onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

export default CityDetail;
