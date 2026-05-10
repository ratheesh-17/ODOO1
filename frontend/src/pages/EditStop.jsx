import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, FileText, X } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const EditStop = () => {
  const { tripId, stopId } = useParams();
  const navigate = useNavigate();
  const [stop, setStop] = useState(null);
  const [formData, setFormData] = useState({ arrival_date: '', departure_date: '', accommodation_cost: '', transport_cost: '', notes: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get(`/trips/${tripId}/stops`)
      .then(res => {
        const found = res.data.find(s => s.id === parseInt(stopId));
        if (!found) { navigate(`/trips/${tripId}`); return; }
        setStop(found);
        setFormData({
          arrival_date: found.arrival_date,
          departure_date: found.departure_date,
          accommodation_cost: found.accommodation_cost,
          transport_cost: found.transport_cost,
          notes: found.notes || '',
        });
      })
      .catch(() => navigate(`/trips/${tripId}`));
  }, [tripId, stopId, navigate]);

  const set = f => e => {
    setFormData(p => ({ ...p, [f]: e.target.value }));
    if (fieldErrors[f]) setFieldErrors(p => ({ ...p, [f]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.arrival_date) errs.arrival_date = 'Arrival date is required';
    if (!formData.departure_date) errs.departure_date = 'Departure date is required';
    if (formData.arrival_date && formData.departure_date && formData.departure_date < formData.arrival_date)
      errs.departure_date = 'Departure must be after arrival';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setError('');
    try {
      await API.put(`/trips/${tripId}/stops/${stopId}`, {
        arrival_date: formData.arrival_date,
        departure_date: formData.departure_date,
        accommodation_cost: parseFloat(formData.accommodation_cost) || 0,
        transport_cost: parseFloat(formData.transport_cost) || 0,
        notes: formData.notes || null,
      });
      navigate(`/trips/${tripId}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update stop');
    } finally { setLoading(false); }
  };

  if (!stop) return (
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
            className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="page-title">Edit Stop</h1>
            <p className="text-sm text-gray-500 mt-0.5">{stop.city_name}, {stop.city_country}</p>
          </div>
        </div>

        <div className="card">
          {error && <div className="alert-error mb-5 flex items-center gap-2"><X className="h-4 w-4 shrink-0" />{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label"><span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" /> Arrival *</span></label>
                <input type="date" className={`input-field ${fieldErrors.arrival_date ? 'border-red-400' : ''}`}
                  value={formData.arrival_date} onChange={set('arrival_date')} />
                {fieldErrors.arrival_date && <p className="text-xs text-red-500 mt-1">{fieldErrors.arrival_date}</p>}
              </div>
              <div>
                <label className="input-label"><span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" /> Departure *</span></label>
                <input type="date" className={`input-field ${fieldErrors.departure_date ? 'border-red-400' : ''}`}
                  min={formData.arrival_date} value={formData.departure_date} onChange={set('departure_date')} />
                {fieldErrors.departure_date && <p className="text-xs text-red-500 mt-1">{fieldErrors.departure_date}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label"><span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-gray-400" /> Accommodation ($)</span></label>
                <input type="number" min="0" step="0.01" className="input-field" placeholder="0.00"
                  value={formData.accommodation_cost} onChange={set('accommodation_cost')} />
              </div>
              <div>
                <label className="input-label"><span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-gray-400" /> Transport ($)</span></label>
                <input type="number" min="0" step="0.01" className="input-field" placeholder="0.00"
                  value={formData.transport_cost} onChange={set('transport_cost')} />
              </div>
            </div>

            <div>
              <label className="input-label"><span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-gray-400" /> Notes</span></label>
              <textarea rows={3} className="input-field resize-none" value={formData.notes} onChange={set('notes')} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate(`/trips/${tripId}`)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</span> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditStop;
