import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar, MapPin, Plane, Search } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const STATUS_BADGE = { completed: 'badge-green', ongoing: 'badge-blue', planned: 'badge-yellow', draft: 'badge-gray' };

const TripsList = () => {
  const [trips, setTrips] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/trips').then(r => { setTrips(r.data); setFiltered(r.data); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setFiltered(trips.filter(t => t.name.toLowerCase().includes(search.toLowerCase())));
  }, [search, trips]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trip and all its data?')) return;
    await API.delete(`/trips/${id}`);
    setTrips(p => p.filter(t => t.id !== id));
  };

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
      <main className="page-container">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="page-title">My Trips</h1>
            <p className="text-sm text-gray-500 mt-0.5">{trips.length} trip{trips.length !== 1 ? 's' : ''} total</p>
          </div>
          <Link to="/trips/new" className="btn-primary self-start"><Plus className="h-4 w-4" /> New Trip</Link>
        </div>

        {trips.length > 0 && (
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input className="input-field pl-9" placeholder="Search trips..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plane className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{search ? 'No trips match your search' : 'No trips yet'}</h3>
            <p className="text-sm text-gray-500 mb-5">Start planning your first adventure.</p>
            {!search && <Link to="/trips/new" className="btn-primary"><Plus className="h-4 w-4" /> Plan Your First Trip</Link>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((trip) => (
              <div key={trip.id} className="card-hover flex flex-col gap-3 group">
                {trip.cover_photo && (
                  <img src={trip.cover_photo} alt={trip.name} className="w-full h-36 object-cover rounded-xl"
                    onError={e => e.target.style.display = 'none'} />
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{trip.name}</h3>
                  <span className={STATUS_BADGE[trip.status] || 'badge-gray'}>{trip.status}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 flex-1">{trip.description || 'No description'}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />
                    {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{trip.stop_count} stop{trip.stop_count !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-2 pt-1 border-t border-gray-50">
                  <Link to={`/trips/${trip.id}`} className="btn-primary flex-1 text-sm py-2">View</Link>
                  <Link to={`/trips/${trip.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button onClick={() => handleDelete(trip.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TripsList;
