import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Search, Bookmark, BookmarkCheck, Globe, Plus, X } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

// Modal to pick which trip to add the city as a stop
function AddToTripModal({ city, onClose }) {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/trips').then(r => setTrips(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAdd = (tripId) => {
    // Navigate to AddStop with city pre-selected via query param
    navigate(`/trips/${tripId}/stops/new?city_id=${city.id}&city_name=${encodeURIComponent(city.name)}&city_country=${encodeURIComponent(city.country)}`);
  };

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
        {error && <div className="alert-error mb-4">{error}</div>}
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
              <button key={trip.id} onClick={() => handleAdd(trip.id)}
                disabled={adding === trip.id}
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

const Cities = () => {
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [allCountries, setAllCountries] = useState([]);
  const [allRegions, setAllRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);
  const [addToTripCity, setAddToTripCity] = useState(null);

  useEffect(() => {
    API.get('/users/me/saved-destinations').then(r => setSavedIds(new Set(r.data.map(c => c.id)))).catch(() => {});
    API.get('/cities').then(r => {
      setAllCountries([...new Set(r.data.map(c => c.country))].sort());
      setAllRegions([...new Set(r.data.map(c => c.region).filter(Boolean))].sort());
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (country) params.set('country', country);
    if (region) params.set('region', region);
    API.get(`/cities${params.toString() ? '?' + params : ''}`)
      .then(r => setCities(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [search, country, region]);

  const toggleSave = async (e, cityId) => {
    e.preventDefault(); e.stopPropagation();
    setSavingId(cityId);
    try {
      if (savedIds.has(cityId)) {
        await API.delete(`/users/me/saved-destinations/${cityId}`);
        setSavedIds(p => { const s = new Set(p); s.delete(cityId); return s; });
      } else {
        await API.post(`/users/me/saved-destinations/${cityId}`);
        setSavedIds(p => new Set(p).add(cityId));
      }
    } catch {} finally { setSavingId(null); }
  };

  const hasFilters = search || country || region;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="page-container">
        <div className="mb-8">
          <h1 className="page-title">Explore Cities</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cities.length} destination{cities.length !== 1 ? 's' : ''} · Discover and add to your trips
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search cities by name..." className="input-field pl-9"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field w-auto" value={country} onChange={e => setCountry(e.target.value)}>
            <option value="">All countries</option>
            {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input-field w-auto" value={region} onChange={e => setRegion(e.target.value)}>
            <option value="">All regions</option>
            {allRegions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setCountry(''); setRegion(''); }}
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline px-2">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cities.length === 0 ? (
          <div className="card text-center py-16">
            <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No cities found</p>
            {hasFilters && <button onClick={() => { setSearch(''); setCountry(''); setRegion(''); }}
              className="text-sm text-blue-600 hover:underline mt-2">Clear filters</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map(city => (
              <div key={city.id} className="card-hover group relative overflow-hidden p-0 flex flex-col">
                {/* Save button */}
                <button onClick={e => toggleSave(e, city.id)} disabled={savingId === city.id}
                  className="absolute top-3 right-3 z-10 p-1.5 bg-white rounded-full shadow hover:shadow-md transition-shadow"
                  title={savedIds.has(city.id) ? 'Remove from saved' : 'Save destination'}>
                  {savedIds.has(city.id)
                    ? <BookmarkCheck className="h-4 w-4 text-blue-600" />
                    : <Bookmark className="h-4 w-4 text-gray-400" />}
                </button>

                {/* Image */}
                <Link to={`/cities/${city.id}`} className="block">
                  {city.image_url ? (
                    <img src={city.image_url} alt={city.name} className="w-full h-44 object-cover"
                      onError={e => e.target.style.display = 'none'} />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                      <MapPin className="h-10 w-10 text-white opacity-60" />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <Link to={`/cities/${city.id}`} className="block mb-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{city.name}</h3>
                      {city.is_featured && <span className="badge-blue shrink-0">Featured</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {city.country}{city.region ? ` · ${city.region}` : ''}
                    </p>
                    {city.description && <p className="text-sm text-gray-500 line-clamp-2 mb-2">{city.description}</p>}
                    {/* Meta info */}
                    <div className="flex items-center justify-between text-sm mt-auto">
                      <span className="font-semibold text-gray-800">
                        ${city.avg_daily_cost}<span className="text-xs text-gray-400 font-normal">/day</span>
                      </span>
                      <span className="text-yellow-500 font-semibold">★ {city.popularity_score}</span>
                    </div>
                  </Link>

                  {/* Add to Trip button */}
                  <button onClick={() => setAddToTripCity(city)}
                    className="btn-primary w-full text-sm py-2 mt-auto">
                    <Plus className="h-4 w-4" /> Add to Trip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add to Trip Modal */}
      {addToTripCity && <AddToTripModal city={addToTripCity} onClose={() => setAddToTripCity(null)} />}
    </div>
  );
};

export default Cities;
