import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, MapPin, Trash2, Save, AlertTriangle, BookmarkX } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const LANGUAGES = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'pt', 'hi'];

const Profile = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', language_preference: 'en' });
  const [savedCities, setSavedCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, savedRes] = await Promise.all([
          API.get('/users/me'),
          API.get('/users/me/saved-destinations'),
        ]);
        const p = profileRes.data;
        setFormData({ name: p.name, language_preference: p.language_preference || 'en' });
        setSavedCities(savedRes.data);
      } catch {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Name cannot be empty'); return; }
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await API.put('/users/me', formData);
      // update stored user so Navbar reflects new name
      const token = localStorage.getItem('token');
      login(res.data, token);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsave = async (cityId) => {
    try {
      await API.delete(`/users/me/saved-destinations/${cityId}`);
      setSavedCities(savedCities.filter((c) => c.id !== cityId));
    } catch {
      setError('Failed to remove saved destination');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== user?.name) return;
    try {
      await API.delete('/users/me');
      logout();
      navigate('/login');
    } catch {
      setError('Failed to delete account');
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">Profile updated!</div>}

        {/* Profile form */}
        <div className="card">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                disabled
                className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"
                value={user?.email || ''}
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language Preference</label>
              <select
                className="input-field"
                value={formData.language_preference}
                onChange={(e) => setFormData({ ...formData, language_preference: e.target.value })}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={saving} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        </div>

        {/* Saved Destinations */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>Saved Destinations</span>
          </h2>
          {savedCities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No saved destinations yet.</p>
              <Link to="/cities" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Explore cities →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {savedCities.map((city) => (
                <div key={city.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Link to={`/cities/${city.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                      {city.name}
                    </Link>
                    <p className="text-xs text-gray-500">{city.country} · ~${city.avg_daily_cost}/day</p>
                  </div>
                  <button
                    onClick={() => handleUnsave(city.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remove"
                  >
                    <BookmarkX className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Stats */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Account Info</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Member since</span>
              <span className="font-medium text-gray-900">{new Date(user?.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Account status</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-200">
          <h2 className="font-semibold text-red-700 mb-2 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Danger Zone</span>
          </h2>
          <p className="text-sm text-gray-600 mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Account</span>
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">Type your name <strong>{user?.name}</strong> to confirm deletion:</p>
              <input
                type="text"
                className="input-field border-red-300 focus:ring-red-500"
                placeholder="Type your name..."
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== user?.name}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
