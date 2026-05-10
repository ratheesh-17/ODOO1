import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, MapPin, DollarSign, Share2, CheckCircle, Eye, EyeOff, X, Mail } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: MapPin,      title: 'Multi-City Itineraries', desc: 'Plan trips across multiple destinations with day-wise stops.' },
  { icon: DollarSign,  title: 'Budget Tracking',        desc: 'Track expenses by category and get over-budget alerts.' },
  { icon: CheckCircle, title: 'Packing Checklists',     desc: 'Never forget essentials with per-trip packing lists.' },
  { icon: Share2,      title: 'Share Your Trips',       desc: 'Share itineraries publicly or copy trips from others.' },
];

const Login = () => {
  const [formData, setFormData]     = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/login', formData);
      login(res.data.user, res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !/\S+@\S+\.\S+/.test(forgotEmail)) return;
    // In a real app this would call an API endpoint
    setForgotSent(true);
  };

  const set = (f) => (e) => {
    setFormData(p => ({ ...p, [f]: e.target.value }));
    if (fieldErrors[f]) setFieldErrors(p => ({ ...p, [f]: '' }));
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-5 rounded-full" />
          <div className="absolute top-1/2 -left-20 w-72 h-72 bg-white opacity-5 rounded-full" />
          <div className="absolute -bottom-32 right-1/3 w-80 h-80 bg-white opacity-5 rounded-full" />
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-white/20 rounded-xl"><Plane className="h-6 w-6 text-white" /></div>
          <span className="text-2xl font-bold text-white tracking-tight">Travelloop</span>
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white leading-tight mb-4">
            Plan your perfect<br /><span className="text-blue-200">journey</span>, effortlessly.
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-lg leading-relaxed">
            Build multi-city itineraries, track budgets, manage packing lists, and share your adventures — all in one place.
          </p>
          <div className="space-y-4 max-w-lg">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="p-2 bg-white/15 rounded-lg shrink-0 mt-0.5">
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

        <p className="text-blue-300/70 text-xs relative z-10">Built for the Odoo Hackathon · FastAPI + React + MySQL</p>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-8 sm:px-12 py-12 bg-white">
        <div className="max-w-sm w-full mx-auto">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="p-1.5 bg-blue-600 rounded-lg"><Plane className="h-5 w-5 text-white" /></div>
            <span className="text-xl font-bold text-gray-900">Travelloop</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="alert-error mb-6 flex items-center gap-2">
              <X className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="input-label">Email address</label>
              <input type="email" className={`input-field ${fieldErrors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="you@example.com" value={formData.email} onChange={set('email')} />
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="input-label mb-0">Password</label>
                <button type="button" onClick={() => setShowForgot(true)}
                  className="text-xs text-blue-600 hover:underline font-medium">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'}
                  className={`input-field pr-10 ${fieldErrors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="••••••••" value={formData.password} onChange={set('password')} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-2.5 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
            <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>

            {forgotSent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Check your email</h3>
                <p className="text-sm text-gray-500 mb-6">
                  If <strong>{forgotEmail}</strong> is registered, you'll receive a password reset link shortly.
                </p>
                <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}
                  className="btn-primary w-full">Back to Sign in</button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Reset your password</h3>
                  <p className="text-sm text-gray-500">Enter your email and we'll send you a reset link.</p>
                </div>
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="input-label">Email address</label>
                    <input type="email" required className="input-field" placeholder="you@example.com"
                      value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                  </div>
                  <button type="submit" className="btn-primary w-full">Send Reset Link</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
