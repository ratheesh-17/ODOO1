import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, MapPin, DollarSign, Share2, CheckCircle, Eye, EyeOff, X } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: MapPin,      title: 'Multi-City Itineraries', desc: 'Plan trips across multiple destinations with day-wise stops.' },
  { icon: DollarSign,  title: 'Budget Tracking',        desc: 'Track expenses by category and get over-budget alerts.' },
  { icon: CheckCircle, title: 'Packing Checklists',     desc: 'Never forget essentials with per-trip packing lists.' },
  { icon: Share2,      title: 'Share Your Trips',       desc: 'Share itineraries publicly or copy trips from others.' },
];

const getPasswordStrength = (pwd) => {
  if (!pwd) return null;
  if (pwd.length < 6) return { label: 'Too short', color: 'bg-red-400', width: '25%' };
  if (pwd.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: '50%' };
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  return { label: 'Fair', color: 'bg-yellow-400', width: '75%' };
};

const Register = () => {
  const [formData, setFormData]       = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const strength = getPasswordStrength(formData.password);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    else if (formData.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
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
      const res = await API.post('/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      login(res.data.user, res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
            Your next adventure<br /><span className="text-blue-200">starts here.</span>
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-lg leading-relaxed">
            Join Travelloop and start planning smarter trips — with budgets, itineraries, packing lists, and sharing built right in.
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
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-sm text-gray-500 mt-1">Start planning your trips today — it's free</p>
          </div>

          {error && (
            <div className="alert-error mb-6 flex items-center gap-2">
              <X className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Name */}
            <div>
              <label className="input-label">Full Name</label>
              <input type="text" className={`input-field ${fieldErrors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="John Doe" value={formData.name} onChange={set('name')} />
              {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="input-label">Email address</label>
              <input type="email" className={`input-field ${fieldErrors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="you@example.com" value={formData.email} onChange={set('email')} />
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'}
                  className={`input-field pr-10 ${fieldErrors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Min. 6 characters" value={formData.password} onChange={set('password')} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
              {/* Password strength bar */}
              {strength && !fieldErrors.password && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }} />
                  </div>
                  <p className={`text-xs mt-1 font-medium ${
                    strength.label === 'Strong' ? 'text-green-600' :
                    strength.label === 'Fair' ? 'text-yellow-600' : 'text-red-500'
                  }`}>{strength.label} password</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
