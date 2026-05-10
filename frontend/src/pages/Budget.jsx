import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, AlertTriangle, TrendingUp, CheckCircle, X } from 'lucide-react';
import API from '../services/api';
import Navbar from '../components/Navbar';

const CATEGORIES = [
  { key: 'transport_cost',     label: 'Transport',     color: '#3b82f6', bg: 'bg-blue-500',   icon: '🚌' },
  { key: 'accommodation_cost', label: 'Accommodation', color: '#8b5cf6', bg: 'bg-violet-500', icon: '🏨' },
  { key: 'activity_cost',      label: 'Activities',    color: '#10b981', bg: 'bg-emerald-500',icon: '🎯' },
  { key: 'meals_cost',         label: 'Meals',         color: '#f59e0b', bg: 'bg-amber-500',  icon: '🍽️' },
  { key: 'misc_cost',          label: 'Miscellaneous', color: '#6b7280', bg: 'bg-gray-500',   icon: '🛍️' },
];

// Pure CSS conic-gradient pie chart
function PieChart({ data, total }) {
  if (total === 0) return (
    <div className="w-44 h-44 rounded-full bg-gray-100 flex flex-col items-center justify-center mx-auto">
      <span className="text-xs text-gray-400">No data yet</span>
    </div>
  );
  let cum = 0;
  const segs = data.filter(d => d.value > 0).map(d => {
    const pct = (d.value / total) * 100;
    const start = cum; cum += pct;
    return { ...d, start, end: cum };
  });
  const gradient = segs.map(s => `${s.color} ${s.start.toFixed(1)}% ${s.end.toFixed(1)}%`).join(', ');
  return (
    <div className="relative w-44 h-44 mx-auto">
      <div className="w-44 h-44 rounded-full" style={{ background: `conic-gradient(${gradient})` }} />
      {/* Center hole */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
          <span className="text-xs text-gray-400">Total</span>
          <span className="text-sm font-bold text-gray-900">${total.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}

// Horizontal bar chart
function BarChart({ data, total }) {
  if (total === 0) return (
    <div className="text-center py-6 text-gray-400 text-sm">No data yet</div>
  );
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map(d => (
        <div key={d.label}>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span className="flex items-center gap-1.5">
              <span>{d.icon}</span>{d.label}
            </span>
            <span className="font-semibold">${d.value.toFixed(0)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="h-3 rounded-full transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const Budget = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip]       = useState(null);
  const [formData, setFormData] = useState({ transport_cost: '', accommodation_cost: '', activity_cost: '', meals_cost: '', misc_cost: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [chartView, setChartView] = useState('pie'); // 'pie' | 'bar'

  useEffect(() => {
    Promise.all([API.get(`/trips/${tripId}`), API.get(`/trips/${tripId}/budget`)])
      .then(([tripRes, budgetRes]) => {
        setTrip(tripRes.data);
        setFormData({
          transport_cost:     budgetRes.data.transport_cost,
          accommodation_cost: budgetRes.data.accommodation_cost,
          activity_cost:      budgetRes.data.activity_cost,
          meals_cost:         budgetRes.data.meals_cost,
          misc_cost:          budgetRes.data.misc_cost,
        });
      })
      .catch(() => navigate(`/trips/${tripId}`))
      .finally(() => setLoading(false));
  }, [tripId, navigate]);

  const validate = () => {
    const errs = {};
    CATEGORIES.forEach(({ key, label }) => {
      const val = parseFloat(formData[key]);
      if (formData[key] !== '' && (isNaN(val) || val < 0))
        errs[key] = `${label} cannot be negative`;
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setError(''); setSuccess(false);
    try {
      await API.put(`/trips/${tripId}/budget`, {
        transport_cost:     parseFloat(formData.transport_cost)     || 0,
        accommodation_cost: parseFloat(formData.accommodation_cost) || 0,
        activity_cost:      parseFloat(formData.activity_cost)      || 0,
        meals_cost:         parseFloat(formData.meals_cost)         || 0,
        misc_cost:          parseFloat(formData.misc_cost)          || 0,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update budget');
    } finally { setSaving(false); }
  };

  const total      = CATEGORIES.reduce((s, c) => s + (parseFloat(formData[c.key]) || 0), 0);
  const overBudget = trip?.total_budget > 0 && total > trip.total_budget;
  const tripDays   = trip ? Math.max(1, Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / 86400000)) : 1;
  const costPerDay = total / tripDays;
  const remaining  = trip?.total_budget > 0 ? trip.total_budget - total : null;
  const usedPct    = trip?.total_budget > 0 ? Math.min(100, (total / trip.total_budget) * 100) : 0;

  const chartData = CATEGORIES.map(c => ({
    label: c.label, color: c.color, icon: c.icon,
    value: parseFloat(formData[c.key]) || 0,
  }));

  if (loading) return (
    <div className="min-h-screen bg-slate-50"><Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="page-container max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(`/trips/${tripId}`)}
            className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="page-title">Budget & Cost Breakdown</h1>
            <p className="text-sm text-gray-500 mt-0.5">{trip?.name}</p>
          </div>
        </div>

        {/* Over-budget alert */}
        {overBudget && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Over Budget!</p>
              <p className="text-xs text-red-600">
                You are <strong>${(total - trip.total_budget).toFixed(2)}</strong> over your limit of <strong>${trip.total_budget}</strong>.
              </p>
            </div>
          </div>
        )}

        {error && <div className="alert-error mb-4 flex items-center gap-2"><X className="h-4 w-4 shrink-0" />{error}</div>}
        {success && <div className="alert-success mb-4 flex items-center gap-2"><CheckCircle className="h-4 w-4 shrink-0" />Budget saved successfully!</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left — Edit form */}
          <div className="card">
            <h2 className="section-title mb-5">Edit Expenses</h2>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {CATEGORIES.map(({ key, label, color, icon }) => (
                <div key={key}>
                  <label className="input-label">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      {icon} {label}
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                    <input type="number" min="0" step="0.01"
                      className={`input-field pl-8 ${fieldErrors[key] ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="0.00"
                      value={formData[key]}
                      onChange={e => {
                        setFormData(p => ({ ...p, [key]: e.target.value }));
                        if (fieldErrors[key]) setFieldErrors(p => ({ ...p, [key]: '' }));
                      }} />
                  </div>
                  {fieldErrors[key] && <p className="text-xs text-red-500 mt-1">{fieldErrors[key]}</p>}
                </div>
              ))}

              {/* Total row */}
              <div className={`flex justify-between items-center p-4 rounded-xl border-2 ${overBudget ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <DollarSign className={`h-5 w-5 ${overBudget ? 'text-red-600' : 'text-gray-600'}`} />
                  <span className="font-semibold text-gray-900">Total</span>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-bold ${overBudget ? 'text-red-600' : 'text-green-600'}`}>
                    ${total.toFixed(2)}
                  </span>
                  {trip?.total_budget > 0 && (
                    <p className="text-xs text-gray-500">Limit: ${trip.total_budget}</p>
                  )}
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : 'Save Budget'}
              </button>
            </form>
          </div>

          {/* Right — Charts + Stats */}
          <div className="space-y-5">

            {/* Chart toggle + chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title">Cost Breakdown</h2>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {['pie', 'bar'].map(v => (
                    <button key={v} onClick={() => setChartView(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize
                        ${chartView === v ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      {v} chart
                    </button>
                  ))}
                </div>
              </div>

              {chartView === 'pie' ? (
                <>
                  <PieChart data={chartData} total={total} />
                  <div className="mt-5 space-y-2">
                    {CATEGORIES.map(({ key, label, color, icon }) => {
                      const val = parseFloat(formData[key]) || 0;
                      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                      return (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-gray-700">{icon} {label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-20 bg-gray-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                            <span className="text-gray-600 text-xs w-20 text-right">
                              ${val.toFixed(0)} ({pct}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <BarChart data={chartData} total={total} />
              )}
            </div>

            {/* Stats card */}
            <div className="card">
              <h2 className="section-title mb-4">Trip Stats</h2>
              <div className="space-y-3">
                {[
                  { label: 'Trip duration',   value: `${tripDays} days` },
                  { label: 'Avg. cost / day', value: `$${costPerDay.toFixed(2)}`, highlight: true },
                  { label: 'Total spent',     value: `$${total.toFixed(2)}` },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />{label}
                    </span>
                    <span className={`font-semibold text-sm ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>{value}</span>
                  </div>
                ))}

                {/* Budget limit section */}
                {trip?.total_budget > 0 && (
                  <>
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                      <span className="text-sm text-gray-500">Budget limit</span>
                      <span className="font-semibold text-sm text-gray-900">${trip.total_budget}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-sm text-gray-500">Remaining</span>
                      <span className={`font-semibold text-sm ${overBudget ? 'text-red-600' : 'text-green-600'}`}>
                        {overBudget ? '-' : '+'}${Math.abs(remaining).toFixed(2)}
                      </span>
                    </div>

                    {/* Budget progress bar */}
                    <div className="pt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span>Budget used</span>
                        <span className={overBudget ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                          {usedPct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div className={`h-3 rounded-full transition-all duration-500 ${overBudget ? 'bg-red-500' : usedPct > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${usedPct}%` }} />
                      </div>
                      {/* Over-budget day alert */}
                      {overBudget && (
                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Avg. daily overspend: ${((total - trip.total_budget) / tripDays).toFixed(2)}/day
                        </p>
                      )}
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
