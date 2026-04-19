'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FlaskConical,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Printer,
  Edit,
  TestTube,
  XCircle
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import { useTranslations } from '../../hooks/useTranslations';

export default function LabTestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, translationsLoaded } = useTranslations();
  const [labTest, setLabTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchLabTest();
    }
  }, [params.id]);

  const fetchLabTest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lab/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setLabTest(data.labTest);
      }
    } catch (error) {
      console.error('Error fetching lab test:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'sample-collected') {
        updateData.sampleCollectedAt = new Date();
      }

      const response = await fetch(`/api/lab/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        fetchLabTest();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getResultStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600';
      case 'abnormal':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600 font-bold';
      default:
        return 'text-gray-600';
    }
  };

  if (!translationsLoaded || loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('lab.testDetails')} description="">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  if (!labTest) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('lab.testDetails')} description="">
          <div className="text-center py-12">
            <FlaskConical className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('lab.testNotFound')}</p>
            <Link
              href="/lab"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              {t('common.back')} {t('lab.toLabTests')}
            </Link>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout
        title={t('lab.testDetails')}
        description={labTest.testNumber}
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between no-print">
            <Link
              href="/lab"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{t('common.back')}</span>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-5 w-5" />
                <span>{t('lab.printReport')}</span>
              </button>
              {labTest.status !== 'completed' && labTest.status !== 'cancelled' && (
                <Link
                  href={`/lab/${params.id}/results`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-5 w-5" />
                  <span>{t('lab.enterResults')}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Test Header - Lab Report Document */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lab-report-document print:block print:p-0">
            {/* Professional Letterhead - Print Only */}
            <div className="hidden print:block print:mb-4 print:pb-3 print:border-b-2 print:border-gray-900 print:page-break-inside-avoid">
              <div className="text-center mb-3">
                <h1 className="text-2xl font-bold mb-1 tracking-wide">LABORATORY REPORT</h1>
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold">Medical Laboratory Services</p>
                  <p>Authorized Diagnostic Center</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-gray-400">
                <div>
                  <p className="font-semibold">Report Number:</p>
                  <p>{labTest.testNumber}</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">Date:</p>
                  <p>{formatDate(labTest.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Status:</p>
                  <p className="uppercase">{t(`lab.statusLabels.${labTest.status}`)}</p>
                </div>
              </div>
            </div>

            {/* Screen View Header */}
            <div className="print:hidden flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <FlaskConical className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {labTest.testNumber}
                    </h2>
                    <p className="text-gray-600">{labTest.testType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      labTest.status
                    )}`}
                  >
                    {t(`lab.statusLabels.${labTest.status}`)}
                  </span>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                      labTest.priority
                    )}`}
                  >
                    {t(`lab.priorityLabels.${labTest.priority}`)}
                  </span>
                  {labTest.isCritical && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      {t('lab.criticalValueAlert')}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{t('lab.orderedDate')}</p>
                <p className="text-lg font-medium text-gray-900">
                  {formatDate(labTest.createdAt)}
                </p>
              </div>
            </div>

            {/* Status Actions */}
            {labTest.status !== 'completed' && labTest.status !== 'cancelled' && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg no-print">
                <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
                {labTest.status === 'pending' && (
                  <button
                    onClick={() => updateStatus('sample-collected')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    <TestTube className="h-4 w-4" />
                    {t('lab.collectSample')}
                  </button>
                )}
                {labTest.status === 'sample-collected' && (
                  <button
                    onClick={() => updateStatus('in-progress')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                  >
                    <FlaskConical className="h-4 w-4" />
                    {t('lab.startProcessing')}
                  </button>
                )}
                {labTest.status === 'in-progress' && (
                  <Link
                    href={`/lab/${params.id}/results`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {t('lab.enterResults')}
                  </Link>
                )}
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this test?')) {
                      updateStatus('cancelled');
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  {t('lab.cancelTest')}
                </button>
              </div>
            )}

            {/* Patient Information */}
            <div className="border-t border-gray-200 pt-6 mb-6 print:border-t print:border-gray-900 print:pt-3 print:mb-3 print:page-break-inside-avoid">
              <div className="flex items-center mb-4 print:mb-2">
                <User className="w-5 h-5 text-gray-600 mr-2 print:hidden" />
                <h3 className="text-lg font-semibold text-gray-900 print:text-sm print:font-bold print:uppercase print:tracking-wide print:border-b print:border-gray-900 print:pb-1 print:mb-2">
                  {t('lab.patientInformation')}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
                <div className="print:border-b print:border-gray-300 print:pb-2">
                  <p className="text-sm text-gray-500 print:text-xs print:font-semibold print:uppercase print:mb-1">{t('lab.patient')}</p>
                  <p className="text-base font-medium text-gray-900 print:text-sm print:font-bold">
                    {labTest.patientName}
                  </p>
                </div>
                <div className="print:border-b print:border-gray-300 print:pb-2">
                  <p className="text-sm text-gray-500 print:text-xs print:font-semibold print:uppercase print:mb-1">{t('lab.email')}</p>
                  <p className="text-base text-gray-900 print:text-sm">{labTest.patientEmail || 'N/A'}</p>
                </div>
                <div className="print:border-b print:border-gray-300 print:pb-2 md:col-span-1 print:col-span-2">
                  <p className="text-sm text-gray-500 print:text-xs print:font-semibold print:uppercase print:mb-1">{t('lab.phone')}</p>
                  <p className="text-base text-gray-900 print:text-sm">{labTest.patientPhone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Test Information */}
            <div className="border-t border-gray-200 pt-6 mb-6 print:border-t print:border-gray-900 print:pt-3 print:mb-3 print:page-break-inside-avoid">
              <div className="flex items-center mb-4 print:mb-2">
                <FlaskConical className="w-5 h-5 text-gray-600 mr-2 print:hidden" />
                <h3 className="text-lg font-semibold text-gray-900 print:text-sm print:font-bold print:uppercase print:tracking-wide print:border-b print:border-gray-900 print:pb-1 print:mb-2">
                  {t('lab.testInformation')}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
                <div className="print:border-b print:border-gray-300 print:pb-2">
                  <p className="text-sm text-gray-500 print:text-xs print:font-semibold print:uppercase print:mb-1">{t('lab.testType')}</p>
                  <p className="text-base font-medium text-gray-900 print:text-sm print:font-bold">
                    {labTest.testType}
                  </p>
                </div>
                <div className="print:border-b print:border-gray-300 print:pb-2">
                  <p className="text-sm text-gray-500 print:text-xs print:font-semibold print:uppercase print:mb-1">{t('lab.testCategory')}</p>
                  <p className="text-base font-medium text-gray-900 print:text-sm">
                    {t(`lab.categoryLabels.${labTest.testCategory}`)}
                  </p>
                </div>
                <div className="print:border-b print:border-gray-300 print:pb-2">
                  <p className="text-sm text-gray-500 print:text-xs print:font-semibold print:uppercase print:mb-1">{t('lab.sampleType')}</p>
                  <p className="text-base text-gray-900 print:text-sm">{labTest.sampleType || 'N/A'}</p>
                </div>
                <div className="print:border-b print:border-gray-300 print:pb-2">
                  <p className="text-sm text-gray-500 print:text-xs print:font-semibold print:uppercase print:mb-1">{t('lab.orderingDoctor')}</p>
                  <p className="text-base text-gray-900 print:text-sm">{labTest.doctorName}</p>
                </div>
                {labTest.sampleCollectedAt && (
                  <div className="print:border-b print:border-gray-300 print:pb-2">
                    <p className="text-sm text-gray-500 print:text-xs print:font-semibold print:uppercase print:mb-1">{t('lab.sampleCollectedAt')}</p>
                    <p className="text-base text-gray-900 print:text-sm">
                      {formatDate(labTest.sampleCollectedAt)}
                    </p>
                  </div>
                )}
                {labTest.completedAt && (
                  <div className="print:border-b print:border-gray-300 print:pb-2">
                    <p className="text-sm text-gray-500 print:text-xs print:font-semibold print:uppercase print:mb-1">{t('lab.completedAt')}</p>
                    <p className="text-base text-gray-900 print:text-sm">
                      {formatDate(labTest.completedAt)}
                    </p>
                  </div>
                )}
                {labTest.technicianName && (
                  <div className="print:border-b print:border-gray-300 print:pb-2">
                    <p className="text-sm text-gray-500 print:text-xs print:font-semibold print:uppercase print:mb-1">{t('lab.assignedTechnician')}</p>
                    <p className="text-base text-gray-900 print:text-sm">{labTest.technicianName}</p>
                  </div>
                )}
              </div>

              {/* Tests to Perform */}
              {labTest.tests && labTest.tests.length > 0 && (
                <div className="mt-4 print:mt-3 print:border-t print:border-gray-300 print:pt-3">
                  <p className="text-sm text-gray-500 mb-2 print:text-xs print:font-semibold print:uppercase">{t('lab.testsToPerform')}</p>
                  <div className="flex flex-wrap gap-2 print:gap-1">
                    {labTest.tests.map((test: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm print:border print:border-gray-400 print:rounded-none print:px-2 print:py-0.5 print:text-xs"
                      >
                        {test}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            {labTest.results && labTest.results.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mb-6 print:border-t print:border-gray-900 print:pt-3 print:mb-3 lab-results">
                <div className="flex items-center mb-4 print:mb-2 print:page-break-inside-avoid">
                  <CheckCircle className="w-5 h-5 text-gray-600 mr-2 print:hidden" />
                  <h3 className="text-lg font-semibold text-gray-900 print:text-sm print:font-bold print:uppercase print:tracking-wide print:border-b print:border-gray-900 print:pb-1 print:mb-2">
                    {t('lab.results')}
                  </h3>
                </div>
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="min-w-full divide-y divide-gray-200 print:border print:border-gray-900 print:w-full">
                    <thead className="bg-gray-50 print:bg-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide print:border print:border-gray-900 print:px-3 print:py-2 print:font-bold">
                          {t('lab.testName')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide print:border print:border-gray-900 print:px-3 print:py-2 print:font-bold">
                          {t('lab.value')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide print:border print:border-gray-900 print:px-3 print:py-2 print:font-bold">
                          {t('lab.unit')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide print:border print:border-gray-900 print:px-3 print:py-2 print:font-bold">
                          {t('lab.normalRange')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide print:border print:border-gray-900 print:px-3 print:py-2 print:font-bold">
                          {t('lab.status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {labTest.results.map((result: any, index: number) => (
                        <tr key={index} className="print:border-b print:border-gray-700">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 print:border print:border-gray-700 print:px-3 print:py-2 print:text-xs print:font-semibold">
                            {result.testName}
                          </td>
                          <td className={`px-4 py-3 text-sm print:border print:border-gray-700 print:px-3 print:py-2 print:text-xs print:font-bold ${getResultStatusColor(result.status)}`}>
                            {result.value}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 print:border print:border-gray-700 print:px-3 print:py-2 print:text-xs">
                            {result.unit || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 print:border print:border-gray-700 print:px-3 print:py-2 print:text-xs">
                            {result.normalRange || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm print:border print:border-gray-700 print:px-3 print:py-2">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium print:border print:border-gray-900 print:rounded-none print:px-1 print:py-0.5 ${
                                result.status === 'normal'
                                  ? 'bg-green-100 text-green-800 print:bg-transparent print:text-black'
                                  : result.status === 'abnormal'
                                  ? 'bg-orange-100 text-orange-800 print:bg-transparent print:text-black'
                                  : 'bg-red-100 text-red-800 print:bg-transparent print:text-black print:font-bold'
                              }`}
                            >
                              {t(`lab.resultStatusLabels.${result.status}`).toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {labTest.resultNotes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg print:mt-3 print:p-3 print:border print:border-gray-700 print:rounded-none print:bg-transparent">
                    <p className="text-sm font-medium text-gray-700 mb-1 print:text-xs print:font-bold print:uppercase print:mb-2">
                      {t('lab.additionalNotes')}
                    </p>
                    <p className="text-sm text-gray-600 print:text-xs">{labTest.resultNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {labTest.notes && (
              <div className="border-t border-gray-200 pt-6 print:border-t-2 print:border-gray-900 print:pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2 print:text-xs print:font-bold print:uppercase print:mb-2">{t('lab.notes')}</p>
                <p className="text-sm text-gray-600 print:text-xs">{labTest.notes}</p>
              </div>
            )}

            {/* Critical Alert - Print */}
            {labTest.isCritical && (
              <div className="hidden print:block print:mt-6 print:pt-4 print:border-t-2 print:border-gray-900 print:border-b-2 print:border-gray-900 print:py-4">
                <div className="text-center">
                  <p className="text-lg font-bold uppercase mb-2">⚠ CRITICAL VALUE ALERT</p>
                  <p className="text-sm">Immediate attention required. Please contact the ordering physician immediately.</p>
                </div>
              </div>
            )}

            {/* Professional Footer - Print Only */}
            <div className="hidden print:block print:mt-12 print:pt-6 print:border-t-2 print:border-gray-900">
              <div className="grid grid-cols-3 gap-8 text-xs">
                <div>
                  <p className="font-semibold mb-2">LABORATORY TECHNICIAN</p>
                  <div className="border-t border-gray-900 pt-8 mt-2">
                    <p className="text-xs">Signature</p>
                  </div>
                  {labTest.technicianName && (
                    <p className="mt-1 text-xs">{labTest.technicianName}</p>
                  )}
                </div>
                <div>
                  <p className="font-semibold mb-2">REVIEWED BY</p>
                  <div className="border-t border-gray-900 pt-8 mt-2">
                    <p className="text-xs">Signature</p>
                  </div>
                  {labTest.reviewedBy && (
                    <p className="mt-1 text-xs">{labTest.reviewedBy}</p>
                  )}
                </div>
                <div>
                  <p className="font-semibold mb-2">AUTHORIZED SIGNATURE</p>
                  <div className="border-t border-gray-900 pt-8 mt-2">
                    <p className="text-xs">Signature</p>
                  </div>
                  <p className="mt-1 text-xs">Laboratory Director</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-400 text-center text-xs">
                <p className="font-semibold">This is a computer-generated report. No signature required for electronic transmission.</p>
                <p className="mt-1">Report Generated: {new Date().toLocaleString()}</p>
                <p className="mt-1">Report ID: {labTest.testNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
