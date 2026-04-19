'use client';

import { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  Users,
  Award,
  BarChart3,
  Filter,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import { useTranslations } from '../../hooks/useTranslations';

export default function PerformanceReportsPage() {
  const { t, translationsLoaded } = useTranslations();
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [showReports, setShowReports] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/performance?dateRange=${dateRange}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching performance analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const topDoctorsChartData = Array.isArray(data?.doctorPerformance)
    ? data.doctorPerformance.map((d: any) => ({
        name: d.doctorName,
        appointments: d.appointments || 0,
        reports: d.reports || 0,
        efficiency: d.efficiency || 0,
      }))
    : [];

  const handleExport = () => {
    if (!data) return;
    const rows: any[][] = [
      ['Metric', 'Value'],
      ['Total Doctors', data.totalDoctors ?? 0],
      ['Total Appointments', data.totalAppointments ?? 0],
      ['Total Reports', data.totalReports ?? 0],
      ['Avg Appointments/Doctor', data.averageAppointments ?? 0],
      ['Avg Reports/Doctor', data.averageReports ?? 0],
      [],
      ['Activity Trend'],
      ['Label', 'Appointments', 'Reports'],
      ...(Array.isArray(data.activityTrend) ? data.activityTrend.map((p: any) => [p.label, p.appointments ?? 0, p.reports ?? 0]) : []),
      [],
      ['Top Doctors'],
      ['Doctor', 'Appointments', 'Reports', 'Efficiency'],
      ...topDoctorsChartData.map((d: any) => [d.name, d.appointments, d.reports, d.efficiency]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-analytics-${dateRange}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('navigation.performanceReports')} description="">
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
        title={t('navigation.performanceReports')}
        description="Performance metrics, doctor productivity, and staff efficiency"
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
                onClick={() => setShowReports((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-5 w-5" />
                <span>{showReports ? 'Show Reports' : 'Show Appointments'}</span>
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

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Doctor Performance</p>
              <p className="text-2xl font-bold text-gray-900">{data?.totalDoctors || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Total doctors</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Staff Productivity</p>
              <p className="text-2xl font-bold text-gray-900">{data?.totalAppointments || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Total appointments</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Efficiency Rate</p>
              <p className="text-2xl font-bold text-gray-900">{data?.averageAppointments?.toFixed(1) || '0'}</p>
              <p className="text-xs text-gray-500 mt-1">Avg appointments per doctor</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Patient Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">{data?.totalReports || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Total reports generated</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctor Performance Trend</h3>
              <div className="h-64">
                {topDoctorsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topDoctorsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      {showReports ? (
                        <Bar dataKey="reports" name="Reports" fill="#8b5cf6" />
                      ) : (
                        <Bar dataKey="appointments" name="Appointments" fill="#2563eb" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p>No doctor performance data</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Productivity</h3>
              <div className="h-64">
                {Array.isArray(data?.activityTrend) && data.activityTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.activityTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="appointments" name="Appointments" stroke="#2563eb" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="reports" name="Reports" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Target className="h-12 w-12 mx-auto mb-2" />
                      <p>No activity trend data</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Reports</h3>
            {topDoctorsChartData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Doctor</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Appointments</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Reports</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topDoctorsChartData.map((d: any) => (
                      <tr key={d.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{d.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{d.appointments}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{d.reports}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{d.efficiency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No performance data found</p>
              </div>
            )}
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
