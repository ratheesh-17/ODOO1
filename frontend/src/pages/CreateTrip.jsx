import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, FileText, Image, Sparkles, Upload, X } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const CreateTrip = () => {
  const [formData, setFormData] = useState({
    name: '', description: '', start_date: '', end_date: '', total_budget: '', cover_photo: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const navigate = useNavigate();

  const set = (field) => (e) => {
    setFormData(p => ({ ...p, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors(p => ({ ...p, [field]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setFieldErrors(p => ({ ...p, cover_photo: 'Please select an image file' })); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      // store as data URL — in production this would upload to a server
      setFormData(p => ({ ...p, cover_photo: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoPreview('');
    setFormData(p => ({ ...p, cover_photo: '' }));
    if (fileRef.current) fileRef.current.value = '';
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
      const res = await API.post('/trips', {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_budget: formData.total_budget ? parseFloat(formData.total_budget) : 0,
        cover_photo: formData.cover_photo || null,
      });
      navigate(`/trips/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="page-container max-w-2xl">

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
          {error && <div className="alert-error mb-6 flex items-center gap-2"><X className="h-4 w-4 shrink-0" />{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Trip Name */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-blue-500" /> Trip Name *</span>
              </label>
              <input type="text" className={`input-field ${fieldErrors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="e.g., Europe Summer 2025" value={formData.name} onChange={set('name')} />
              {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
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

            {/* Budget */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-gray-400" /> Total Budget (USD)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                <input type="number" min="0" step="0.01"
                  className={`input-field pl-8 ${fieldErrors.total_budget ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="0.00" value={formData.total_budget} onChange={set('total_budget')} />
              </div>
              {fieldErrors.total_budget
                ? <p className="text-xs text-red-500 mt-1">{fieldErrors.total_budget}</p>
                : <p className="text-xs text-gray-400 mt-1.5">Leave empty for no budget limit</p>}
            </div>

            {/* Cover Photo */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><Image className="h-3.5 w-3.5 text-gray-400" /> Cover Photo (optional)</span>
              </label>

              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Cover preview"
                    className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                  <button type="button" onClick={clearPhoto}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                  <Upload className="h-8 w-8 text-gray-300 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
                  <p className="text-sm text-gray-500 group-hover:text-blue-600 font-medium">Click to upload a photo</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {fieldErrors.cover_photo && <p className="text-xs text-red-500 mt-1">{fieldErrors.cover_photo}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : 'Create Trip'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTrip;
