'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslations } from '../../hooks/useTranslations';
import { 
  FileText,
  Download,
  Eye,
  Filter,
  Search,
  Calendar,
  User,
  ChevronRight,
  FlaskConical,
  Scan,
  Stethoscope,
  Activity,
  ClipboardCheck
} from 'lucide-react';

interface Report {
  _id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  reportType: 'lab' | 'imaging' | 'diagnostic' | 'treatment' | 'follow-up';
  reportDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'reviewed';
  findings: string;
  diagnosis: string;
  recommendations: string;
  attachments?: string[];
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function PatientReportsPage() {
  const { data: session } = useSession();
  const { t } = useTranslations();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/patient-portal/reports');
        const data = await res.json();
        setReports(data.reports || []);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'reviewed': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'in-progress': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'lab': return FlaskConical;
      case 'imaging': return Scan;
      case 'diagnostic': return Stethoscope;
      case 'treatment': return Activity;
      case 'follow-up': return ClipboardCheck;
      default: return FileText;
    }
  };

  const getReportColor = (type: string) => {
    switch (type) {
      case 'lab': return 'bg-purple-100 text-purple-600';
      case 'imaging': return 'bg-blue-100 text-blue-600';
      case 'diagnostic': return 'bg-teal-100 text-teal-600';
      case 'treatment': return 'bg-green-100 text-green-600';
      case 'follow-up': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredReports = reports.filter(report => {
    // Filter by type
    if (filter !== 'all' && report.reportType !== filter) return false;
    
    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        report.doctorName.toLowerCase().includes(search) ||
        report.reportType.toLowerCase().includes(search) ||
        report.diagnosis.toLowerCase().includes(search) ||
        report.findings.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('patientPortal.reports.title')}</h1>
        <p className="text-gray-600 mt-1">{t('patientPortal.reports.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('patientPortal.reports.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
        >
          <option value="all">{t('patientPortal.reports.filter.all')}</option>
          <option value="lab">{t('patientPortal.reports.filter.lab')}</option>
          <option value="imaging">{t('patientPortal.reports.filter.imaging')}</option>
          <option value="diagnostic">{t('patientPortal.reports.filter.diagnostic')}</option>
          <option value="treatment">{t('patientPortal.reports.filter.treatment')}</option>
          <option value="follow-up">{t('patientPortal.reports.filter.followUp')}</option>
        </select>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => {
            const Icon = getReportIcon(report.reportType);
            return (
              <div
                key={report._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getReportColor(report.reportType)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 capitalize">
                            {report.reportType.replace('-', ' ')} Report
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">{report.doctorName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(report.priority)}`} title={report.priority} />
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {formatDate(report.reportDate)}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">{report.findings}</p>

                      <div className="mt-3 flex items-center gap-3">
                        <button className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium">
                          <Eye className="h-4 w-4" />
                          {t('patientPortal.reports.viewDetails')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{t('patientPortal.reports.noReports')}</h3>
            <p className="text-gray-500 mt-1">{t('patientPortal.reports.noReportsDesc')}</p>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 capitalize">
                  {selectedReport.reportType.replace('-', ' ')} Report
                </h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t('patientPortal.reports.doctor')}</p>
                  <p className="font-medium text-gray-900">{selectedReport.doctorName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('patientPortal.reports.date')}</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedReport.reportDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('patientPortal.reports.status')}</p>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status.replace('-', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('patientPortal.reports.priority')}</p>
                  <span className="capitalize font-medium text-gray-900">{selectedReport.priority}</span>
                </div>
              </div>

              {/* Findings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('patientPortal.reports.findings')}</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.findings}</p>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('patientPortal.reports.diagnosis')}</h3>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.diagnosis}</p>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('patientPortal.reports.recommendations')}</h3>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.recommendations}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedReport.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('patientPortal.reports.notes')}</h3>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
