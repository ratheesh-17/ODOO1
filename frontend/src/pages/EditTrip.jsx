import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, FileText, Calendar, DollarSign, Image, X } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const STATUS_OPTIONS = ['draft', 'planned', 'ongoing', 'completed'];

const EditTrip = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get(`/trips/${tripId}`)
      .then(res => {
        const t = res.data;
        setFormData({
          name: t.name,
          description: t.description || '',
          start_date: t.start_date,
          end_date: t.end_date,
          total_budget: t.total_budget || '',
          cover_photo: t.cover_photo || '',
          status: t.status,
        });
      })
      .catch(() => navigate('/trips'));
  }, [tripId, navigate]);

  const set = (field) => (e) => {
    setFormData(p => ({ ...p, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors(p => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Trip name is required';
    else if (formData.name.trim().length < 3) errs.name = 'Name must be at least 3 characters';
    if (!formData.start_date) errs.start_date = 'Start date is required';
    if (!formData.end_date) errs.end_date = 'End date is required';
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date)
      errs.end_date = 'End date must be after start date';
    if (formData.total_budget && parseFloat(formData.total_budget) < 0)
      errs.total_budget = 'Budget cannot be negative';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      await API.put(`/trips/${tripId}`, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_budget: parseFloat(formData.total_budget) || 0,
        cover_photo: formData.cover_photo || null,
        status: formData.status,
      });
      navigate(`/trips/${tripId}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return (
    <div className="min-h-screen bg-slate-50"><Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="page-container max-w-2xl">

        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(`/trips/${tripId}`)}
            className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="page-title">Edit Trip</h1>
            <p className="text-sm text-gray-500 mt-0.5">Update your trip details</p>
          </div>
        </div>

        <div className="card">
          {error && <div className="alert-error mb-6 flex items-center gap-2"><X className="h-4 w-4 shrink-0" />{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Name */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-blue-500" /> Trip Name *</span>
              </label>
              <input type="text" className={`input-field ${fieldErrors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                value={formData.name} onChange={set('name')} />
              {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-gray-400" /> Description</span>
              </label>
              <textarea rows={3} className="input-field resize-none"
                value={formData.description} onChange={set('description')} />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" /> Start Date *</span>
                </label>
                <input type="date" className={`input-field ${fieldErrors.start_date ? 'border-red-400 focus:ring-red-400' : ''}`}
                  value={formData.start_date} onChange={set('start_date')} />
                {fieldErrors.start_date && <p className="text-xs text-red-500 mt-1">{fieldErrors.start_date}</p>}
              </div>
              <div>
                <label className="input-label">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" /> End Date *</span>
                </label>
                <input type="date" className={`input-field ${fieldErrors.end_date ? 'border-red-400 focus:ring-red-400' : ''}`}
                  min={formData.start_date} value={formData.end_date} onChange={set('end_date')} />
                {fieldErrors.end_date && <p className="text-xs text-red-500 mt-1">{fieldErrors.end_date}</p>}
              </div>
            </div>

            {/* Budget + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">
                  <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-gray-400" /> Budget (USD)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input type="number" min="0" step="0.01"
                    className={`input-field pl-8 ${fieldErrors.total_budget ? 'border-red-400 focus:ring-red-400' : ''}`}
                    value={formData.total_budget} onChange={set('total_budget')} />
                </div>
                {fieldErrors.total_budget && <p className="text-xs text-red-500 mt-1">{fieldErrors.total_budget}</p>}
              </div>
              <div>
                <label className="input-label">Status</label>
                <select className="input-field" value={formData.status} onChange={set('status')}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cover Photo */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5 text-gray-400" /> Cover Photo URL</span>
              </label>
              <input type="url" className="input-field" placeholder="https://images.unsplash.com/..."
                value={formData.cover_photo} onChange={set('cover_photo')} />
              {formData.cover_photo && (
                <img src={formData.cover_photo} alt="preview"
                  className="mt-2 h-32 w-full object-cover rounded-xl border border-gray-100"
                  onError={e => e.target.style.display = 'none'} />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate(`/trips/${tripId}`)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTrip;
