'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  ArrowLeft, 
  Save, 
  Calendar,
  User,
  Scale,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';

export default function NewReportPage() {
  const [formData, setFormData] = useState({
    // Patient Information
    patientId: '',
    patientName: '',
    
    // Report Details
    reportType: '',
    findings: '',
    diagnosis: '',
    recommendations: '',
    status: 'pending',
    priority: 'medium',
    
    // Additional Information
    notes: '',
    attachments: [] as File[],
    
    // Doctor Information
    doctorName: '',
    department: ''
  });

  const [activeSection, setActiveSection] = useState('patient');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('/api/patients');
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        setError('Failed to fetch patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patientId = e.target.value;
    const selectedPatient = patients.find(p => p._id === patientId);
    
    setFormData(prev => ({
      ...prev,
      patientId,
      patientName: selectedPatient ? selectedPatient.name : ''
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...files]
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.patientId || !formData.reportType || !formData.findings) {
      setError('Please fill in all required fields (Client, Document Type, and Content)');
      setSubmitting(false);
      return;
    }

    try {
      const reportData = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        reportType: formData.reportType,
        reportDate: new Date().toISOString(), // Add report date
        findings: formData.findings,
        diagnosis: formData.diagnosis || 'Pending diagnosis',
        recommendations: formData.recommendations || 'Pending recommendations',
        status: formData.status === 'in progress' ? 'in-progress' : formData.status, // Fix status enum
        priority: formData.priority === 'normal' ? 'medium' : formData.priority, // Fix priority enum
        notes: formData.notes || '',
        doctorName: formData.doctorName || 'Lawyer Demo User',
        doctorId: 'default-doctor-id' // Will be overridden by session in API if available
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      const responseData = await response.json();

      if (response.ok) {
        setSuccess('Document created successfully!');
        // Reset form
        setFormData({
          patientId: '',
          patientName: '',
          reportType: '',
          findings: '',
          diagnosis: '',
          recommendations: '',
          status: 'pending',
          priority: 'medium',
          notes: '',
          attachments: [],
          doctorName: '',
          department: ''
        });
        setActiveSection('patient');
      } else {
        // Show detailed error message
        const errorMessage = responseData.message || responseData.error || 'Failed to create report';
        const errorDetails = responseData.details ? ` Details: ${responseData.details.join(', ')}` : '';
        setError(errorMessage + errorDetails);
        console.error('Report creation error:', responseData);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error creating report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const sections = [
    { id: 'patient', label: 'Client Info', icon: User },
    { id: 'report', label: 'Document Details', icon: FileText },
    { id: 'additional', label: 'Lawyer Info', icon: Scale }
  ];

  const reportTypes = [
    { label: 'Legal Memo', value: 'legal_memo' },
    { label: 'Contract', value: 'contract' },
    { label: 'Demand Letter', value: 'demand_letter' },
    { label: 'Court Filing', value: 'court_filing' },
    { label: 'Other', value: 'other' }
  ];

  const departments = [
    'Corporate',
    'Family',
    'Criminal',
    'Real Estate',
    'Immigration',
    'Employment',
    'Litigation',
    'Other'
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout 
          title="Create New Document" 
          description="Add a new document to the system."
        >
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout 
        title="Create New Document" 
        description="Add a new document to the system."
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
            <h1 className="text-2xl font-bold text-gray-900">Create New Document</h1>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              {sections.map((section, index) => (
                <div key={section.id} className="flex items-center">
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <section.icon className="h-4 w-4" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                  {index < sections.length - 1 && (
                    <div className="w-8 h-px bg-gray-300 mx-2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-700">{success}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Client Information Section */}
            {activeSection === 'patient' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Client *
                    </label>
                    <select
                      id="patientId"
                      name="patientId"
                      value={formData.patientId}
                      onChange={handlePatientChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a client</option>
                      {patients.map((patient) => (
                        <option key={patient._id} value={patient._id}>
                          {patient.name} ({patient.patientId || patient._id}) - {patient.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-2">
                      Client Name
                    </label>
                    <input
                      type="text"
                      id="patientName"
                      name="patientName"
                      value={formData.patientName}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveSection('report')}
                    disabled={!formData.patientId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Document Details
                  </button>
                </div>
              </div>
            )}

            {/* Document Details Section */}
            {activeSection === 'report' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Details</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-2">
                        Document Type *
                      </label>
                      <select
                        id="reportType"
                        name="reportType"
                        value={formData.reportType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select document type</option>
                        {reportTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="reviewed">Reviewed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="findings" className="block text-sm font-medium text-gray-700 mb-2">
                      Findings *
                    </label>
                    <textarea
                      id="findings"
                      name="findings"
                      value={formData.findings}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter the findings of the examination or test..."
                    />
                  </div>

                  <div>
                    <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-2">
                      Diagnosis
                    </label>
                    <textarea
                      id="diagnosis"
                      name="diagnosis"
                      value={formData.diagnosis}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter the diagnosis..."
                    />
                  </div>

                  <div>
                    <label htmlFor="recommendations" className="block text-sm font-medium text-gray-700 mb-2">
                      Recommendations
                    </label>
                    <textarea
                      id="recommendations"
                      name="recommendations"
                      value={formData.recommendations}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter treatment recommendations..."
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveSection('patient')}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('additional')}
                    disabled={!formData.reportType || !formData.findings}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Additional Info
                  </button>
                </div>
              </div>
            )}

            {/* Additional Information Section */}
            {activeSection === 'additional' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>
                      <select
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Any additional notes or comments..."
                    />
                  </div>

                  <div>
                    <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-2">
                      Attachments
                    </label>
                    <input
                      type="file"
                      id="attachments"
                      multiple
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Supported formats: PDF, DOC, DOCX, JPG, PNG
                    </p>
                    
                    {formData.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveSection('report')}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Document
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
