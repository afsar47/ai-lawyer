'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Download,
  Eye,
  Calendar,
  MoreVertical
} from 'lucide-react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';

export default function ReportsPage() {
  const { t, translationsLoaded } = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/reports');
        if (response.ok) {
          const data = await response.json();
          setReports(data);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.findings?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.doctorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.reportType?.toLowerCase() === filterType.toLowerCase();
    const matchesStatus = filterStatus === 'all' || report.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string | undefined) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    
    switch (type.toLowerCase()) {
      case 'legal memo':
        return 'bg-blue-100 text-blue-800';
      case 'contract':
        return 'bg-purple-100 text-purple-800';
      case 'court filing':
        return 'bg-red-100 text-red-800';
      case 'demand letter':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    // Navigate to report details page
    window.location.href = `/reports/${report._id}`;
  };

  const handleDownloadReport = async (report: any) => {
    setSelectedReport(report);
    
    try {
      // Import jsPDF dynamically to avoid SSR issues
      const { default: jsPDF } = await import('jspdf');
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Set document properties
      doc.setProperties({
        title: `Case Document - ${report.reportType || 'Document'}`,
        subject: `Case Document for ${report.patientName}`,
        author: report.doctorName || 'Law Firm Staff',
        creator: 'AI Lawyer'
      });
      
      // Add header
      doc.setFontSize(20);
      doc.setTextColor(44, 62, 80);
      doc.text('CASE DOCUMENT', 105, 20, { align: 'center' });
      
      // Add line separator
      doc.setDrawColor(52, 152, 219);
      doc.setLineWidth(0.5);
      doc.line(20, 30, 190, 30);
      
      // Add report information
      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      
      let yPosition = 50;
      
      // Report Type and Date
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text('Report Information', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(52, 73, 94);
      doc.text(`Report Type: ${report.reportType || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Report Date: ${report.reportDate ? new Date(report.reportDate).toLocaleDateString() : 'N/A'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Status: ${report.status || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Priority: ${report.priority || 'N/A'}`, 20, yPosition);
      yPosition += 15;
      
      // Client Information
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text('Client Information', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(52, 73, 94);
      doc.text(`Client Name: ${report.patientName || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Client ID: ${report.patientId || 'N/A'}`, 20, yPosition);
      yPosition += 15;
      
      // Lawyer Information
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text('Lawyer Information', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(52, 73, 94);
      doc.text(`Lawyer Name: ${report.doctorName || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Lawyer ID: ${report.doctorId || 'N/A'}`, 20, yPosition);
      yPosition += 15;
      
      // Document Content
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text('Document Content', 20, yPosition);
      yPosition += 10;
      
      // Findings
      doc.setFontSize(12);
      doc.setTextColor(52, 73, 94);
      doc.text('Findings:', 20, yPosition);
      yPosition += 7;
      
      doc.setFontSize(10);
      const findings = report.findings || 'No findings recorded';
      const findingsLines = doc.splitTextToSize(findings, 170);
      doc.text(findingsLines, 20, yPosition);
      yPosition += (findingsLines.length * 5) + 10;
      
      // Diagnosis
      if (report.diagnosis) {
        doc.setFontSize(12);
        doc.setTextColor(52, 73, 94);
        doc.text('Diagnosis:', 20, yPosition);
        yPosition += 7;
        
        doc.setFontSize(10);
        const diagnosisLines = doc.splitTextToSize(report.diagnosis, 170);
        doc.text(diagnosisLines, 20, yPosition);
        yPosition += (diagnosisLines.length * 5) + 10;
      }
      
      // Recommendations
      if (report.recommendations) {
        doc.setFontSize(12);
        doc.setTextColor(52, 73, 94);
        doc.text('Recommendations:', 20, yPosition);
        yPosition += 7;
        
        doc.setFontSize(10);
        const recommendationsLines = doc.splitTextToSize(report.recommendations, 170);
        doc.text(recommendationsLines, 20, yPosition);
        yPosition += (recommendationsLines.length * 5) + 10;
      }
      
      // Notes
      if (report.notes) {
        doc.setFontSize(12);
        doc.setTextColor(52, 73, 94);
        doc.text('Additional Notes:', 20, yPosition);
        yPosition += 7;
        
        doc.setFontSize(10);
        const notesLines = doc.splitTextToSize(report.notes, 170);
        doc.text(notesLines, 20, yPosition);
        yPosition += (notesLines.length * 5) + 10;
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(149, 165, 166);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 280);
      doc.text('AI Lawyer', 20, 285);
      
      // Save the PDF
      const fileName = `case_document_${report._id}_${report.reportType || 'document'}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleEditReport = (report: any) => {
    setSelectedReport(report);
    // Navigate to edit page
    window.location.href = `/reports/${report._id}/edit`;
  };

  const handleShareReport = (report: any) => {
    setSelectedReport(report);
    console.log('Sharing report:', report);
    alert(`Sharing document: ${report.reportType || 'Document'}`);
  };

  const handleDeleteReport = (report: any) => {
    if (confirm(`Are you sure you want to delete the document "${report.reportType || 'Document'}"?`)) {
      console.log('Deleting report:', report);
      alert(`Document "${report.reportType || 'Document'}" deleted successfully`);
    }
  };

  const toggleActionsMenu = (reportId: number) => {
    setShowActionsMenu(showActionsMenu === reportId ? null : reportId);
  };

  // Close actions menu when clicking outside
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menu when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowActionsMenu(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Show loading state if translations aren't loaded yet
  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout
        title={t('reports.title')}
        description={t('reports.description')}
      >
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
              {filteredReports.length} {t('reports.title').toLowerCase()}
            </span>
          </div>
          <Link
            href="/reports/new"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t('reports.addNew')}</span>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('reports.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('reports.allTypes')}</option>
                  <option value="legal memo">Legal Memo</option>
                  <option value="contract">Contract</option>
                  <option value="demand letter">Demand Letter</option>
                  <option value="court filing">Court Filing</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('reports.allStatus')}</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="in progress">In Progress</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">{t('reports.loading')}</p>
              </div>
            ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('reports.reportDetails')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('reports.type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('reports.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('reports.patientDoctor')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('reports.datePriority')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('reports.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{report.reportType || 'Report'}</div>
                          <div className="text-sm text-gray-700">ID: {report._id || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(report.reportType)}`}>
                        {report.reportType || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.patientName || 'Unknown'}</div>
                      <div className="text-sm text-gray-700">{report.doctorName || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.reportDate ? new Date(report.reportDate).toLocaleDateString() : 'N/A'}</div>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(report.priority)}`}>
                          {report.priority || 'Normal'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewReport(report)}
                          className="text-blue-600 hover:text-blue-900 hover:underline flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>{t('reports.view')}</span>
                        </button>
                        <button 
                          onClick={() => handleDownloadReport(report)}
                          className="text-green-600 hover:text-green-900 hover:underline flex items-center space-x-1"
                        >
                          <Download className="h-4 w-4" />
                          <span>{t('reports.download')}</span>
                        </button>
                        <div className="relative" ref={actionsMenuRef}>
                          <button 
                            onClick={() => toggleActionsMenu(report._id)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          
                          {showActionsMenu === report._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <div className="py-1">
                                <button
                                  onClick={() => handleViewReport(report)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  {t('reports.viewDetails')}
                                </button>
                                <button
                                  onClick={() => handleDownloadReport(report)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  {t('reports.downloadReport')}
                                </button>
                                <button
                                  onClick={() => handleEditReport(report)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  {t('reports.editReport')}
                                </button>
                                <button
                                  onClick={() => handleShareReport(report)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  {t('reports.shareReport')}
                                </button>
                                <button
                                  onClick={() => handleDeleteReport(report)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  {t('reports.deleteReport')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('reports.noReports')}</h3>
                                    <p className="mt-1 text-sm text-gray-700">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? t('reports.noReportsDesc')
                : t('reports.getStarted')
              }
            </p>
            {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
              <div className="mt-6">
                <Link
                  href="/reports/new"
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t('reports.addNew')}</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </SidebarLayout>
    </ProtectedRoute>
  );
}
