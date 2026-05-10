import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const CreateTrip = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    total_budget: '',
    cover_photo: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        total_budget: formData.total_budget ? parseFloat(formData.total_budget) : 0
      };

      const response = await API.post('/trips', submitData);
      navigate(`/trips/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you'd upload to a server and get back a URL
      // For now, we'll just store the file name
      setFormData({ ...formData, cover_photo: file.name });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={() => navigate('/trips')} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Plan New Trip</h1>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Trip Name *
              </label>
              <input
                id="name"
                type="text"
                required
                className="input-field"
                placeholder="e.g., Paris Adventure 2024"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="input-field"
                placeholder="Tell us about your trip..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  id="start_date"
                  type="date"
                  required
                  className="input-field"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  id="end_date"
                  type="date"
                  required
                  className="input-field"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="total_budget" className="block text-sm font-medium text-gray-700 mb-2">
                Total Budget (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  id="total_budget"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field pl-8"
                  placeholder="0.00"
                  value={formData.total_budget}
                  onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Leave empty if no budget limit</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Photo
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="cover_photo"
                />
                <label
                  htmlFor="cover_photo"
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Upload className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">Choose file</span>
                </label>
                {formData.cover_photo && (
                  <span className="text-sm text-gray-600">{formData.cover_photo}</span>
                )}
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Trip'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateTrip;