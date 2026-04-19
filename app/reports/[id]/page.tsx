'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Share2, 
  Trash2,
  FileText,
  User,
  Scale,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setReport(data);
        } else {
          setError('Document not found');
        }
      } catch (error) {
        console.error('Error fetching report:', error);
        setError('Failed to fetch document data');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

  const handleDownloadReport = async () => {
    if (!report) return;
    
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

  const handleDeleteReport = async () => {
    if (!report) return;
    
    if (confirm(`Are you sure you want to delete the document "${report.reportType || 'Document'}"?`)) {
      try {
        const response = await fetch(`/api/reports/${params.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          router.push('/reports');
        } else {
          alert('Failed to delete document');
        }
      } catch (error) {
        console.error('Error deleting report:', error);
        alert('An error occurred while deleting the document');
      }
    }
  };

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
      case 'laboratory':
        return 'bg-blue-100 text-blue-800';
      case 'radiology':
        return 'bg-purple-100 text-purple-800';
      case 'cardiology':
        return 'bg-red-100 text-red-800';
      case 'pathology':
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

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout
          title="Document Details"
          description="View detailed information about a case document"
        >
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  if (error || !report) {
    return (
      <ProtectedRoute>
        <SidebarLayout
          title="Document Not Found"
          description="The requested document could not be found"
        >
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Document not found</h3>
            <p className="mt-1 text-sm text-gray-700">
              {error || 'The document you are looking for does not exist or has been removed.'}
            </p>
            <div className="mt-6">
              <Link
                href="/reports"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documents
              </Link>
            </div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout
        title="Document Details"
        description="View detailed information about a case document"
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/reports"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Link>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {report.reportType || 'Case Document'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Document ID: {report._id}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownloadReport}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
                
                <Link
                  href={`/reports/${report._id}/edit`}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </div>
            </div>
          </div>

          {/* Report Information */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header Section */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {report.reportType || 'Case Document'}
                    </h2>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {report.status || 'Unknown'}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(report.priority)}`}>
                        {report.priority || 'Normal'} Priority
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-600">Document Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {report.reportDate ? new Date(report.reportDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="p-6 space-y-6">
              {/* Client & Lawyer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <User className="h-5 w-5 text-gray-600" />
                    <h3 className="text-sm font-medium text-gray-900">Client Information</h3>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">{report.patientName || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Client ID: {report.patientId || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Scale className="h-5 w-5 text-gray-600" />
                    <h3 className="text-sm font-medium text-gray-900">Lawyer Information</h3>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">{report.doctorName || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{report.department || 'General'}</p>
                </div>
              </div>

              {/* Report Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Findings</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {report.findings || 'No findings recorded'}
                    </p>
                  </div>
                </div>

                {report.diagnosis && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Diagnosis</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {report.diagnosis}
                      </p>
                    </div>
                  </div>
                )}

                {report.recommendations && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {report.recommendations}
                      </p>
                    </div>
                  </div>
                )}

                {report.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Additional Notes</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {report.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleDownloadReport}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Document
                  </button>
                  
                  <button className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Document
                  </button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Link
                    href={`/reports/${report._id}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Document
                  </Link>
                  
                  <button
                    onClick={handleDeleteReport}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
