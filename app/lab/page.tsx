'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FlaskConical,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TestTube
} from 'lucide-react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';

function LabTestsContent() {
  const { t, translationsLoaded } = useTranslations();
  const searchParams = useSearchParams();
  const [labTests, setLabTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Update statusFilter when URL search params change (e.g., when clicking menu items)
  useEffect(() => {
    const statusFromUrl = searchParams.get('status') || 'all';
    if (statusFromUrl !== statusFilter) {
      setStatusFilter(statusFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchLabTests();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/lab?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLabTests(data.labTests || []);
      }
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchLabTests();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sample-collected':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'sample-collected':
        return <TestTube className="h-4 w-4" />;
      case 'in-progress':
        return <FlaskConical className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      case 'routine':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lab test?')) return;

    try {
      const response = await fetch(`/api/lab/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchLabTests();
      }
    } catch (error) {
      console.error('Error deleting lab test:', error);
    }
  };

  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('lab.title')} description="">
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
        title={t('lab.title')}
        description={t('lab.description')}
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                {labTests.length} {t('lab.tests').toLowerCase()}
              </span>
            </div>
            <Link
              href="/lab/new"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{t('lab.newTestOrder')}</span>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('lab.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('lab.allStatuses')}</option>
                  <option value="pending">{t('lab.statusLabels.pending')}</option>
                  <option value="sample-collected">{t('lab.statusLabels.sample-collected')}</option>
                  <option value="in-progress">{t('lab.statusLabels.in-progress')}</option>
                  <option value="completed">{t('lab.statusLabels.completed')}</option>
                  <option value="cancelled">{t('lab.statusLabels.cancelled')}</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('lab.allPriorities')}</option>
                  <option value="routine">{t('lab.priorityLabels.routine')}</option>
                  <option value="urgent">{t('lab.priorityLabels.urgent')}</option>
                  <option value="stat">{t('lab.priorityLabels.stat')}</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('lab.allCategories')}</option>
                  <option value="hematology">{t('lab.categoryLabels.hematology')}</option>
                  <option value="biochemistry">{t('lab.categoryLabels.biochemistry')}</option>
                  <option value="microbiology">{t('lab.categoryLabels.microbiology')}</option>
                  <option value="immunology">{t('lab.categoryLabels.immunology')}</option>
                  <option value="pathology">{t('lab.categoryLabels.pathology')}</option>
                  <option value="urinalysis">{t('lab.categoryLabels.urinalysis')}</option>
                  <option value="other">{t('lab.categoryLabels.other')}</option>
                </select>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Lab Tests Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">{t('common.loading')}</p>
              </div>
            ) : labTests.length === 0 ? (
              <div className="text-center py-12">
                <FlaskConical className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('lab.noTests')}</h3>
                <p className="text-gray-600 mb-4">{t('lab.noTestsDesc')}</p>
                <Link
                  href="/lab/new"
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t('lab.newTestOrder')}</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('lab.testNumber')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('lab.patient')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('lab.testType')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('lab.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('lab.priority')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('lab.orderedDate')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('lab.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {labTests.map((test) => (
                      <tr
                        key={test._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => window.location.href = `/lab/${test._id}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                              <FlaskConical className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {test.testNumber}
                              </div>
                              {test.isCritical && (
                                <div className="flex items-center text-xs text-red-600">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Critical
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {test.patientName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {test.patientEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{test.testType}</div>
                          <div className="text-xs text-gray-500">
                            {t(`lab.categoryLabels.${test.testCategory}`)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              test.status
                            )}`}
                          >
                            {getStatusIcon(test.status)}
                            {t(`lab.statusLabels.${test.status}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                              test.priority
                            )}`}
                          >
                            {t(`lab.priorityLabels.${test.priority}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(test.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/lab/${test._id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {test.status !== 'completed' && test.status !== 'cancelled' && (
                              <Link
                                href={`/lab/${test._id}/results`}
                                className="text-green-600 hover:text-green-900"
                                title="Enter Results"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                            )}
                            <button
                              onClick={() => handleDelete(test._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

export default function LabTestsPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <SidebarLayout title="" description="">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    }>
      <LabTestsContent />
    </Suspense>
  );
}
