import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, FileText, Image, Sparkles } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const CreateTrip = () => {
  const [formData, setFormData] = useState({
    name: '', description: '', start_date: '', end_date: '', total_budget: '', cover_photo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const set = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.end_date < formData.start_date) {
      setError('End date must be after start date');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/trips', {
        ...formData,
        total_budget: formData.total_budget ? parseFloat(formData.total_budget) : 0,
      });
      navigate(`/trips/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="page-container max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/trips')}
            className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="page-title">Plan New Trip</h1>
            <p className="text-sm text-gray-500 mt-0.5">Fill in the details to start your journey</p>
          </div>
        </div>

        <div className="card">
          {error && <div className="alert-error mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Trip Name */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-blue-500" /> Trip Name *</span>
              </label>
              <input type="text" required className="input-field" placeholder="e.g., Europe Summer 2025"
                value={formData.name} onChange={set('name')} />
            </div>

            {/* Description */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-gray-400" /> Description</span>
              </label>
              <textarea rows={3} className="input-field resize-none" placeholder="What's this trip about?"
                value={formData.description} onChange={set('description')} />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" /> Start Date *</span>
                </label>
                <input type="date" required className="input-field"
                  value={formData.start_date} onChange={set('start_date')} />
              </div>
              <div>
                <label className="input-label">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" /> End Date *</span>
                </label>
                <input type="date" required className="input-field"
                  min={formData.start_date} value={formData.end_date} onChange={set('end_date')} />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-gray-400" /> Total Budget (USD)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                <input type="number" min="0" step="0.01" className="input-field pl-8" placeholder="0.00"
                  value={formData.total_budget} onChange={set('total_budget')} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Leave empty for no budget limit</p>
            </div>

            {/* Cover Photo URL */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5 text-gray-400" /> Cover Photo URL</span>
              </label>
              <input type="url" className="input-field" placeholder="https://images.unsplash.com/..."
                value={formData.cover_photo} onChange={set('cover_photo')} />
              {formData.cover_photo && (
                <img src={formData.cover_photo} alt="preview"
                  className="mt-2 h-32 w-full object-cover rounded-xl border border-gray-100"
                  onError={(e) => e.target.style.display = 'none'} />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Creating...' : 'Create Trip'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTrip;
