import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Plus, Edit, Share2, DollarSign, Package, StickyNote, List, GitBranch, CheckCircle, Trash2 } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const TripDetail = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'timeline'
  const [shareMsg, setShareMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchTripData(); }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTripData = async () => {
    try {
      const [tripRes, stopsRes, budgetRes] = await Promise.all([
        API.get(`/trips/${tripId}`),
        API.get(`/trips/${tripId}/stops`),
        API.get(`/trips/${tripId}/budget`),
      ]);
      setTrip(tripRes.data);
      setStops(stopsRes.data);
      setBudget(budgetRes.data);
    } catch (error) {
      if (error.response?.status === 404) navigate('/trips');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStop = async (stopId) => {
    if (!window.confirm('Delete this stop and all its activities?')) return;
    try {
      await API.delete(`/trips/${tripId}/stops/${stopId}`);
      setStops((prev) => prev.filter((s) => s.id !== stopId));
    } catch {
      // silently ignore
    }
  };

  const handleShare = async () => {
    try {
      const response = await API.post(`/trips/${tripId}/share`);
      const shareUrl = `${window.location.origin}/shared/${response.data.share_token}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareMsg('Link copied!');
      setTimeout(() => setShareMsg(''), 2500);
    } catch {
      setShareMsg('Failed to copy');
      setTimeout(() => setShareMsg(''), 2500);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  if (!trip) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip not found</h2>
        <Link to="/trips" className="btn-primary">Back to My Trips</Link>
      </div>
    </div>
  );

  // Timeline: group stops by date range, compute day numbers
  const tripStart = new Date(trip.start_date);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Sub-header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/trips')} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{trip.name}</h1>
                <p className="text-sm text-gray-600">
                  {new Date(trip.start_date).toLocaleDateString()} — {new Date(trip.end_date).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                trip.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>{trip.status}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button onClick={handleShare} className="btn-secondary flex items-center space-x-2">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:block">Share</span>
                </button>
                {shareMsg && (
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap">
                    {shareMsg}
                  </span>
                )}
              </div>
              <Link to={`/trips/${tripId}/edit`} className="btn-primary flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span className="hidden sm:block">Edit</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {trip.description && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-2">About this trip</h3>
                <p className="text-gray-600">{trip.description}</p>
              </div>
            )}

            {/* Itinerary with view toggle */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Itinerary</h3>
                <div className="flex items-center space-x-2">
                  {/* View toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setView('list')}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-colors ${view === 'list' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <List className="h-4 w-4" />
                      <span>List</span>
                    </button>
                    <button
                      onClick={() => setView('timeline')}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-colors ${view === 'timeline' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <GitBranch className="h-4 w-4" />
                      <span>Timeline</span>
                    </button>
                  </div>
                  <Link to={`/trips/${tripId}/stops/new`} className="btn-primary text-sm flex items-center space-x-1">
                    <Plus className="h-4 w-4" />
                    <span>Add Stop</span>
                  </Link>
                </div>
              </div>

              {stops.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No stops added yet</h4>
                  <p className="text-gray-600 mb-4">Start building your itinerary by adding destinations</p>
                  <Link to={`/trips/${tripId}/stops/new`} className="btn-primary">Add Your First Stop</Link>
                </div>
              ) : view === 'list' ? (
                /* LIST VIEW */
                <div className="space-y-4">
                  {stops.map((stop, index) => (
                    <StopCard key={stop.id} stop={stop} index={index} tripId={tripId} onDelete={handleDeleteStop} />
                  ))}
                </div>
              ) : (
                /* TIMELINE VIEW */
                <div className="relative">
                  {/* vertical line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-100" />
                  <div className="space-y-0">
                    {stops.map((stop, index) => {
                      const arrivalDay = Math.ceil((new Date(stop.arrival_date) - tripStart) / (1000 * 60 * 60 * 24)) + 1;
                      const nights = Math.ceil((new Date(stop.departure_date) - new Date(stop.arrival_date)) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={stop.id} className="relative pl-16 pb-8">
                          {/* dot */}
                          <div className="absolute left-4 top-1 w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                          {/* day badge */}
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Day {arrivalDay}</span>
                            <span className="text-xs text-gray-500">{new Date(stop.arrival_date).toLocaleDateString()} — {new Date(stop.departure_date).toLocaleDateString()}</span>
                            <span className="text-xs text-gray-400">({nights} night{nights !== 1 ? 's' : ''})</span>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-blue-500" />
                                  <span>{stop.city_name}, {stop.city_country}</span>
                                </h4>
                                {stop.notes && <p className="text-sm text-gray-500 mt-1">{stop.notes}</p>}
                              </div>
                              <div className="text-right text-xs text-gray-500">
                                <div>🏨 ${stop.accommodation_cost}</div>
                                <div>🚌 ${stop.transport_cost}</div>
                              </div>
                            </div>
                            {stop.stop_activities?.length > 0 && (
                              <div className="space-y-1 mb-3">
                                {stop.stop_activities.map((a) => (
                                  <div key={a.id} className="flex justify-between text-xs bg-gray-50 rounded px-3 py-1.5">
                                    <span className="text-gray-700">{a.activity_name} <span className="text-gray-400">({a.activity_category})</span></span>
                                    <span className="text-green-600 font-medium">${a.activity_cost}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex space-x-3 text-sm">
                              <Link to={`/trips/${tripId}/stops/${stop.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                              <Link to={`/trips/${tripId}/stops/${stop.id}/activities`} className="text-green-600 hover:underline">Activities</Link>
                              <button onClick={() => handleDeleteStop(stop.id)} className="text-red-400 hover:text-red-600 hover:underline">Delete</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* End marker */}
                    <div className="relative pl-16">
                      <div className="absolute left-4 top-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm text-gray-500 font-medium">Trip ends · {new Date(trip.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Budget Summary */}
            {budget && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Budget Summary
                </h3>
                <div className="space-y-2">
                  {[
                    { label: 'Transport', val: budget.transport_cost },
                    { label: 'Accommodation', val: budget.accommodation_cost },
                    { label: 'Activities', val: budget.activity_cost },
                    { label: 'Meals', val: budget.meals_cost },
                    { label: 'Miscellaneous', val: budget.misc_cost },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-600">{label}</span>
                      <span>${val}</span>
                    </div>
                  ))}
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className={budget.over_budget ? 'text-red-600' : 'text-green-600'}>${budget.total_cost}</span>
                  </div>
                  {trip.total_budget > 0 && (
                    <div className="text-xs text-gray-500">Budget limit: ${trip.total_budget}</div>
                  )}
                  {budget.over_budget && (
                    <div className="text-xs text-red-600 font-medium">⚠ Over budget!</div>
                  )}
                </div>
                <Link to={`/trips/${tripId}/budget`} className="w-full btn-secondary text-center mt-4 block">
                  Manage Budget
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to={`/trips/${tripId}/packing`} className="w-full btn-secondary text-left flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Packing List
                </Link>
                <Link to={`/trips/${tripId}/notes`} className="w-full btn-secondary text-left flex items-center">
                  <StickyNote className="h-4 w-4 mr-2" />
                  Trip Notes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Extracted stop card for list view
function StopCard({ stop, index, tripId, onDelete }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{stop.city_name}, {stop.city_country}</h4>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(stop.arrival_date).toLocaleDateString()} — {new Date(stop.departure_date).toLocaleDateString()}
            </div>
            {stop.notes && <p className="text-sm text-gray-600 mt-2">{stop.notes}</p>}
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="text-right text-sm text-gray-600">
            <div>Accommodation: ${stop.accommodation_cost}</div>
            <div>Transport: ${stop.transport_cost}</div>
          </div>
          <button
            onClick={() => onDelete(stop.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete stop"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {stop.stop_activities?.length > 0 && (
        <div className="mt-4 pl-11">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Activities</h5>
          <div className="space-y-1">
            {stop.stop_activities.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">{a.activity_name}</span>
                  <span className="text-xs text-gray-500 ml-2">({a.activity_category})</span>
                </div>
                <span className="text-sm font-medium text-green-600">${a.activity_cost}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end space-x-3 mt-4 pl-11">
        <Link to={`/trips/${tripId}/stops/${stop.id}/edit`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</Link>
        <Link to={`/trips/${tripId}/stops/${stop.id}/activities`} className="text-green-600 hover:text-green-700 text-sm font-medium">Add Activity</Link>
      </div>
    </div>
  );
}

export default TripDetail;
