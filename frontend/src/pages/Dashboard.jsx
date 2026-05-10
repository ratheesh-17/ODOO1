import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Calendar, DollarSign, Plane, TrendingUp, AlertTriangle } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const [trips, setTrips] = useState([]);
  const [cities, setCities] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tripsRes, citiesRes] = await Promise.all([
          API.get('/trips'),
          API.get('/cities?featured=true&limit=6'),
        ]);
        setTrips(tripsRes.data);
        setCities(citiesRes.data);

        // fetch budgets for recent trips (up to 3)
        const recentTrips = tripsRes.data.slice(0, 3);
        const budgetResults = await Promise.allSettled(
          recentTrips.map((t) => API.get(`/trips/${t.id}/budget`))
        );
        const budgetMap = {};
        budgetResults.forEach((r, i) => {
          if (r.status === 'fulfilled') budgetMap[recentTrips[i].id] = r.value.data;
        });
        setBudgets(budgetMap);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const totalSpent = Object.values(budgets).reduce((sum, b) => sum + (b?.total_cost || 0), 0);
  const overBudgetTrips = trips.filter((t) => {
    const b = budgets[t.id];
    return b && t.total_budget > 0 && b.total_cost > t.total_budget;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-gray-600">Discover destinations, create itineraries, and share your travel plans.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/trips/new" className="card group">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Plan New Trip</h3>
                <p className="text-sm text-gray-600">Start your journey</p>
              </div>
            </div>
          </Link>

          <Link to="/cities" className="card group">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Explore Cities</h3>
                <p className="text-sm text-gray-600">Find your next destination</p>
              </div>
            </div>
          </Link>

          <Link to="/trips" className="card group">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">My Trips</h3>
                <p className="text-sm text-gray-600">Manage your plans</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Budget Highlights */}
        {trips.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Budget Highlights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Total Trips</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{trips.length}</p>
                <p className="text-xs text-gray-500 mt-1">{trips.filter(t => t.status === 'planned').length} planned · {trips.filter(t => t.status === 'ongoing').length} ongoing</p>
              </div>

              <div className="card">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Total Spent</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">${totalSpent.toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-1">Across recent trips</p>
              </div>

              <div className={`card ${overBudgetTrips.length > 0 ? 'border-red-200 bg-red-50' : ''}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-lg ${overBudgetTrips.length > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <AlertTriangle className={`h-5 w-5 ${overBudgetTrips.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Over Budget</span>
                </div>
                <p className={`text-3xl font-bold ${overBudgetTrips.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {overBudgetTrips.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {overBudgetTrips.length > 0 ? overBudgetTrips.map(t => t.name).join(', ') : 'All trips within budget'}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Recent Trips */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Recent Trips</h3>
            <Link to="/trips" className="text-blue-600 hover:text-blue-700 text-sm font-medium">View all</Link>
          </div>
          {trips.length === 0 ? (
            <div className="card text-center py-12">
              <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trips yet</h3>
              <p className="text-gray-600 mb-4">Start planning your first adventure</p>
              <Link to="/trips/new" className="btn-primary inline-block">Plan Your First Trip</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.slice(0, 3).map((trip) => {
                const b = budgets[trip.id];
                const isOver = b && trip.total_budget > 0 && b.total_cost > trip.total_budget;
                return (
                  <Link key={trip.id} to={`/trips/${trip.id}`} className="card group">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{trip.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                        trip.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{trip.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{trip.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(trip.start_date).toLocaleDateString()}</span>
                      </span>
                      <span>{trip.stop_count} stops</span>
                    </div>
                    {b && (
                      <div className={`flex items-center justify-between text-xs px-2 py-1 rounded ${isOver ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        <span>Spent: ${b.total_cost.toFixed(0)}</span>
                        {trip.total_budget > 0 && <span>Limit: ${trip.total_budget}</span>}
                        {isOver && <AlertTriangle className="h-3 w-3" />}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Popular Cities */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Popular Destinations</h3>
            <Link to="/cities" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Explore more</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => (
              <Link key={city.id} to={`/cities/${city.id}`} className="card group">
                <div className="flex items-center space-x-3 mb-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{city.name}</h4>
                    <p className="text-sm text-gray-600">{city.country}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Avg. ${city.avg_daily_cost}/day</span>
                  <span className="text-yellow-600">★ {city.popularity_score}</span>
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
