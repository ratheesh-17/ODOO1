import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, Bookmark, BookmarkCheck } from 'lucide-react';
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

  // load saved destinations + all countries once
  useEffect(() => {
    API.get('/users/me/saved-destinations')
      .then((res) => setSavedIds(new Set(res.data.map((c) => c.id))))
      .catch(() => {});

    API.get('/cities')
      .then((res) => {
        const unique = [...new Set(res.data.map((c) => c.country))].sort();
        setAllCountries(unique);
      })
      .catch(() => {});
  }, []);

  // fetch cities whenever search or country filter changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (country) params.set('country', country);
    const query = params.toString() ? `?${params.toString()}` : '';
    API.get(`/cities${query}`)
      .then((res) => setCities(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, country]);

  const toggleSave = async (e, cityId) => {
    e.preventDefault();
    setSavingId(cityId);
    try {
      if (savedIds.has(cityId)) {
        await API.delete(`/users/me/saved-destinations/${cityId}`);
        setSavedIds((prev) => { const s = new Set(prev); s.delete(cityId); return s; });
      } else {
        await API.post(`/users/me/saved-destinations/${cityId}`);
        setSavedIds((prev) => new Set(prev).add(cityId));
      }
    } catch {
      // silently ignore
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Explore Cities</h1>

        {/* Search + Filter bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cities by name..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field w-auto"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">All countries</option>
            {allCountries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {(search || country) && (
            <button
              onClick={() => { setSearch(''); setCountry(''); }}
              className="text-sm text-blue-600 hover:underline px-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => (
              <div key={city.id} className="card group relative">
                <button
                  onClick={(e) => toggleSave(e, city.id)}
                  disabled={savingId === city.id}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white shadow hover:shadow-md transition-shadow z-10"
                  title={savedIds.has(city.id) ? 'Remove from saved' : 'Save destination'}
                >
                  {savedIds.has(city.id)
                    ? <BookmarkCheck className="h-4 w-4 text-blue-600" />
                    : <Bookmark className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                  }
                </button>

                <Link to={`/cities/${city.id}`} className="block">
                  {city.image_url && (
                    <img src={city.image_url} alt={city.name} className="w-full h-40 object-cover rounded-lg mb-4" />
                  )}
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{city.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{city.country}{city.region ? `, ${city.region}` : ''}</p>
                  {city.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{city.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">~${city.avg_daily_cost}/day</span>
                    <span className="text-yellow-600">★ {city.popularity_score}</span>
                  </div>
                </Link>
              </div>
            ))}
            {cities.length === 0 && (
              <p className="col-span-3 text-center text-gray-500 py-16">No cities found.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Cities;
