import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Map, Globe, Activity, TrendingUp, BarChart2,
  ShieldCheck, ToggleLeft, ToggleRight, AlertTriangle, Search, X, UserPlus,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import API from '../services/api';

const STATUS_COLORS = {
  draft:     'bg-gray-200 text-gray-700',
  planned:   'bg-blue-100 text-blue-700',
  ongoing:   'bg-green-100 text-green-700',
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

// Pure-CSS horizontal bar chart for trips over time
function TripsOverTimeChart({ data }) {
  if (!data.length) return (
    <div className="text-center py-12 text-gray-400 text-sm">No trip data in the last 30 days.</div>
  );
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.date} className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-24 shrink-0">
            {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className="h-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-end pr-2 transition-all duration-500"
              style={{ width: `${Math.max((d.count / max) * 100, 4)}%` }}
            >
              <span className="text-white text-xs font-bold">{d.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const USER_FILTERS = ['all', 'active', 'inactive', 'admin'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]               = useState(null);
  const [topCities, setTopCities]       = useState([]);
  const [topActivities, setTopActivities] = useState([]);
  const [users, setUsers]               = useState([]);
  const [tripsOverTime, setTripsOverTime] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [initError, setInitError]       = useState('');
  const [actionError, setActionError]   = useState('');
  const [activeTab, setActiveTab]       = useState('overview');
  const [toggling, setToggling]         = useState(null);
  const [userSearch, setUserSearch]     = useState('');
  const [userFilter, setUserFilter]     = useState('all');

  useEffect(() => {
    Promise.allSettled([
      API.get('/admin/stats'),
      API.get('/admin/top-cities'),
      API.get('/admin/top-activities'),
      API.get('/admin/users'),
      API.get('/admin/trips-over-time'),
    ]).then(([s, c, a, u, t]) => {
      // 403 on any call → not admin, redirect
      const forbidden = [s, c, a, u, t].find(r => r.reason?.response?.status === 403);
      if (forbidden) { navigate('/dashboard'); return; }

      if (s.status === 'fulfilled') setStats(s.value.data);
      else setInitError('Failed to load stats.');

      if (c.status === 'fulfilled') setTopCities(c.value.data);
      if (a.status === 'fulfilled') setTopActivities(a.value.data);
      if (u.status === 'fulfilled') setUsers(u.value.data);
      if (t.status === 'fulfilled') setTripsOverTime(t.value.data);
    }).finally(() => setLoading(false));
  }, [navigate]);

  const handleToggle = async (userId, currentlyActive) => {
    if (currentlyActive && !window.confirm('Deactivate this user? They will be logged out on next request.')) return;
    setToggling(userId);
    setActionError('');
    try {
      const res = await API.patch(`/admin/users/${userId}/toggle-active`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: res.data.is_active } : u));
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to update user status.');
    } finally {
      setToggling(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchFilter =
      userFilter === 'all'      ? true :
      userFilter === 'active'   ? u.is_active :
      userFilter === 'inactive' ? !u.is_active :
      userFilter === 'admin'    ? u.is_admin : true;
    return matchSearch && matchFilter;
  });

  const maxStops = topCities[0]?.stop_count || 1;

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    </div>
  );

  if (!stats) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto mt-20 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600">{initError || 'Failed to load admin data.'}</p>
      </div>
    </div>
  );

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

        {/* Action error banner */}
        {actionError && (
          <div className="alert-error mb-6 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {actionError}
            <button onClick={() => setActionError('')} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={Users}     label="Total Users"     value={stats.total_users}
            sub={`${stats.active_users} active`}  color="bg-blue-100 text-blue-600" />
          <StatCard icon={Map}       label="Total Trips"     value={stats.total_trips}
            color="bg-green-100 text-green-600" />
          <StatCard icon={Globe}     label="Cities"          value={stats.total_cities}
            color="bg-purple-100 text-purple-600" />
          <StatCard icon={Activity}  label="Activities"      value={stats.total_activities}
            color="bg-orange-100 text-orange-600" />
          <StatCard icon={TrendingUp} label="Stops Added"    value={stats.total_stops}
            color="bg-pink-100 text-pink-600" />
          <StatCard icon={UserPlus}  label="New Users (30d)" value={stats.new_users_30d}
            color="bg-teal-100 text-teal-600" />
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
          {[
            { key: 'overview', label: 'Top Cities & Activities' },
            { key: 'trips',    label: 'Trips Over Time' },
            { key: 'users',    label: 'User Management' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Cities */}
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
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                          style={{ width: `${(city.stop_count / maxStops) * 100}%` }} />
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

        {/* Tab: Trips Over Time */}
        {activeTab === 'trips' && (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-6 uppercase tracking-wide">
              Trips Created — Last 30 Days
            </h2>
            <TripsOverTimeChart data={tripsOverTime} />
          </div>
        )}

        {/* Tab: User Management */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search + filter bar */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input className="input-field pl-9" placeholder="Search by name or email…"
                  value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {USER_FILTERS.map(f => (
                  <button key={f} onClick={() => setUserFilter(f)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                      userFilter === f
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}>
                    {f === 'all' ? `All (${users.length})` :
                     f === 'active'   ? `Active (${users.filter(u => u.is_active).length})` :
                     f === 'inactive' ? `Inactive (${users.filter(u => !u.is_active).length})` :
                     `Admin (${users.filter(u => u.is_admin).length})`}
                  </button>
                ))}
              </div>
              {(userSearch || userFilter !== 'all') && (
                <button onClick={() => { setUserSearch(''); setUserFilter('all'); }}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline px-2">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>

            <div className="card overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Users</h2>
                <span className="text-xs text-gray-400">
                  {filteredUsers.length === users.length
                    ? `${users.length} total`
                    : `${filteredUsers.length} of ${users.length}`}
                </span>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No users match your search.</div>
              ) : (
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
                      {filteredUsers.map(u => (
                        <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
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
                          <td className="px-6 py-4 text-gray-400 text-xs">
                            {u.joined
                              ? new Date(u.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {u.is_admin
                              ? <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">Admin</span>
                              : <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">User</span>}
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
                                onClick={() => handleToggle(u.id, u.is_active)}
                                disabled={toggling === u.id}
                                className="text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-40"
                                title={u.is_active ? 'Deactivate user' : 'Activate user'}
                              >
                                {toggling === u.id
                                  ? <span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin block mx-auto" />
                                  : u.is_active
                                    ? <ToggleRight className="h-6 w-6 text-green-500" />
                                    : <ToggleLeft className="h-6 w-6 text-gray-400" />}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
