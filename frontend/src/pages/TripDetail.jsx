import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Plus, Edit, Share2, DollarSign, Package, StickyNote, List, GitBranch, CheckCircle, Trash2, Users, Camera } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const TripDetail = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('timeline'); // 'list' | 'timeline'
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
  const tripEnd = new Date(trip.end_date);
  const totalDays = Math.ceil((tripEnd - tripStart) / (1000 * 60 * 60 * 24)) + 1;

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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-blue-600" />
                  About this trip
                </h3>
                <p className="text-gray-600 leading-relaxed">{trip.description}</p>
              </div>
            )}

            {/* Itinerary with view toggle */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Itinerary</h3>
                  <div className="flex items-center space-x-3">
                    {/* View toggle */}
                    <div className="flex bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => setView('list')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          view === 'list'
                            ? 'bg-white shadow-sm text-blue-600 scale-105'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <List className="h-4 w-4" />
                        <span>List</span>
                      </button>
                      <button
                        onClick={() => setView('timeline')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          view === 'timeline'
                            ? 'bg-white shadow-sm text-blue-600 scale-105'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <GitBranch className="h-4 w-4" />
                        <span>Timeline</span>
                      </button>
                    </div>
                    <Link
                      to={`/trips/${tripId}/stops/new`}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Stop</span>
                    </Link>
                  </div>
                </div>
              </div>

              {stops.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="h-10 w-10 text-gray-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">No stops added yet</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Start building your itinerary by adding destinations and activities to your trip.
                  </p>
                  <Link
                    to={`/trips/${tripId}/stops/new`}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Your First Stop
                  </Link>
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
                  <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-200 rounded-full" />
                  <div className="space-y-0">
                    {stops.map((stop, index) => {
                      const arrivalDay = Math.ceil((new Date(stop.arrival_date) - tripStart) / (1000 * 60 * 60 * 24)) + 1;
                      const departureDay = Math.ceil((new Date(stop.departure_date) - tripStart) / (1000 * 60 * 60 * 24)) + 1;
                      const nights = Math.ceil((new Date(stop.departure_date) - new Date(stop.arrival_date)) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={stop.id} className="relative pl-20 pb-8">
                          {/* dot */}
                          <div className="absolute left-4 top-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">{index + 1}</span>
                          </div>
                          {/* day badge */}
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                              Day {arrivalDay}{departureDay !== arrivalDay ? `-${departureDay}` : ''}
                            </span>
                            <span className="text-sm text-gray-600">
                              {new Date(stop.arrival_date).toLocaleDateString()} — {new Date(stop.departure_date).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {nights} night{nights !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 flex items-center space-x-2 mb-2">
                                  <MapPin className="h-5 w-5 text-blue-500" />
                                  <span className="text-lg">{stop.city_name}, {stop.city_country}</span>
                                </h4>
                                {stop.notes && (
                                  <p className="text-gray-600 text-sm leading-relaxed">{stop.notes}</p>
                                )}
                              </div>
                              <div className="text-right space-y-1">
                                <div className="flex items-center space-x-1 text-sm">
                                  <span className="text-gray-500">🏨</span>
                                  <span className="font-medium text-gray-900">${stop.accommodation_cost}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-sm">
                                  <span className="text-gray-500">🚌</span>
                                  <span className="font-medium text-gray-900">${stop.transport_cost}</span>
                                </div>
                              </div>
                            </div>
                            {stop.stop_activities?.length > 0 && (
                              <div className="space-y-2 mb-4">
                                <h5 className="text-sm font-medium text-gray-900 flex items-center">
                                  <Camera className="h-4 w-4 mr-1" />
                                  Activities
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {stop.stop_activities.map((a) => (
                                    <div key={a.id} className="flex justify-between items-center bg-gradient-to-r from-green-50 to-blue-50 rounded-lg px-3 py-2 border border-green-100">
                                      <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-900">{a.activity_name}</span>
                                        <span className="text-xs text-gray-500 ml-2">({a.activity_category})</span>
                                      </div>
                                      <span className="text-sm font-semibold text-green-600">${a.activity_cost}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex space-x-4 text-sm border-t border-gray-100 pt-4">
                              <Link
                                to={`/trips/${tripId}/stops/${stop.id}/edit`}
                                className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Edit</span>
                              </Link>
                              <Link
                                to={`/trips/${tripId}/stops/${stop.id}/activities`}
                                className="text-green-600 hover:text-green-700 font-medium flex items-center space-x-1"
                              >
                                <Plus className="h-4 w-4" />
                                <span>Activities</span>
                              </Link>
                              <button
                                onClick={() => handleDeleteStop(stop.id)}
                                className="text-red-500 hover:text-red-700 font-medium flex items-center space-x-1"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* End marker */}
                    <div className="relative pl-20">
                      <div className="absolute left-4 top-1 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm inline-block">
                        <span className="text-sm font-medium text-gray-700">
                          Trip ends · {new Date(trip.end_date).toLocaleDateString()}
                        </span>
                      </div>
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  Budget Summary
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Transport', val: budget.transport_cost, icon: '🚌' },
                    { label: 'Accommodation', val: budget.accommodation_cost, icon: '🏨' },
                    { label: 'Activities', val: budget.activity_cost, icon: '🎯' },
                    { label: 'Meals', val: budget.meals_cost, icon: '🍽️' },
                    { label: 'Miscellaneous', val: budget.misc_cost, icon: '🛍️' },
                  ].map(({ label, val, icon }) => (
                    <div key={label} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center">
                        <span className="mr-2">{icon}</span>
                        {label}
                      </span>
                      <span className="font-medium">${val}</span>
                    </div>
                  ))}
                  <hr className="my-3 border-gray-200" />
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total</span>
                    <span className={budget.over_budget ? 'text-red-600' : 'text-green-600'}>
                      ${budget.total_cost}
                    </span>
                  </div>
                  {trip.total_budget > 0 && (
                    <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                      Budget limit: ${trip.total_budget}
                    </div>
                  )}
                  {budget.over_budget && (
                    <div className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                      ⚠ Over budget by ${budget.total_cost - trip.total_budget}!
                    </div>
                  )}
                </div>
                <Link
                  to={`/trips/${tripId}/budget`}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white text-center mt-4 py-3 rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all block"
                >
                  Manage Budget
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-purple-600" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to={`/trips/${tripId}/packing`}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white text-left py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all flex items-center"
                >
                  <Package className="h-4 w-4 mr-3" />
                  Packing List
                </Link>
                <Link
                  to={`/trips/${tripId}/notes`}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-left py-3 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center"
                >
                  <StickyNote className="h-4 w-4 mr-3" />
                  Trip Notes
                </Link>
              </div>
            </div>

            {/* Trip Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Trip Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Stops</span>
                  <span className="font-semibold text-gray-900">{stops.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Activities</span>
                  <span className="font-semibold text-gray-900">
                    {stops.reduce((sum, stop) => sum + (stop.stop_activities?.length || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold text-gray-900">{totalDays} days</span>
                </div>
                {budget && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg. Daily Cost</span>
                    <span className="font-semibold text-gray-900">
                      ${Math.round(budget.total_cost / totalDays)}
                    </span>
                  </div>
                )}
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
    <div className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all hover:border-blue-200 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-white text-lg font-bold">{index + 1}</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-lg mb-2">{stop.city_name}, {stop.city_country}</h4>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              {new Date(stop.arrival_date).toLocaleDateString()} — {new Date(stop.departure_date).toLocaleDateString()}
            </div>
            {stop.notes && <p className="text-gray-600 text-sm leading-relaxed">{stop.notes}</p>}
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <div className="text-right space-y-1">
            <div className="flex items-center space-x-1 text-sm">
              <span className="text-gray-500">🏨</span>
              <span className="font-medium text-gray-900">${stop.accommodation_cost}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm">
              <span className="text-gray-500">🚌</span>
              <span className="font-medium text-gray-900">${stop.transport_cost}</span>
            </div>
          </div>
          <button
            onClick={() => onDelete(stop.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Delete stop"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {stop.stop_activities?.length > 0 && (
        <div className="mt-6">
          <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Camera className="h-4 w-4 mr-1" />
            Activities
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stop.stop_activities.map((a) => (
              <div key={a.id} className="flex justify-between items-center bg-gradient-to-r from-green-50 to-blue-50 rounded-lg px-4 py-3 border border-green-100">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{a.activity_name}</span>
                  <span className="text-xs text-gray-500 ml-2">({a.activity_category})</span>
                </div>
                <span className="text-sm font-semibold text-green-600">${a.activity_cost}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-100">
        <Link
          to={`/trips/${tripId}/stops/${stop.id}/edit`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
        >
          <Edit className="h-4 w-4" />
          <span>Edit</span>
        </Link>
        <Link
          to={`/trips/${tripId}/stops/${stop.id}/activities`}
          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center space-x-1"
        >
          <Plus className="h-4 w-4" />
          <span>Add Activity</span>
        </Link>
      </div>
    </div>
  );
}

export default TripDetail;
