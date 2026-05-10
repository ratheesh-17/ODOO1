import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, DollarSign, Globe, CheckCircle, Plane, MapPin, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const STATUS_BADGE = {
  completed: 'badge-green',
  ongoing:   'badge-blue',
  planned:   'badge-yellow',
  draft:     'badge-gray',
};

const Dashboard = () => {
  const [trips, setTrips]   = useState([]);
  const [cities, setCities] = useState([]);
  const [stats, setStats]   = useState({ totalTrips: 0, completedTrips: 0, upcomingTrips: 0, totalSpent: 0, overBudgetTrips: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tripsRes, citiesRes] = await Promise.all([
          API.get('/trips'),
          API.get('/cities?featured=true'),
        ]);
        const t = tripsRes.data;
        setCities(citiesRes.data.slice(0, 6));
        setTrips(t);

        const recentTrips = t.slice(0, 3);
        const budgetResults = await Promise.allSettled(recentTrips.map(r => API.get(`/trips/${r.id}/budget`)));
        const budgetMap = {};
        budgetResults.forEach((r, i) => { if (r.status === 'fulfilled') budgetMap[recentTrips[i].id] = r.value.data; });

        setStats({
          totalTrips: t.length,
          completedTrips: t.filter(x => x.status === 'completed').length,
          upcomingTrips: t.filter(x => new Date(x.start_date) > new Date()).length,
          totalSpent: Object.values(budgetMap).reduce((s, b) => s + (b?.total_cost || 0), 0),
          overBudgetTrips: t.filter(x => { const b = budgetMap[x.id]; return b && x.total_budget > 0 && b.total_cost > x.total_budget; }).length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="page-container">

        {/* Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hello, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1">Here's an overview of your travel plans.</p>
          </div>
          <Link to="/trips/new" className="btn-primary self-start sm:self-auto">
            <Plus className="h-4 w-4" /> Plan New Trip
          </Link>
        </div>

        {/* Over-budget alert */}
        {stats.overBudgetTrips > 0 && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {stats.overBudgetTrips} trip{stats.overBudgetTrips > 1 ? 's are' : ' is'} over budget.
            </p>
            <Link to="/trips" className="ml-auto text-sm text-red-600 font-semibold hover:underline">View</Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Trips',  value: stats.totalTrips,     icon: Globe,        color: 'text-blue-600',   bg: 'bg-blue-50' },
            { label: 'Completed',    value: stats.completedTrips,  icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50' },
            { label: 'Upcoming',     value: stats.upcomingTrips,   icon: Calendar,     color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Total Spent',  value: `$${stats.totalSpent.toFixed(0)}`, icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`${bg} p-3 rounded-xl shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Trips */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Trips</h2>
            <Link to="/trips" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {trips.length === 0 ? (
            <div className="card text-center py-16">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plane className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No trips yet</h3>
              <p className="text-sm text-gray-500 mb-5">Start planning your first adventure.</p>
              <Link to="/trips/new" className="btn-primary">
                <Plus className="h-4 w-4" /> Plan Your First Trip
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trips.slice(0, 3).map((trip) => (
                <Link key={trip.id} to={`/trips/${trip.id}`}
                  className="card-hover group flex flex-col gap-3"
                >
                  {trip.cover_photo && (
                    <img src={trip.cover_photo} alt={trip.name}
                      className="w-full h-36 object-cover rounded-xl"
                      onError={(e) => e.target.style.display = 'none'} />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {trip.name}
                    </h3>
                    <span className={STATUS_BADGE[trip.status] || 'badge-gray'}>{trip.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{trip.description || 'No description'}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                      {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {trip.stop_count} stop{trip.stop_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Popular Destinations */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Popular Destinations</h2>
            <Link to="/cities" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              Explore all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map((city) => (
              <Link key={city.id} to={`/cities/${city.id}`}
                className="card-hover group flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {city.name}
                  </h3>
                  <p className="text-xs text-gray-500">{city.country}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">${city.avg_daily_cost}<span className="text-xs text-gray-400 font-normal">/day</span></p>
                  <p className="text-xs text-yellow-500">★ {city.popularity_score}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Dashboard;
