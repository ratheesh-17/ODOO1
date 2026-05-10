import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const AddStop = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const preCity = params.get('city_id') ? {
    id: parseInt(params.get('city_id')),
    name: params.get('city_name') || '',
    country: params.get('city_country') || '',
  } : null;
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(preCity);
  const [existingStops, setExistingStops] = useState([]);
  const [formData, setFormData] = useState({ arrival_date: '', departure_date: '', accommodation_cost: '', transport_cost: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get(`/trips/${tripId}/stops`).then(r => setExistingStops(r.data)).catch(() => {});
  }, [tripId]);

  useEffect(() => {
    if (search.length < 1) { setCities([]); return; }
    API.get(`/cities?search=${search}`).then(r => setCities(r.data)).catch(() => {});
  }, [search]);

  const set = f => e => setFormData(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCity) { setError('Please select a city'); return; }
    setLoading(true); setError('');
    try {
      await API.post(`/trips/${tripId}/stops`, {
        city_id: selectedCity.id,
        stop_order: existingStops.length + 1,
        arrival_date: formData.arrival_date,
        departure_date: formData.departure_date,
        accommodation_cost: parseFloat(formData.accommodation_cost) || 0,
        transport_cost: parseFloat(formData.transport_cost) || 0,
        notes: formData.notes || null,
      });
      navigate(`/trips/${tripId}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add stop');
    } finally { setLoading(false); }
  };

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
            <h1 className="page-title">Add Stop</h1>
            <p className="text-sm text-gray-500 mt-0.5">Stop #{existingStops.length + 1}</p>
          </div>
        </div>

        <div className="card">
          {error && <div className="alert-error mb-6">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* City search */}
            <div>
              <label className="input-label"><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-blue-500" /> City *</span></label>
              {selectedCity ? (
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div>
                    <p className="font-semibold text-blue-900">{selectedCity.name}</p>
                    <p className="text-xs text-blue-600">{selectedCity.country}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedCity(null); setSearch(''); }}
                    className="text-sm text-blue-600 hover:underline font-medium">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Search for a city..." className="input-field pl-9"
                    value={search} onChange={e => setSearch(e.target.value)} />
                  {cities.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {cities.map(city => (
                        <button key={city.id} type="button"
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                          onClick={() => { setSelectedCity(city); setCities([]); setSearch(''); }}>
                          <span className="font-medium text-gray-900">{city.name}</span>
                          <span className="text-gray-400 ml-2">{city.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label"><span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" /> Arrival *</span></label>
                <input type="date" required className="input-field" value={formData.arrival_date} onChange={set('arrival_date')} />
              </div>
              <div>
                <label className="input-label"><span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" /> Departure *</span></label>
                <input type="date" required className="input-field" min={formData.arrival_date} value={formData.departure_date} onChange={set('departure_date')} />
              </div>
            </div>

            {/* Costs */}
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

            {/* Notes */}
            <div>
              <label className="input-label"><span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-gray-400" /> Notes</span></label>
              <textarea rows={3} className="input-field resize-none" placeholder="Any notes for this stop..."
                value={formData.notes} onChange={set('notes')} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate(`/trips/${tripId}`)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Adding...' : 'Add Stop'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStop;
