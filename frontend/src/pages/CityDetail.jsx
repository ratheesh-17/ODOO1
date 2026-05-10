import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, DollarSign } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const CityDetail = () => {
  const { cityId } = useParams();
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get(`/cities/${cityId}`)
      .then((res) => setCity(res.data))
      .catch((err) => {
        if (err.response?.status === 404) navigate('/cities');
      })
      .finally(() => setLoading(false));
  }, [cityId, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  if (!city) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={() => navigate('/cities')} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{city.name}</h1>
            <p className="text-sm text-gray-600">{city.country}{city.region ? `, ${city.region}` : ''}</p>
          </div>
        </div>
        {city.image_url && (
          <img src={city.image_url} alt={city.name} className="w-full h-64 object-cover rounded-xl mb-6" />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {city.description && (
              <div className="card mb-6">
                <h2 className="font-semibold text-gray-900 mb-2">About</h2>
                <p className="text-gray-600">{city.description}</p>
              </div>
            )}

            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Activities</h2>
              {city.activities?.length === 0 ? (
                <p className="text-gray-500 text-sm">No activities listed for this city.</p>
              ) : (
                <div className="space-y-3">
                  {city.activities?.map((act) => (
                    <div key={act.id} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{act.name}</h3>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{act.category}</span>
                          {act.description && <p className="text-sm text-gray-600 mt-1">{act.description}</p>}
                        </div>
                        <div className="text-right text-sm text-gray-600 ml-4 shrink-0">
                          <div className="flex items-center"><DollarSign className="h-3 w-3 mr-1" />${act.estimated_cost}</div>
                          <div className="flex items-center mt-1"><Clock className="h-3 w-3 mr-1" />{act.duration_hours}h</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card h-fit">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. daily cost</span>
                <span className="font-medium">${city.avg_daily_cost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Popularity</span>
                <span className="font-medium text-yellow-600">★ {city.popularity_score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Featured</span>
                <span className="font-medium">{city.is_featured ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CityDetail;
