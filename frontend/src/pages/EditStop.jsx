import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const EditStop = () => {
  const { tripId, stopId } = useParams();
  const navigate = useNavigate();
  const [stop, setStop] = useState(null);
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
    API.get(`/trips/${tripId}/stops`)
      .then((res) => {
        const found = res.data.find((s) => s.id === parseInt(stopId));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
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
    } finally {
      setLoading(false);
    }
  };

  if (!stop) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={() => navigate(`/trips/${tripId}`)} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Stop</h1>
            <p className="text-sm text-gray-600">{stop.city_name}, {stop.city_country}</p>
          </div>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

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
                <input type="number" min="0" step="0.01" className="input-field"
                  value={formData.accommodation_cost}
                  onChange={(e) => setFormData({ ...formData, accommodation_cost: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transport Cost ($)</label>
                <input type="number" min="0" step="0.01" className="input-field"
                  value={formData.transport_cost}
                  onChange={(e) => setFormData({ ...formData, transport_cost: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea rows={3} className="input-field" value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>

            <div className="flex space-x-4 pt-2">
              <button type="button" onClick={() => navigate(`/trips/${tripId}`)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditStop;
