'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  Phone, 
  Mail, 
  Calendar,
  MapPin,
  Heart,
  User,
  Brain,
  Pill,
  Camera,
  Calendar as CalendarIcon,
  Shield,
  FileText,
  Clock,
  Eye,
  Trash2,
  Mic
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import FormattedAIResult from '../../components/FormattedAIResult';

export default function PatientViewPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [loadingAiResults, setLoadingAiResults] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'appointments' | 'treatment-plan' | 'prescription' | 'drug-interaction' | 'image-analysis' | 'appointment-optimizer' | 'risk-assessment' | 'voice-transcription'>('details');
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [selectedSymptomAnalysis, setSelectedSymptomAnalysis] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [showTreatmentPlanModal, setShowTreatmentPlanModal] = useState(false);
  const [selectedTreatmentPlan, setSelectedTreatmentPlan] = useState<any>(null);
  const [selectedTreatmentPlanSymptom, setSelectedTreatmentPlanSymptom] = useState<any>(null);
  const [treatmentPlanModalTab, setTreatmentPlanModalTab] = useState<'symptoms' | 'treatment'>('symptoms');

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setPatient(data);
        } else {
          setError('Client not found');
        }
      } catch (error) {
        console.error('Error fetching patient:', error);
        setError('Failed to fetch client data');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPatient();
    }
  }, [params.id]);

  // Fetch appointments for this patient
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!params.id || !patient) return;
      
      try {
        setLoadingAppointments(true);
        const response = await fetch('/api/appointments');
        if (response.ok) {
          const data = await response.json();
          // Filter appointments for this patient by patientId or patientName
          const patientAppointments = data.filter((apt: any) => 
            apt.patientId === params.id || 
            apt.patientId === patient._id ||
            apt.patientName?.toLowerCase() === patient.name?.toLowerCase()
          );
          setAppointments(patientAppointments);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoadingAppointments(false);
      }
    };

    if (params.id && patient) {
      fetchAppointments();
    }
  }, [params.id, patient]);

  // Fetch AI results for this patient
  const fetchAIResults = async () => {
    if (!params.id) return;
    
    try {
      setLoadingAiResults(true);
      const patientId = String(params.id); // Ensure it's a string
      console.log('Fetching AI results for patient:', patientId, 'Type:', typeof patientId);
      
      // First, let's check what's in the database
      const debugResponse = await fetch(`/api/ai-results/debug?patientId=${patientId}`);
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('=== DEBUG: All AI Results in DB ===');
        console.log('Total results:', debugData.total);
        console.log('Counts by type:', debugData.countsByType);
        console.log('All results:', debugData.allResults);
      }
      
      // Then fetch normally
      const response = await fetch(`/api/ai-results?patientId=${patientId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('AI results fetched:', data.results?.length || 0, 'results');
        console.log('Results:', data.results);
        setAiResults(data.results || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch AI results:', errorData);
      }
    } catch (error) {
      console.error('Error fetching AI results:', error);
    } finally {
      setLoadingAiResults(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchAIResults();
    }
  }, [params.id]);

  // Delete AI result
  const handleDeleteResult = async (resultId: string, resultTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${resultTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ai-results?id=${resultId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setAiResults(aiResults.filter(result => result._id !== resultId));
        alert('✅ AI result deleted successfully!');
        // Refresh the data to update counts
        await fetchAIResults();
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to delete: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting AI result:', error);
      alert('❌ Error deleting AI result: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout 
          title="Client Details" 
          description="View client information"
        >
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  if (error || !patient) {
    return (
      <ProtectedRoute>
        <SidebarLayout 
          title="Client Not Found" 
          description="The requested client could not be found"
        >
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Client not found</h3>
            <p className="mt-1 text-sm text-gray-700">
              The client you're looking for doesn't exist or has been removed.
            </p>
            <div className="mt-6">
              <Link
                href="/patients"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Clients</span>
              </Link>
            </div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  // Filter AI results by type
  const getAIResultsByType = (type: string) => {
    return aiResults.filter(result => result.type === type);
  };

  // Get status color for appointments
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to find related symptom analysis for a treatment plan
  const findRelatedSymptomAnalysis = (treatmentPlan: any) => {
    const symptomAnalyses = getAIResultsByType('symptom-analysis');
    if (symptomAnalyses.length === 0) return null;
    
    // Find the symptom analysis created before this treatment plan (closest one)
    const treatmentDate = new Date(treatmentPlan.createdAt);
    const relatedSymptoms = symptomAnalyses
      .filter((symptom: any) => new Date(symptom.createdAt) <= treatmentDate)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return relatedSymptoms.length > 0 ? relatedSymptoms[0] : null;
  };

  const tabs = [
    { id: 'details', label: 'Client Details', icon: User },
    { id: 'appointments', label: 'Consultations', icon: Calendar, count: appointments.length },
    { id: 'treatment-plan', label: 'Case Strategies', icon: Pill, count: getAIResultsByType('treatment-plan').length },
    { id: 'prescription', label: 'Draft Documents', icon: FileText, count: getAIResultsByType('prescription').length },
    { id: 'drug-interaction', label: 'Risk Flags', icon: Pill, count: getAIResultsByType('drug-interaction').length },
    { id: 'image-analysis', label: 'Document Analysis', icon: Camera, count: getAIResultsByType('image-analysis').length },
    { id: 'appointment-optimizer', label: 'Consultation Optimizer', icon: CalendarIcon, count: getAIResultsByType('appointment-optimizer').length },
    { id: 'risk-assessment', label: 'Risk Assessment', icon: Shield, count: getAIResultsByType('risk-assessment').length },
    { id: 'voice-transcription', label: 'Voice Notes', icon: Mic, count: getAIResultsByType('voice-transcription').length },
  ];

  return (
    <ProtectedRoute>
      <SidebarLayout 
        title="Client Details" 
        description="View and manage client information"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link 
              href="/patients"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Link>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <Link
                href={`/patients/${patient._id}/edit`}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Client</span>
              </Link>
            </div>
          </div>

          {/* Main Content with Vertical Tabs */}
          <div className="flex gap-6">
            {/* Vertical Tab Navigation - Left Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow sticky top-6">
                <nav className="p-2" aria-label="Tabs">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full py-3 px-4 mb-1 rounded-lg font-medium text-sm flex items-center justify-between transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5" />
                          <span>{tab.label}</span>
                        </div>
                        {tab.count !== undefined && tab.count > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            activeTab === tab.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Tab Content - Right Side */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg shadow">
            {/* Patient Details Tab */}
            {activeTab === 'details' && (
            <div className="p-6">
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="text-sm text-gray-900">{patient.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Client ID</p>
                      <p className="text-sm text-gray-900 font-mono">{patient.patientId || patient._id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{patient.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900">{patient.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                      <p className="text-sm text-gray-900">
                        {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-sm text-gray-900">{patient.address || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Heart className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Blood Type</p>
                      <p className="text-sm text-gray-900">{patient.bloodType || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assigned Lawyer</p>
                      <p className="text-sm text-gray-900">{patient.assignedDoctor || 'Not assigned'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Registration Date</p>
                      <p className="text-sm text-gray-900">
                        {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Not specified'}
                      </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {patient.emergencyContact && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-sm text-gray-900">{patient.emergencyContact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Relationship</p>
                    <p className="text-sm text-gray-900">{patient.emergencyContact.relationship}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{patient.emergencyContact.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Medical History */}
          {patient.medicalHistory && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Notes</h2>
                      <p className="text-sm text-gray-900">{patient.medicalHistory}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Consultations</h2>
                {loadingAppointments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No appointments found for this patient</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lawyer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {appointments.map((appointment) => (
                          <tr key={appointment._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {appointment.appointmentTime || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {appointment.doctorName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {appointment.appointmentType || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                                {appointment.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                href={`/appointments/${appointment._id}`}
                                className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                              >
                                <Eye className="h-4 w-4" />
                                <span>View</span>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Treatment Plans Tab - Shows both symptoms and treatments */}
            {activeTab === 'treatment-plan' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Pill className="h-5 w-5" />
                  <span>Treatment Plans</span>
                </h2>
                {loadingAiResults ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : getAIResultsByType('treatment-plan').length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No treatment plans available for this patient</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Model</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getAIResultsByType('treatment-plan').map((result) => {
                          const relatedSymptom = findRelatedSymptomAnalysis(result);
                          return (
                            <tr key={result._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                                    <Pill className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{result.title}</div>
                                    {result.metadata && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {result.metadata.diagnosis && (
                                          <span className="mr-2">Diagnosis: {result.metadata.diagnosis}</span>
                                        )}
                                        {result.metadata.symptoms && result.metadata.symptoms.length > 0 && (
                                          <span>Symptoms: {result.metadata.symptoms.length}</span>
                                        )}
                                      </div>
                                    )}
                                    {relatedSymptom && (
                                      <div className="text-xs text-indigo-600 mt-1 flex items-center space-x-1">
                                        <Brain className="h-3 w-3" />
                                        <span>Linked to symptom analysis</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {result.aiModel?.name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedTreatmentPlan(result);
                                      setSelectedTreatmentPlanSymptom(relatedSymptom || null);
                                      // Default to symptoms tab if available, otherwise treatment
                                      setTreatmentPlanModalTab(relatedSymptom ? 'symptoms' : 'treatment');
                                      setShowTreatmentPlanModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900 flex items-center space-x-1 px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                                    title="View Treatment Plan"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="text-xs">View</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResult(result._id, result.title)}
                                    className="text-red-600 hover:text-red-900 flex items-center space-x-1 px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                                    title="Delete Treatment Plan"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="text-xs">Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Prescription Tab */}
            {activeTab === 'prescription' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Prescriptions</span>
                </h2>
                {loadingAiResults ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : getAIResultsByType('prescription').length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No prescriptions available for this patient</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Model</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getAIResultsByType('prescription').map((result) => (
                          <tr key={result._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{result.title}</div>
                                  {result.metadata && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {result.metadata.diagnosis && (
                                        <span className="mr-2">Diagnosis: {result.metadata.diagnosis}</span>
                                      )}
                                      {result.metadata.medications && result.metadata.medications.length > 0 && (
                                        <span>Medications: {result.metadata.medications.length}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.aiModel?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedResult(result);
                                    setShowModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteResult(result._id, result.title)}
                                  className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete</span>
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
            )}

            {/* Other AI Analysis Tabs */}
            {['drug-interaction', 'image-analysis', 'appointment-optimizer', 'risk-assessment', 'voice-transcription'].includes(activeTab) && (
              <div className="p-6">
                {(() => {
                  const typeResults = getAIResultsByType(activeTab);
                  const getTypeLabel = () => {
                    switch (activeTab) {
                      case 'prescription': return 'Prescriptions';
                      case 'drug-interaction': return 'Drug Interactions';
                      case 'image-analysis': return 'Image Analysis';
                      case 'appointment-optimizer': return 'Appointment Optimizer';
                      case 'risk-assessment': return 'Risk Assessment';
                      case 'voice-transcription': return 'Voice Transcriptions';
                      default: return 'AI Analysis';
                    }
                  };

                  const getTypeIcon = () => {
                    switch (activeTab) {
                      case 'prescription': return <FileText className="h-5 w-5" />;
                      case 'drug-interaction': return <Pill className="h-5 w-5" />;
                      case 'image-analysis': return <Camera className="h-5 w-5" />;
                      case 'appointment-optimizer': return <CalendarIcon className="h-5 w-5" />;
                      case 'risk-assessment': return <Shield className="h-5 w-5" />;
                      case 'voice-transcription': return <Mic className="h-5 w-5" />;
                      default: return <Brain className="h-5 w-5" />;
                    }
                  };

                  const getTypeColor = () => {
                    switch (activeTab) {
                      case 'prescription': return 'bg-teal-100 text-teal-800';
                      case 'drug-interaction': return 'bg-red-100 text-red-800';
                      case 'image-analysis': return 'bg-purple-100 text-purple-800';
                      case 'appointment-optimizer': return 'bg-green-100 text-green-800';
                      case 'risk-assessment': return 'bg-orange-100 text-orange-800';
                      case 'voice-transcription': return 'bg-violet-100 text-violet-800';
                      default: return 'bg-gray-100 text-gray-800';
                    }
                  };

                  return (
                    <>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        {getTypeIcon()}
                        <span>{getTypeLabel()}</span>
                      </h2>
                      {loadingAiResults ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : typeResults.length === 0 ? (
                        <div className="text-center py-8">
                          <Brain className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">No {getTypeLabel().toLowerCase()} available for this patient</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Model</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {typeResults.map((result) => (
                                <tr key={result._id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <div className={`p-2 rounded-lg ${getTypeColor()}`}>
                                        {getTypeIcon()}
                                      </div>
                                      <div>
                                        {activeTab === 'image-analysis' ? (
                                          <div className="text-sm font-medium text-gray-900">
                                            {result.metadata?.imageType || 'Document Analysis'}
                                          </div>
                                        ) : (
                                          <>
                                            <div className="text-sm font-medium text-gray-900">{result.title}</div>
                                            {result.metadata && (
                                              <div className="text-xs text-gray-500 mt-1">
                                                {result.metadata.diagnosis && (
                                                  <span className="mr-2">Diagnosis: {result.metadata.diagnosis}</span>
                                                )}
                                                {result.metadata.symptoms && result.metadata.symptoms.length > 0 && (
                                                  <span>Symptoms: {result.metadata.symptoms.length}</span>
                                                )}
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {result.aiModel?.name || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3 text-gray-400" />
                                      <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => {
                                          setSelectedResult(result);
                                          setShowModal(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                      >
                                        <Eye className="h-4 w-4" />
                                        <span>View</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteResult(result._id, result.title)}
                                        className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
              </div>
            </div>
          </div>
        </div>

        {/* Treatment Plan Modal */}
        {showModal && selectedResult && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowModal(false)}>
            <div className={`relative top-20 mx-auto p-5 border shadow-lg rounded-md bg-white ${selectedResult.type === 'image-analysis' ? 'w-11/12 md:w-4/5 lg:w-3/4' : 'w-11/12 md:w-3/4 lg:w-1/2'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  {selectedResult.type === 'image-analysis' ? (
                    <Camera className="h-5 w-5 text-purple-600" />
                  ) : selectedResult.type === 'voice-transcription' ? (
                    <Mic className="h-5 w-5 text-violet-600" />
                  ) : (
                    <Pill className="h-5 w-5 text-blue-600" />
                  )}
                  <span>{selectedResult.type === 'image-analysis' ? (selectedResult.metadata?.imageType || 'Document Analysis') : selectedResult.title}</span>
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="mb-4 flex items-center space-x-4 text-sm text-gray-600">
                {selectedResult.aiModel && (
                  <span>AI Model: {selectedResult.aiModel.name}</span>
                )}
                <span className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(selectedResult.createdAt).toLocaleString()}</span>
                </span>
              </div>
              <div className={`bg-gray-50 rounded-lg p-6 ${selectedResult.type === 'image-analysis' ? 'max-h-[80vh]' : 'max-h-[600px]'} overflow-y-auto`}>
                {selectedResult.type === 'image-analysis' && selectedResult.rawData?.imageUrl && (
                  <div className="mb-6 flex justify-center bg-white p-4 rounded-lg shadow-inner">
                    <img 
                      src={selectedResult.rawData.imageUrl} 
                      alt="Document"
                      className="max-w-full h-auto rounded-lg shadow-lg"
                      style={{ maxHeight: '70vh', width: 'auto' }}
                    />
                  </div>
                )}
                <FormattedAIResult 
                  content={selectedResult.content} 
                  type={selectedResult.type}
                />
              </div>
              {selectedResult.metadata && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedResult.metadata.symptoms && selectedResult.metadata.symptoms.length > 0 && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      Symptoms: {selectedResult.metadata.symptoms.join(', ')}
                    </span>
                  )}
                  {selectedResult.metadata.diagnosis && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                      Diagnosis: {selectedResult.metadata.diagnosis}
                    </span>
                  )}
                  {selectedResult.metadata.medications && selectedResult.metadata.medications.length > 0 && (
                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                      Medications: {selectedResult.metadata.medications.length}
                    </span>
                  )}
                  {selectedResult.metadata.riskFactors && selectedResult.metadata.riskFactors.length > 0 && (
                    <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">
                      Risk Factors: {selectedResult.metadata.riskFactors.length}
                    </span>
                  )}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Treatment Plan Modal with Tabs */}
        {showTreatmentPlanModal && selectedTreatmentPlan && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowTreatmentPlanModal(false)}>
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Pill className="h-5 w-5 text-blue-600" />
                  <span>{selectedTreatmentPlan.title}</span>
                </h3>
                <button
                  onClick={() => setShowTreatmentPlanModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="mb-4 flex items-center space-x-4 text-sm text-gray-600">
                {selectedTreatmentPlan.aiModel && (
                  <span>AI Model: {selectedTreatmentPlan.aiModel.name}</span>
                )}
                <span className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(selectedTreatmentPlan.createdAt).toLocaleString()}</span>
                </span>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="flex space-x-8" aria-label="Tabs">
                  {selectedTreatmentPlanSymptom && (
                    <button
                      onClick={() => setTreatmentPlanModalTab('symptoms')}
                      className={`py-3 px-1 border-b-2 font-medium text-sm ${
                        treatmentPlanModalTab === 'symptoms'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4" />
                        <span>Symptoms</span>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => setTreatmentPlanModalTab('treatment')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      treatmentPlanModalTab === 'treatment'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Pill className="h-4 w-4" />
                      <span>Treatment</span>
                    </div>
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                {treatmentPlanModalTab === 'symptoms' && selectedTreatmentPlanSymptom ? (
                  <div>
                    <div className="mb-4 flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-indigo-600" />
                      <h4 className="text-md font-semibold text-gray-900">{selectedTreatmentPlanSymptom.title}</h4>
                    </div>
                    <div className="mb-4 flex items-center space-x-4 text-sm text-gray-600">
                      {selectedTreatmentPlanSymptom.aiModel && (
                        <span>AI Model: {selectedTreatmentPlanSymptom.aiModel.name}</span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(selectedTreatmentPlanSymptom.createdAt).toLocaleString()}</span>
                      </span>
                    </div>
                    <FormattedAIResult 
                      content={selectedTreatmentPlanSymptom.content} 
                      type={selectedTreatmentPlanSymptom.type}
                    />
                    {selectedTreatmentPlanSymptom.metadata && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedTreatmentPlanSymptom.metadata.symptoms && selectedTreatmentPlanSymptom.metadata.symptoms.length > 0 && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                            Symptoms: {selectedTreatmentPlanSymptom.metadata.symptoms.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <FormattedAIResult 
                      content={selectedTreatmentPlan.content} 
                      type={selectedTreatmentPlan.type}
                    />
                    {selectedTreatmentPlan.metadata && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedTreatmentPlan.metadata.symptoms && selectedTreatmentPlan.metadata.symptoms.length > 0 && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            Symptoms: {selectedTreatmentPlan.metadata.symptoms.join(', ')}
                          </span>
                        )}
                        {selectedTreatmentPlan.metadata.diagnosis && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                            Diagnosis: {selectedTreatmentPlan.metadata.diagnosis}
                          </span>
                        )}
                        {selectedTreatmentPlan.metadata.medications && selectedTreatmentPlan.metadata.medications.length > 0 && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                            Medications: {selectedTreatmentPlan.metadata.medications.length}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowTreatmentPlanModal(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Symptom Analysis Modal */}
        {showSymptomModal && selectedSymptomAnalysis && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowSymptomModal(false)}>
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-indigo-600" />
                  <span>{selectedSymptomAnalysis.title}</span>
                </h3>
                <button
                  onClick={() => setShowSymptomModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="mb-4 flex items-center space-x-4 text-sm text-gray-600">
                {selectedSymptomAnalysis.aiModel && (
                  <span>AI Model: {selectedSymptomAnalysis.aiModel.name}</span>
                )}
                <span className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(selectedSymptomAnalysis.createdAt).toLocaleString()}</span>
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                <FormattedAIResult 
                  content={selectedSymptomAnalysis.content} 
                  type={selectedSymptomAnalysis.type}
                />
              </div>
              {selectedSymptomAnalysis.metadata && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedSymptomAnalysis.metadata.symptoms && selectedSymptomAnalysis.metadata.symptoms.length > 0 && (
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                      Symptoms: {selectedSymptomAnalysis.metadata.symptoms.join(', ')}
                    </span>
                  )}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowSymptomModal(false)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </SidebarLayout>
    </ProtectedRoute>
  );
}
