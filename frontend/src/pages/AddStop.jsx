import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const AddStop = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [existingStops, setExistingStops] = useState([]);
  const [formData, setFormData] = useState({
    arrival_date: '',
    departure_date: '',
    accommodation_cost: '',
    transport_cost: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get(`/trips/${tripId}/stops`).then((res) => setExistingStops(res.data)).catch(() => {});
  }, [tripId]);

  useEffect(() => {
    if (search.length < 1) { setCities([]); return; }
    API.get(`/cities?search=${search}`).then((res) => setCities(res.data)).catch(() => {});
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCity) { setError('Please select a city'); return; }
    setLoading(true);
    setError('');
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={() => navigate(`/trips/${tripId}`)} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add Stop</h1>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

            {/* City Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              {selectedCity ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="font-medium text-blue-900">{selectedCity.name}, {selectedCity.country}</span>
                  <button type="button" onClick={() => { setSelectedCity(null); setSearch(''); }} className="text-blue-600 text-sm hover:underline">Change</button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for a city..."
                    className="input-field pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {cities.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {cities.map((city) => (
                        <button
                          key={city.id}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                          onClick={() => { setSelectedCity(city); setCities([]); setSearch(''); }}
                        >
                          <span className="font-medium">{city.name}</span>
                          <span className="text-gray-500 ml-2">{city.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Date *</label>
                <input type="date" required className="input-field" value={formData.arrival_date}
                  onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departure Date *</label>
                <input type="date" required className="input-field" value={formData.departure_date}
                  onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accommodation Cost ($)</label>
                <input type="number" min="0" step="0.01" className="input-field" placeholder="0.00"
                  value={formData.accommodation_cost}
                  onChange={(e) => setFormData({ ...formData, accommodation_cost: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transport Cost ($)</label>
                <input type="number" min="0" step="0.01" className="input-field" placeholder="0.00"
                  value={formData.transport_cost}
                  onChange={(e) => setFormData({ ...formData, transport_cost: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea rows={3} className="input-field" placeholder="Any notes for this stop..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>

            <div className="flex space-x-4 pt-2">
              <button type="button" onClick={() => navigate(`/trips/${tripId}`)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Adding...' : 'Add Stop'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddStop;
