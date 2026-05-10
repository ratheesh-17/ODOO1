import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Map, Globe, Activity, TrendingUp, BarChart2,
  ShieldCheck, ToggleLeft, ToggleRight, AlertTriangle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import API from '../services/api';

const STATUS_COLORS = {
  draft: 'bg-gray-200 text-gray-700',
  planned: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-purple-100 text-purple-700',
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [topCities, setTopCities] = useState([]);
  const [topActivities, setTopActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    Promise.all([
      API.get('/admin/stats'),
      API.get('/admin/top-cities'),
      API.get('/admin/top-activities'),
      API.get('/admin/users'),
    ])
      .then(([s, c, a, u]) => {
        setStats(s.data);
        setTopCities(c.data);
        setTopActivities(a.data);
        setUsers(u.data);
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          navigate('/dashboard');
        } else {
          setError('Failed to load admin data.');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleToggle = async (userId) => {
    setToggling(userId);
    try {
      const res = await API.patch(`/admin/users/${userId}/toggle-active`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: res.data.is_active } : u))
      );
    } catch {
      // silently ignore
    } finally {
      setToggling(null);
    }
  };

  const maxStops = topCities[0]?.stop_count || 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto mt-20 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Platform overview and user management</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={Users} label="Total Users" value={stats.total_users}
            sub={`${stats.active_users} active`} color="bg-blue-100 text-blue-600" />
          <StatCard icon={Map} label="Total Trips" value={stats.total_trips}
            color="bg-green-100 text-green-600" />
          <StatCard icon={Globe} label="Cities" value={stats.total_cities}
            color="bg-purple-100 text-purple-600" />
          <StatCard icon={Activity} label="Activities" value={stats.total_activities}
            color="bg-orange-100 text-orange-600" />
          <StatCard icon={TrendingUp} label="Stops Added" value={stats.total_stops}
            color="bg-pink-100 text-pink-600" />
          <StatCard icon={BarChart2} label="Inactive Users"
            value={stats.total_users - stats.active_users}
            color="bg-red-100 text-red-600" />
        </div>

        {/* Trip Status Breakdown */}
        <div className="card mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Trips by Status</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.trips_by_status).map(([status, count]) => (
              <div key={status} className={`px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}: <span className="font-bold">{count}</span>
              </div>
            ))}
            {Object.keys(stats.trips_by_status).length === 0 && (
              <p className="text-sm text-gray-400">No trips yet.</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {['overview', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' ? 'Top Cities & Activities' : 'User Management'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Top Cities Bar Chart */}
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-5 uppercase tracking-wide">
                Top Cities by Trip Stops
              </h2>
              {topCities.length === 0 ? (
                <p className="text-sm text-gray-400">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {topCities.map((city, i) => (
                    <div key={city.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-800">
                          <span className="text-gray-400 mr-2">#{i + 1}</span>
                          {city.name}
                          <span className="text-gray-400 text-xs ml-1">· {city.country}</span>
                        </span>
                        <span className="text-gray-500 font-semibold">{city.stop_count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                          style={{ width: `${(city.stop_count / maxStops) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Activities */}
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-5 uppercase tracking-wide">
                Most Added Activities
              </h2>
              {topActivities.length === 0 ? (
                <p className="text-sm text-gray-400">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {topActivities.map((act, i) => (
                    <div key={act.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{act.name}</p>
                          <p className="text-xs text-gray-400">{act.city} · {act.category}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        act.usage_count > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {act.usage_count} uses
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">All Users</h2>
              <span className="text-xs text-gray-400">{users.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-6 py-3 font-semibold">User</th>
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-6 py-3 font-semibold text-center">Trips</th>
                    <th className="px-6 py-3 font-semibold">Joined</th>
                    <th className="px-6 py-3 font-semibold text-center">Role</th>
                    <th className="px-6 py-3 font-semibold text-center">Status</th>
                    <th className="px-6 py-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs">
                          {u.trip_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{u.joined}</td>
                      <td className="px-6 py-4 text-center">
                        {u.is_admin ? (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">Admin</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">User</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!u.is_admin && (
                          <button
                            onClick={() => handleToggle(u.id)}
                            disabled={toggling === u.id}
                            className="text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-40"
                            title={u.is_active ? 'Deactivate user' : 'Activate user'}
                          >
                            {u.is_active
                              ? <ToggleRight className="h-6 w-6 text-green-500" />
                              : <ToggleLeft className="h-6 w-6 text-gray-400" />
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
