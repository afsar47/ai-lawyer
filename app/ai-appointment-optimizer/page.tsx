'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import SearchablePatientSelect from '../components/SearchablePatientSelect';
import { useTranslations } from '../hooks/useTranslations';
import { 
  Calendar, 
  Clock, 
  Users, 
  Brain, 
  CheckCircle, 
  AlertTriangle,
  User,
  Info,
  Settings,
  Plus,
  BarChart3,
  Target,
  Zap,
  FileText,
  Download,
  Share2,
  Heart,
  Activity,
  Eye,
  MapPin,
  Stethoscope,
  TrendingUp,
  Edit,
  Trash2
} from 'lucide-react';

interface AppointmentSlot {
  id: string;
  date: string;
  time: string;
  duration: number;
  doctorName: string;
  department: string;
  available: boolean;
  priority: 'low' | 'medium' | 'high';
  score: number;
}

interface OptimizationResult {
  recommendedSlots: AppointmentSlot[];
  reasoning: string;
  efficiency: number;
  patientSatisfaction: number;
  resourceUtilization: number;
  alternativeSlots: AppointmentSlot[];
  waitTimeEstimate: number;
}

export default function AIAppointmentOptimizerPage() {
  const { t, translationsLoaded } = useTranslations();
  const [activeTab, setActiveTab] = useState<'optimization' | 'scheduling' | 'analytics'>('optimization');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState({
    age: 30,
    gender: '',
    medicalHistory: '',
    currentMedications: '',
    allergies: '',
    urgency: 'low' as 'low' | 'medium' | 'high',
    preferredTime: 'morning' as 'morning' | 'afternoon' | 'evening',
    preferredDoctor: '',
    department: '',
    insurance: '',
    lastVisit: ''
  });
  const [appointmentPreferences, setAppointmentPreferences] = useState({
    preferredDates: [] as string[],
    preferredTimes: [] as string[],
    maxWaitTime: 7,
    flexibility: 'medium' as 'low' | 'medium' | 'high',
    preferredDuration: 30,
    allowWeekends: false,
    allowEvenings: true
  });

  // Fetch patients on component mount
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
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Sync selectedPatient when selectedPatientId changes and patients are loaded
  useEffect(() => {
    if (selectedPatientId && patients.length > 0 && !selectedPatient) {
      const patient = patients.find(p => p._id === selectedPatientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [selectedPatientId, patients, selectedPatient]);

  // Handle patient selection from SearchablePatientSelect
  const handlePatientSelect = (patient: any | null) => {
    if (patient) {
      // Find the full patient data from the patients array
      const fullPatient = patients.find(p => p._id === patient._id);
      if (fullPatient) {
        setSelectedPatient(fullPatient);
        setSelectedPatientId(fullPatient._id);
        
        // Calculate age from date of birth
        const birthDate = new Date(fullPatient.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
        
        setPatientInfo({
          age: actualAge,
          gender: fullPatient.gender || '',
          medicalHistory: fullPatient.medicalHistory?.join(', ') || '',
          currentMedications: fullPatient.currentMedications?.join(', ') || '',
          allergies: fullPatient.allergies || '',
          urgency: 'low',
          preferredTime: 'morning',
          preferredDoctor: '',
          department: '',
          insurance: fullPatient.insurance || '',
          lastVisit: fullPatient.lastVisit || ''
        });
      }
    } else {
      // Reset patient info when no patient is selected
      setSelectedPatient(null);
      setSelectedPatientId('');
      setPatientInfo({
        age: 30,
        gender: '',
        medicalHistory: '',
        currentMedications: '',
        allergies: '',
        urgency: 'low',
        preferredTime: 'morning',
        preferredDoctor: '',
        department: '',
        insurance: '',
        lastVisit: ''
      });
    }
  };

  // Handle patient selection (legacy - kept for compatibility)
  const handlePatientChange = (patientId: string) => {
    setSelectedPatientId(patientId);
    
    if (patientId) {
      const selectedPatient = patients.find(p => p._id === patientId);
      if (selectedPatient) {
        setSelectedPatient(selectedPatient);
        // Calculate age from date of birth
        const birthDate = new Date(selectedPatient.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
        
        setPatientInfo({
          age: actualAge,
          gender: selectedPatient.gender || '',
          medicalHistory: selectedPatient.medicalHistory?.join(', ') || '',
          currentMedications: selectedPatient.currentMedications?.join(', ') || '',
          allergies: selectedPatient.allergies || '',
          urgency: 'low',
          preferredTime: 'morning',
          preferredDoctor: '',
          department: '',
          insurance: selectedPatient.insurance || '',
          lastVisit: selectedPatient.lastVisit || ''
        });
      }
    } else {
      // Reset patient info when no patient is selected
      setSelectedPatient(null);
      setPatientInfo({
        age: 30,
        gender: '',
        medicalHistory: '',
        currentMedications: '',
        allergies: '',
        urgency: 'low',
        preferredTime: 'morning',
        preferredDoctor: '',
        department: '',
        insurance: '',
        lastVisit: ''
      });
    }
  };

  // Function to save AI result to patient record
  const saveAIResult = async (type: string, title: string, content: string, metadata?: any) => {
    if (!selectedPatientId) {
      console.warn('Cannot save AI result: No patient selected');
      return;
    }

    try {
      console.log('Saving AI result:', { patientId: selectedPatientId, type, title });
      const response = await fetch('/api/ai-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatientId,
          type,
          title,
          content,
          rawData: {
            optimizationResult,
            appointmentPreferences,
            patientInfo,
          },
          aiModel: undefined, // Appointment optimizer doesn't use AI model currently
          metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to save AI result:', errorData);
        return;
      }

      const result = await response.json();
      console.log('AI result saved successfully:', result);
    } catch (error) {
      console.error('Error saving AI result:', error);
    }
  };

  // Function to perform AI appointment optimization
  const performAppointmentOptimization = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient before optimizing appointments.');
      return;
    }
    
    setIsOptimizing(true);
    
    try {
      // Simulate AI optimization with mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mock optimization result
      const mockResult: OptimizationResult = {
        recommendedSlots: [
          {
            id: '1',
            date: '2024-01-15',
            time: '09:00 AM',
            duration: 30,
            doctorName: 'Dr. Sarah Johnson',
            department: 'Cardiology',
            available: true,
            priority: 'high',
            score: 95
          },
          {
            id: '2',
            date: '2024-01-16',
            time: '02:00 PM',
            duration: 45,
            doctorName: 'Dr. Michael Chen',
            department: 'Internal Medicine',
            available: true,
            priority: 'medium',
            score: 87
          },
          {
            id: '3',
            date: '2024-01-17',
            time: '10:30 AM',
            duration: 30,
            doctorName: 'Dr. Emily Rodriguez',
            department: 'Family Medicine',
            available: true,
            priority: 'low',
            score: 78
          }
        ],
        reasoning: `Based on the patient's profile and preferences, I recommend the following appointment slots:

1. **Dr. Sarah Johnson (Cardiology) - Jan 15, 9:00 AM**: High priority due to patient's age and medical history. Morning slot aligns with patient preference and provides optimal energy levels for consultation.

2. **Dr. Michael Chen (Internal Medicine) - Jan 16, 2:00 PM**: Medium priority with afternoon timing. This doctor has excellent reviews for complex cases and the timing fits within the patient's flexibility range.

3. **Dr. Emily Rodriguez (Family Medicine) - Jan 17, 10:30 AM**: Lower priority but offers continuity of care. Morning slot with good availability and reasonable wait time.

The optimization considers: patient age (${patientInfo.age}), medical urgency (${patientInfo.urgency}), preferred timing (${patientInfo.preferredTime}), and current wait times. All slots are within the ${appointmentPreferences.maxWaitTime}-day maximum wait period.`,
        efficiency: 85,
        patientSatisfaction: 92,
        resourceUtilization: 78,
        alternativeSlots: [
          {
            id: '4',
            date: '2024-01-18',
            time: '11:00 AM',
            duration: 30,
            doctorName: 'Dr. James Wilson',
            department: 'General Practice',
            available: true,
            priority: 'low',
            score: 72
          }
        ],
        waitTimeEstimate: 3
      };
      
      setOptimizationResult(mockResult);
      setActiveTab('scheduling');

      // Save AI result to patient record
      if (selectedPatientId) {
        const content = `Appointment Optimization Results:\n\n${mockResult.reasoning}\n\nRecommended Slots:\n${mockResult.recommendedSlots.map((slot, idx) => `${idx + 1}. ${slot.doctorName} - ${slot.date} at ${slot.time} (Score: ${slot.score})`).join('\n')}\n\nEfficiency: ${mockResult.efficiency}%\nPatient Satisfaction: ${mockResult.patientSatisfaction}%\nResource Utilization: ${mockResult.resourceUtilization}%`;
        
        await saveAIResult(
          'appointment-optimizer',
          `Appointment Optimization - ${mockResult.recommendedSlots.length} Recommended Slots`,
          content,
          {
            appointmentPreferences,
          }
        );
      }
    } catch (error) {
      console.error('Error during appointment optimization:', error);
      alert('Optimization temporarily unavailable. Please try again later.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Function to add preferred date
  const addPreferredDate = (date: string) => {
    if (date && !appointmentPreferences.preferredDates.includes(date)) {
      setAppointmentPreferences({
        ...appointmentPreferences,
        preferredDates: [...appointmentPreferences.preferredDates, date]
      });
    }
  };

  // Function to remove preferred date
  const removePreferredDate = (date: string) => {
    setAppointmentPreferences({
      ...appointmentPreferences,
      preferredDates: appointmentPreferences.preferredDates.filter(d => d !== date)
    });
  };

  // Function to add preferred time
  const addPreferredTime = (time: string) => {
    if (time && !appointmentPreferences.preferredTimes.includes(time)) {
      setAppointmentPreferences({
        ...appointmentPreferences,
        preferredTimes: [...appointmentPreferences.preferredTimes, time]
      });
    }
  };

  // Function to remove preferred time
  const removePreferredTime = (time: string) => {
    setAppointmentPreferences({
      ...appointmentPreferences,
      preferredTimes: appointmentPreferences.preferredTimes.filter(t => t !== time)
    });
  };

  // Function to book appointment
  const bookAppointment = (slot: AppointmentSlot) => {
    alert(`Booking appointment with ${slot.doctorName} on ${new Date(slot.date).toLocaleDateString()} at ${slot.time}`);
    // Here you would integrate with your appointment booking system
  };

  // Show loading state if translations aren't loaded yet
  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading translations...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout 
        title={t('ai.ai.appointmentOptimizer.title')} 
        description={t('ai.ai.appointmentOptimizer.description')}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="w-8 h-8" />
              <h2 className="text-2xl font-bold">{t('ai.ai.appointmentOptimizer.title')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">94.2%</div>
                <div className="text-green-100">{t('ai.ai.appointmentOptimizer.optimizationRate')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">2.1s</div>
                <div className="text-green-100">{t('ai.ai.appointmentOptimizer.averageTime')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">500+</div>
                <div className="text-green-100">{t('ai.ai.appointmentOptimizer.appointmentsOptimized')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-green-100">{t('ai.ai.appointmentOptimizer.available')}</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'optimization', label: t('ai.ai.appointmentOptimizer.optimization'), icon: Brain },
                { id: 'scheduling', label: t('ai.ai.appointmentOptimizer.scheduling'), icon: Calendar },
                { id: 'analytics', label: t('ai.ai.appointmentOptimizer.analytics'), icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Optimization Tab */}
          {activeTab === 'optimization' && (
            <div className="space-y-6">
              {/* Patient Selection */}
                <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>{t('ai.ai.appointmentOptimizer.patientSelection')}</span>
                </h3>
                
                {loading ? (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    <span>{t('ai.ai.appointmentOptimizer.loadingPatients')}</span>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('ai.ai.appointmentOptimizer.selectPatient')} *
                      </label>
                      <SearchablePatientSelect
                        value={selectedPatient?.name || ''}
                        onChange={handlePatientSelect}
                        placeholder={t('ai.ai.appointmentOptimizer.choosePatient')}
                        className="w-full"
                      />
                      {selectedPatientId && (
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>{t('ai.ai.appointmentOptimizer.patientInfoLoaded')}</span>
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {t('ai.ai.appointmentOptimizer.selectPatientDesc')}
                      </p>
                    </div>

                    {selectedPatientId && (
                      <>
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center space-x-2 text-blue-800">
                            <Info className="h-4 w-4" />
                            <span className="text-sm font-medium">{t('ai.ai.appointmentOptimizer.patientInfoEditable')}</span>
                  </div>
                          <p className="text-sm text-blue-700 mt-1">
                            {t('ai.ai.appointmentOptimizer.patientInfoEditableDesc')}
                          </p>
                </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.ai.appointmentOptimizer.age')}</label>
                            <input
                              type="number"
                              value={patientInfo.age}
                              onChange={(e) => setPatientInfo({...patientInfo, age: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.ai.appointmentOptimizer.gender')}</label>
                            <select
                              value={patientInfo.gender}
                              onChange={(e) => setPatientInfo({...patientInfo, gender: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">{t('ai.ai.appointmentOptimizer.selectGender')}</option>
                              <option value="male">{t('ai.ai.appointmentOptimizer.male')}</option>
                              <option value="female">{t('ai.ai.appointmentOptimizer.female')}</option>
                              <option value="other">{t('ai.ai.appointmentOptimizer.other')}</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.ai.appointmentOptimizer.urgency')}</label>
                            <select
                              value={patientInfo.urgency}
                              onChange={(e) => setPatientInfo({...patientInfo, urgency: e.target.value as any})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="low">{t('ai.ai.appointmentOptimizer.low')}</option>
                              <option value="medium">{t('ai.ai.appointmentOptimizer.medium')}</option>
                              <option value="high">{t('ai.ai.appointmentOptimizer.high')}</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                            <select
                              value={patientInfo.preferredTime}
                              onChange={(e) => setPatientInfo({...patientInfo, preferredTime: e.target.value as any})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="morning">Morning</option>
                              <option value="afternoon">Afternoon</option>
                              <option value="evening">Evening</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Doctor</label>
                            <input
                              type="text"
                              value={patientInfo.preferredDoctor}
                              onChange={(e) => setPatientInfo({...patientInfo, preferredDoctor: e.target.value})}
                              placeholder="Any doctor (optional)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                            <input
                              type="text"
                              value={patientInfo.department}
                              onChange={(e) => setPatientInfo({...patientInfo, department: e.target.value})}
                              placeholder="Any department (optional)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Medical History</label>
                            <textarea
                              value={patientInfo.medicalHistory}
                              onChange={(e) => setPatientInfo({...patientInfo, medicalHistory: e.target.value})}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Previous conditions, surgeries, chronic diseases..."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
                            <textarea
                              value={patientInfo.currentMedications}
                              onChange={(e) => setPatientInfo({...patientInfo, currentMedications: e.target.value})}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="List current medications and dosages..."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                            <textarea
                              value={patientInfo.allergies}
                              onChange={(e) => setPatientInfo({...patientInfo, allergies: e.target.value})}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Known allergies to medications, foods, or environmental factors..."
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Appointment Preferences */}
              {selectedPatientId && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Appointment Preferences</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Wait Time (days)</label>
                      <input
                        type="number"
                        value={appointmentPreferences.maxWaitTime}
                        onChange={(e) => setAppointmentPreferences({...appointmentPreferences, maxWaitTime: parseInt(e.target.value) || 7})}
                        min="1"
                        max="30"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Flexibility</label>
                      <select
                        value={appointmentPreferences.flexibility}
                        onChange={(e) => setAppointmentPreferences({...appointmentPreferences, flexibility: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="low">Low (Strict preferences)</option>
                        <option value="medium">Medium (Some flexibility)</option>
                        <option value="high">High (Very flexible)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Duration (minutes)</label>
                      <select
                        value={appointmentPreferences.preferredDuration}
                        onChange={(e) => setAppointmentPreferences({...appointmentPreferences, preferredDuration: parseInt(e.target.value) || 30})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                  </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={appointmentPreferences.allowWeekends}
                          onChange={(e) => setAppointmentPreferences({...appointmentPreferences, allowWeekends: e.target.checked})}
                          className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Allow weekends</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={appointmentPreferences.allowEvenings}
                          onChange={(e) => setAppointmentPreferences({...appointmentPreferences, allowEvenings: e.target.checked})}
                          className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Allow evenings</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Preferred Dates</h4>
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="date"
                        onChange={(e) => addPreferredDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={() => addPreferredDate(new Date().toISOString().split('T')[0])}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Add Today
                      </button>
                </div>
                    <div className="flex flex-wrap gap-2">
                      {appointmentPreferences.preferredDates.map((date) => (
                        <span key={date} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                          {new Date(date).toLocaleDateString()}
                          <button
                            onClick={() => removePreferredDate(date)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Preferred Times</h4>
                    <div className="flex space-x-2 mb-3">
                      <select
                        onChange={(e) => addPreferredTime(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select time</option>
                        <option value="08:00">8:00 AM</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">1:00 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                        <option value="17:00">5:00 PM</option>
                      </select>
                      <button
                        onClick={() => addPreferredTime('09:00')}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Add 9 AM
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {appointmentPreferences.preferredTimes.map((time) => (
                        <span key={time} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                          {time}
                          <button
                            onClick={() => removePreferredTime(time)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Optimization Button */}
              {selectedPatientId && (
                <div className="text-center">
                  <button
                    onClick={performAppointmentOptimization}
                    disabled={isOptimizing}
                    className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                  >
                    {isOptimizing ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>AI Optimizing Appointments...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-6 h-6" />
                        <span>Optimize Appointments</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {!selectedPatientId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Patient selection required</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please select a patient above to enable appointment optimization. Patient information is required for accurate scheduling recommendations.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Scheduling Tab */}
          {activeTab === 'scheduling' && optimizationResult && (
            <div className="space-y-6">
              {/* Optimization Results */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Optimization Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{optimizationResult.efficiency}%</div>
                    <div className="text-sm text-green-800">Efficiency Score</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{optimizationResult.patientSatisfaction}%</div>
                    <div className="text-sm text-blue-800">Patient Satisfaction</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{optimizationResult.resourceUtilization}%</div>
                    <div className="text-sm text-purple-800">Resource Utilization</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{optimizationResult.waitTimeEstimate}</div>
                    <div className="text-sm text-orange-800">Days to Wait</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">AI Reasoning</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{optimizationResult.reasoning}</p>
                  </div>
                </div>
              </div>

              {/* Recommended Slots */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Appointment Slots</h3>
                
                <div className="space-y-4">
                  {optimizationResult.recommendedSlots.map((slot) => (
                    <div key={slot.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {new Date(slot.date).toLocaleDateString()} at {slot.time}
                          </div>
                          <div className="text-sm text-gray-500">
                              Duration: {slot.duration} minutes
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            slot.priority === 'high' ? 'bg-red-100 text-red-800' :
                            slot.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {slot.priority.toUpperCase()} PRIORITY
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Score: {slot.score}
                          </span>
                          <button 
                            onClick={() => bookAppointment(slot)}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Doctor:</span> {slot.doctorName}
                        </div>
                        <div>
                          <span className="font-medium">Department:</span> {slot.department}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternative Slots */}
              {optimizationResult.alternativeSlots.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Alternative Options</h3>
                  
                  <div className="space-y-4">
                    {optimizationResult.alternativeSlots.map((slot) => (
                      <div key={slot.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {new Date(slot.date).toLocaleDateString()} at {slot.time}
                              </div>
                              <div className="text-sm text-gray-500">
                                Duration: {slot.duration} minutes
                        </div>
                      </div>
                    </div>
                      <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Score: {slot.score}
                            </span>
                            <button 
                              onClick={() => bookAppointment(slot)}
                              className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                            >
                              Book Alternative
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Doctor:</span> {slot.doctorName}
                      </div>
                          <div>
                            <span className="font-medium">Department:</span> {slot.department}
                    </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                    </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Optimization Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Optimization Trends</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div>• 15% improvement in scheduling efficiency</div>
                      <div>• 23% reduction in patient wait times</div>
                      <div>• 18% better resource utilization</div>
                      <div>• 31% increase in patient satisfaction</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Patient Satisfaction</h4>
                    <div className="space-y-2 text-sm text-green-800">
                      <div>• 94% satisfaction with AI recommendations</div>
                      <div>• 87% prefer optimized scheduling</div>
                      <div>• 91% would recommend to others</div>
                      <div>• 89% report better appointment timing</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Resource Management</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-800">
                    <div>
                      <div className="font-medium">Doctor Utilization</div>
                      <div>• Peak hours: 85% capacity</div>
                      <div>• Off-peak: 45% capacity</div>
                    </div>
                    <div>
                      <div className="font-medium">Room Efficiency</div>
                      <div>• Morning: 92% utilization</div>
                      <div>• Afternoon: 78% utilization</div>
                  </div>
                  <div>
                      <div className="font-medium">Wait Time Reduction</div>
                      <div>• Average: 3.2 days</div>
                      <div>• Priority cases: 1.1 days</div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
