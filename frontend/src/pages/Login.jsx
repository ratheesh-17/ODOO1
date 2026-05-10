import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, MapPin, DollarSign, Users, Share2, CheckCircle } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: MapPin,     title: 'Multi-City Itineraries',   desc: 'Plan trips across multiple destinations with day-wise stops.' },
  { icon: DollarSign, title: 'Budget Tracking',           desc: 'Track expenses by category and get over-budget alerts.' },
  { icon: CheckCircle,title: 'Packing Checklists',        desc: 'Never forget essentials with per-trip packing lists.' },
  { icon: Share2,     title: 'Share Your Trips',          desc: 'Share itineraries publicly or copy trips from others.' },
  { icon: Users,      title: 'Explore Destinations',      desc: 'Discover 12+ cities with curated activities and costs.' },
];

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/login', formData);
      login(res.data.user, res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — 3/4 */}
      <div className="hidden lg:flex lg:w-3/4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-5 rounded-full" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white opacity-5 rounded-full" />
        </div>

        {/* Logo */}
        <div className="flex items-center space-x-3 relative z-10">
          <div className="p-2 bg-white bg-opacity-20 rounded-xl">
            <Plane className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">Travelloop</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white leading-tight mb-4">
            Plan your perfect<br />
            <span className="text-blue-200">journey</span>, effortlessly.
          </h1>
          <p className="text-blue-100 text-lg mb-12 max-w-lg">
            Build multi-city itineraries, track budgets, manage packing lists, and share your adventures — all in one place.
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-1 gap-4 max-w-xl">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start space-x-4">
                <div className="p-2 bg-white bg-opacity-15 rounded-lg shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-blue-100" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{title}</p>
                  <p className="text-blue-200 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-blue-300 text-sm relative z-10">
          Built for the Odoo Hackathon · FastAPI + React + MySQL
        </p>
      </div>

      {/* Right panel — 1/4 */}
      <div className="w-full lg:w-1/4 flex flex-col justify-center px-8 py-12 bg-white">
        {/* Mobile logo */}
        <div className="flex items-center space-x-2 mb-8 lg:hidden">
          <Plane className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Travelloop</span>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email" required className="input-field"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password" required className="input-field"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-2.5"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-sm text-center">
          <p className="text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">Sign up</Link>
          </p>
          <button
            type="button"
            onClick={() => alert('Please contact support to reset your password.')}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
