import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const CATEGORIES = [
  { key: 'transport_cost',      label: 'Transport',      color: '#3b82f6' },
  { key: 'accommodation_cost',  label: 'Accommodation',  color: '#8b5cf6' },
  { key: 'activity_cost',       label: 'Activities',     color: '#10b981' },
  { key: 'meals_cost',          label: 'Meals',          color: '#f59e0b' },
  { key: 'misc_cost',           label: 'Miscellaneous',  color: '#6b7280' },
];

// Pure CSS conic-gradient pie chart — no extra library
function PieChart({ data, total }) {
  if (total === 0) {
    return (
      <div className="w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }
  let cumulative = 0;
  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const pct = (d.value / total) * 100;
      const start = cumulative;
      cumulative += pct;
      return { ...d, start, end: cumulative };
    });

  const gradient = segments
    .map((s) => `${s.color} ${s.start.toFixed(1)}% ${s.end.toFixed(1)}%`)
    .join(', ');

  return (
    <div
      className="w-40 h-40 rounded-full mx-auto"
      style={{ background: `conic-gradient(${gradient})` }}
    />
  );
}

const Budget = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [formData, setFormData] = useState({
    transport_cost: '',
    accommodation_cost: '',
    activity_cost: '',
    meals_cost: '',
    misc_cost: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [tripRes, budgetRes] = await Promise.all([
          API.get(`/trips/${tripId}`),
          API.get(`/trips/${tripId}/budget`),
        ]);
        setTrip(tripRes.data);
        setFormData({
          transport_cost: budgetRes.data.transport_cost,
          accommodation_cost: budgetRes.data.accommodation_cost,
          activity_cost: budgetRes.data.activity_cost,
          meals_cost: budgetRes.data.meals_cost,
          misc_cost: budgetRes.data.misc_cost,
        });
      } catch {
        navigate(`/trips/${tripId}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await API.put(`/trips/${tripId}/budget`, {
        transport_cost: parseFloat(formData.transport_cost) || 0,
        accommodation_cost: parseFloat(formData.accommodation_cost) || 0,
        activity_cost: parseFloat(formData.activity_cost) || 0,
        meals_cost: parseFloat(formData.meals_cost) || 0,
        misc_cost: parseFloat(formData.misc_cost) || 0,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update budget');
    } finally {
      setSaving(false);
    }
  };

  const total = CATEGORIES.reduce((sum, c) => sum + (parseFloat(formData[c.key]) || 0), 0);
  const overBudget = trip?.total_budget > 0 && total > trip.total_budget;

  // cost per day
  const tripDays = trip
    ? Math.max(1, Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24)))
    : 1;
  const costPerDay = total / tripDays;

  const pieData = CATEGORIES.map((c) => ({
    label: c.label,
    color: c.color,
    value: parseFloat(formData[c.key]) || 0,
  }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={() => navigate(`/trips/${tripId}`)} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
            <p className="text-sm text-gray-600">{trip?.name}</p>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">Budget saved!</div>}

        {/* Over-budget alert */}
        {overBudget && (
          <div className="flex items-center space-x-3 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>You are <strong>${(total - trip.total_budget).toFixed(2)}</strong> over your budget limit of <strong>${trip.total_budget}</strong>.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-5">Edit Expenses</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {CATEGORIES.map(({ key, label, color }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
                    {label} ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number" min="0" step="0.01" className="input-field pl-8"
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    />
                  </div>
                </div>
              ))}

              <div className={`flex justify-between items-center p-4 rounded-lg border-2 mt-2 ${overBudget ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center space-x-2">
                  <DollarSign className={`h-5 w-5 ${overBudget ? 'text-red-600' : 'text-gray-600'}`} />
                  <span className="font-semibold text-gray-900">Total</span>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-bold ${overBudget ? 'text-red-600' : 'text-green-600'}`}>${total.toFixed(2)}</span>
                  {trip?.total_budget > 0 && <p className="text-xs text-gray-500">Limit: ${trip.total_budget}</p>}
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Saving...' : 'Save Budget'}
              </button>
            </form>
          </div>

          {/* Charts & Stats */}
          <div className="space-y-6">
            {/* Pie chart */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Breakdown</h2>
              <PieChart data={pieData} total={total} />
              <div className="mt-4 space-y-2">
                {CATEGORIES.map(({ key, label, color }) => {
                  const val = parseFloat(formData[key]) || 0;
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                  return (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-gray-700">{label}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-gray-600 w-16 text-right">${val.toFixed(0)} ({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>Cost per day</span>
                  </div>
                  <span className="font-semibold text-gray-900">${costPerDay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Trip duration</span>
                  <span className="font-semibold text-gray-900">{tripDays} days</span>
                </div>
                {trip?.total_budget > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Budget limit</span>
                      <span className="font-semibold text-gray-900">${trip.total_budget}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Remaining</span>
                      <span className={`font-semibold ${overBudget ? 'text-red-600' : 'text-green-600'}`}>
                        {overBudget ? '-' : ''}${Math.abs(trip.total_budget - total).toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Used</span>
                        <span>{Math.min(100, ((total / trip.total_budget) * 100)).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (total / trip.total_budget) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Budget;
