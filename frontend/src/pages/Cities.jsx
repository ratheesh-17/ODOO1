import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, Bookmark, BookmarkCheck, Globe } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const Cities = () => {
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [allCountries, setAllCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    API.get('/users/me/saved-destinations').then(r => setSavedIds(new Set(r.data.map(c => c.id)))).catch(() => {});
    API.get('/cities').then(r => setAllCountries([...new Set(r.data.map(c => c.country))].sort())).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (country) params.set('country', country);
    API.get(`/cities${params.toString() ? '?' + params : ''}`)
      .then(r => setCities(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [search, country]);

  const toggleSave = async (e, cityId) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="page-container">
        <div className="mb-8">
          <h1 className="page-title">Explore Cities</h1>
          <p className="text-sm text-gray-500 mt-0.5">Discover destinations and add them to your trips</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search cities..." className="input-field pl-9"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field w-auto" value={country} onChange={e => setCountry(e.target.value)}>
            <option value="">All countries</option>
            {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {(search || country) && (
            <button onClick={() => { setSearch(''); setCountry(''); }} className="text-sm text-blue-600 hover:underline px-2">
              Clear
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
            <p className="text-gray-500">No cities found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map(city => (
              <div key={city.id} className="card-hover group relative overflow-hidden p-0">
                <button onClick={e => toggleSave(e, city.id)} disabled={savingId === city.id}
                  className="absolute top-3 right-3 z-10 p-1.5 bg-white rounded-full shadow hover:shadow-md transition-shadow"
                  title={savedIds.has(city.id) ? 'Remove from saved' : 'Save'}>
                  {savedIds.has(city.id)
                    ? <BookmarkCheck className="h-4 w-4 text-blue-600" />
                    : <Bookmark className="h-4 w-4 text-gray-400" />}
                </button>
                <Link to={`/cities/${city.id}`} className="block">
                  {city.image_url ? (
                    <img src={city.image_url} alt={city.name} className="w-full h-44 object-cover"
                      onError={e => e.target.style.display = 'none'} />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                      <MapPin className="h-10 w-10 text-white opacity-60" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{city.name}</h3>
                      {city.is_featured && <span className="badge-blue shrink-0">Featured</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{city.country}{city.region ? ` · ${city.region}` : ''}</p>
                    {city.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{city.description}</p>}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">${city.avg_daily_cost}<span className="text-xs text-gray-400 font-normal">/day</span></span>
                      <span className="text-yellow-500 font-medium">★ {city.popularity_score}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Cities;
