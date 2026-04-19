'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  TrendingUp,
  Calendar,
  MapPin,
  BarChart3,
  Filter,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import { useTranslations } from '../../hooks/useTranslations';

export default function PatientAnalyticsPage() {
  const { t, translationsLoaded } = useTranslations();
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [showGender, setShowGender] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/patient?dateRange=${dateRange}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error('Error fetching patient analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#64748b'];

  const ageChartData = Object.entries(data?.ageGroups || {}).map(([name, value]) => ({
    name,
    value: typeof value === 'number' ? value : Number(value || 0),
  }));
  const genderChartData = Object.entries(data?.genderDistribution || {}).map(([name, value]) => ({
    name,
    value: typeof value === 'number' ? value : Number(value || 0),
  }));

  const handleExport = () => {
    if (!data) return;
    const rows: any[][] = [
      ['Metric', 'Value'],
      ['Total Patients', data.totalPatients ?? 0],
      ['Active Patients', data.activePatients ?? 0],
      ['Average Visits (per patient)', data.averageVisits ?? 0],
      ['Satisfaction Rate (%)', data.satisfactionRate ?? 0],
      [],
      ['Patient Trend'],
      ['Label', 'Visits', 'New Patients'],
      ...(Array.isArray(data.patientTrend) ? data.patientTrend.map((p: any) => [p.label, p.visits ?? 0, p.newPatients ?? 0]) : []),
      [],
      ['Age Groups'],
      ['Group', 'Count'],
      ...ageChartData.map((p: any) => [p.name, p.value]),
      [],
      ['Gender'],
      ['Gender', 'Count'],
      ...genderChartData.map((p: any) => [p.name, p.value]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-analytics-${dateRange}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('navigation.patientAnalytics')} description="">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout
        title={t('navigation.patientAnalytics')}
        description="Patient demographics, visit patterns, and satisfaction metrics"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowGender((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-5 w-5" />
                <span>{showGender ? 'Gender' : 'Filter'}</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </div>
          )}

          {/* Patient Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{data?.totalPatients ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">{data?.activePatients ?? 0} active in range</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Average Visits</p>
              <p className="text-2xl font-bold text-gray-900">{(Number(data?.averageVisits || 0)).toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">Visits per patient (active)</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Demographics</p>
              <p className="text-2xl font-bold text-gray-900">{ageChartData.length}</p>
              <p className="text-xs text-gray-500 mt-1">{showGender ? 'Gender groups' : 'Age groups'}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Satisfaction Rate</p>
              <p className="text-2xl font-bold text-gray-900">{(Number(data?.satisfactionRate || 0)).toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">Based on completed visits</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Demographics</h3>
              <div className="h-64">
                {(showGender ? genderChartData : ageChartData).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Tooltip />
                      <Legend />
                      <Pie data={showGender ? genderChartData : ageChartData} dataKey="value" nameKey="name" outerRadius={90} label>
                        {(showGender ? genderChartData : ageChartData).map((_: any, idx: number) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p>No demographics data</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Patterns</h3>
              <div className="h-64">
                {Array.isArray(data?.patientTrend) && data.patientTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.patientTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="visits" name="Visits" stroke="#2563eb" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="newPatients" name="New Patients" stroke="#16a34a" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-2" />
                      <p>No visit trend data</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analytics Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Analytics</h3>
            {Array.isArray(data?.recentPatients) && data.recentPatients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Patient</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Gender</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Age</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.recentPatients.map((p: any) => (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{p.name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{p.email || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{p.gender || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{p.age ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No patients found</p>
              </div>
            )}
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
