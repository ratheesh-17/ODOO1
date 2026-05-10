import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Plane, Copy, Twitter, Link2 } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const SharedTrip = () => {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get(`/shared/${token}`)
      .then((res) => setTrip(res.data))
      .catch(() => setError('This shared trip is not available or has been deactivated.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCopy = async () => {
    if (!user) { navigate('/login'); return; }
    setCopying(true);
    try {
      const res = await API.post(`/shared/${token}/copy`);
      navigate(`/trips/${res.data.trip_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to copy trip');
    } finally {
      setCopying(false);
    }
  };

  const shareUrl = `${window.location.origin}/shared/${token}`;

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=Check out my trip: ${trip?.name}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=Check out my trip: ${trip?.name} ${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    alert('Link copied!');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card text-center max-w-md">
        <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Trip Not Found</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <Plane className="h-7 w-7 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Travelloop</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={copyLink} className="btn-secondary flex items-center space-x-2">
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:block">Copy Link</span>
              </button>
              <button onClick={shareToWhatsApp} className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1">
                <span>WhatsApp</span>
              </button>
              <button onClick={shareToTwitter} className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1">
                <Twitter className="h-4 w-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={copying}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                <span>{copying ? 'Copying...' : user ? 'Copy to My Trips' : 'Sign in to Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{trip.name}</h2>
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(trip.start_date).toLocaleDateString()} — {new Date(trip.end_date).toLocaleDateString()}
          </div>
          {trip.description && <p className="text-gray-600">{trip.description}</p>}
          <span className={`inline-block mt-3 px-2 py-1 text-xs rounded-full ${
            trip.status === 'completed' ? 'bg-green-100 text-green-800' :
            trip.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>{trip.status}</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Itinerary</h3>
        {trip.stops?.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">No stops in this trip.</div>
        ) : (
          <div className="space-y-4">
            {trip.stops?.map((stop, index) => (
              <div key={index} className="card">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <h4 className="font-semibold text-gray-900">{stop.city}, {stop.country}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {new Date(stop.arrival_date).toLocaleDateString()} — {new Date(stop.departure_date).toLocaleDateString()}
                    </p>
                    {stop.activities?.length > 0 && (
                      <div className="space-y-1">
                        {stop.activities.map((act, i) => (
                          <div key={i} className="flex justify-between text-sm bg-gray-50 rounded px-3 py-1.5">
                            <span className="text-gray-900">{act.name} <span className="text-gray-400 text-xs">({act.category})</span></span>
                            <span className="text-green-600 font-medium">${act.cost}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SharedTrip;
