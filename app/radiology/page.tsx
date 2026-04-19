'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/app/protected-route';
import SidebarLayout from '@/app/components/sidebar-layout';
import { useTranslations } from '@/app/hooks/useTranslations';
import { Radio, Plus, Search, Eye, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';

interface RadiologyStudy {
  _id: string;
  studyNumber: string;
  patientName: string;
  studyType: string;
  bodyPart: string;
  studyDescription: string;
  priority: string;
  status: string;
  isCritical: boolean;
  scheduledDate?: string;
  performedDate?: string;
  createdAt: string;
  radiologistName?: string;
  referringDoctorName?: string;
}

export default function RadiologyPage() {
  const { t, translationsLoaded } = useTranslations();
  const [studies, setStudies] = useState<RadiologyStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => { fetchStudies(); }, [filterStatus, filterType, filterPriority]);

  const fetchStudies = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('studyType', filterType);
      if (filterPriority) params.append('priority', filterPriority);

      const response = await fetch(`/api/radiology?${params}`);
      if (response.ok) setStudies(await response.json());
    } catch (error) {
      console.error('Error fetching studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudies = studies.filter(s =>
    s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.bodyPart.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'ordered': 'bg-gray-100 text-gray-800',
      'scheduled': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-purple-100 text-purple-800',
      'reported': 'bg-green-100 text-green-800',
      'verified': 'bg-emerald-100 text-emerald-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'routine': 'bg-green-100 text-green-800',
      'urgent': 'bg-orange-100 text-orange-800',
      'stat': 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStudyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'x-ray': 'X-Ray', 'ct-scan': 'CT Scan', 'mri': 'MRI', 'ultrasound': 'Ultrasound',
      'mammography': 'Mammography', 'fluoroscopy': 'Fluoroscopy', 'pet-scan': 'PET Scan',
      'dexa-scan': 'DEXA Scan', 'other': 'Other',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // Stats
  const pendingStudies = studies.filter(s => ['ordered', 'scheduled'].includes(s.status)).length;
  const inProgressStudies = studies.filter(s => s.status === 'in-progress').length;
  const pendingReports = studies.filter(s => s.status === 'completed').length;
  const criticalStudies = studies.filter(s => s.isCritical).length;

  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('radiology.title')} description="">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('radiology.title')} description={t('radiology.description')}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder={t('radiology.searchStudies')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">{t('radiology.allStatuses')}</option>
                  <option value="ordered">{t('radiology.statusLabels.ordered')}</option>
                  <option value="scheduled">{t('radiology.statusLabels.scheduled')}</option>
                  <option value="in-progress">{t('radiology.statusLabels.in-progress')}</option>
                  <option value="completed">{t('radiology.statusLabels.completed')}</option>
                  <option value="reported">{t('radiology.statusLabels.reported')}</option>
                  <option value="verified">{t('radiology.statusLabels.verified')}</option>
                </select>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">{t('radiology.allTypes')}</option>
                  <option value="x-ray">X-Ray</option>
                  <option value="ct-scan">CT Scan</option>
                  <option value="mri">MRI</option>
                  <option value="ultrasound">Ultrasound</option>
                </select>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">{t('radiology.allPriorities')}</option>
                  <option value="routine">{t('radiology.priorityLabels.routine')}</option>
                  <option value="urgent">{t('radiology.priorityLabels.urgent')}</option>
                  <option value="stat">{t('radiology.priorityLabels.stat')}</option>
                </select>
              </div>
            </div>
            <Link href="/radiology/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="h-5 w-5" /><span>{t('radiology.newStudy')}</span>
            </Link>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><Clock className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-sm text-gray-500">{t('radiology.pendingStudies')}</p><p className="text-2xl font-bold">{pendingStudies}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center"><Radio className="h-5 w-5 text-yellow-600" /></div>
                <div><p className="text-sm text-gray-500">{t('radiology.inProgress')}</p><p className="text-2xl font-bold">{inProgressStudies}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"><FileText className="h-5 w-5 text-purple-600" /></div>
                <div><p className="text-sm text-gray-500">{t('radiology.pendingReports')}</p><p className="text-2xl font-bold">{pendingReports}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
                <div><p className="text-sm text-gray-500">{t('radiology.criticalFindings')}</p><p className="text-2xl font-bold">{criticalStudies}</p></div>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : filteredStudies.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <Radio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('radiology.noStudies')}</h3>
              <p className="text-gray-500 mb-4">{t('radiology.noStudiesDescription')}</p>
              <Link href="/radiology/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-5 w-5" /><span>{t('radiology.newStudy')}</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('radiology.studyNumber')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('radiology.patient')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('radiology.studyType')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('radiology.bodyPart')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('radiology.priority')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('radiology.status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('radiology.date')}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudies.map((study) => (
                      <tr key={study._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {study.isCritical && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            <span className="text-sm font-medium">{study.studyNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{study.patientName}</td>
                        <td className="px-6 py-4 text-sm">{getStudyTypeLabel(study.studyType)}</td>
                        <td className="px-6 py-4 text-sm">{study.bodyPart}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(study.priority)}`}>
                            {t(`radiology.priorityLabels.${study.priority}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(study.status)}`}>
                            {t(`radiology.statusLabels.${study.status}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(study.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/radiology/${study._id}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Eye className="h-4 w-4" /><span>{t('common.view')}</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
