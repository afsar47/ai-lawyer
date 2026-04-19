'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Scale,
  Save,
  ArrowLeft,
  AlertCircle,
  FileText,
  Settings,
  CheckCircle,
  Shield,
  Award,
  GraduationCap,
  Building
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import SearchablePatientSelect from '../../components/SearchablePatientSelect';
import SearchableDoctorSelect from '../../components/SearchableDoctorSelect';
import { useTranslations } from '../../hooks/useTranslations';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  email: string;
  phone: string;
}

interface AppointmentFormData {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  reason: string;
  notes: string;
  status: string;
}

interface Doctor {
  _id: string;
  name: string;
  email: string;
  role?: string;
  qualifications?: string[];
  specialization?: string;
  department?: string;
}

export default function NewAppointmentPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'patient' | 'appointment' | 'details' | 'review'>('patient');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [formData, setFormData] = useState<AppointmentFormData>({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    doctorName: '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentType: 'consultation',
    reason: '',
    notes: '',
    status: 'scheduled'
  });

  // Auto-set doctor if logged in as doctor
  useEffect(() => {
    if (session?.user?.role === 'doctor' && session.user.name) {
      const doctor: Doctor = {
        _id: session.user.id || '',
        name: session.user.name,
        email: session.user.email || '',
        role: 'doctor'
      };
      setSelectedDoctor(doctor);
      setFormData(prev => ({
        ...prev,
        doctorName: session.user.name
      }));
    }
  }, [session]);

  // Handle doctor selection
  const handleDoctorSelect = (doctor: Doctor | null) => {
    setSelectedDoctor(doctor);
    if (doctor) {
      setFormData(prev => ({
        ...prev,
        doctorName: doctor.name
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        doctorName: ''
      }));
    }
  };

  const appointmentTypes = [
    { value: 'consultation', label: t('appointments.types.consultation') },
    { value: 'follow-up', label: t('appointments.types.followUp') },
    { value: 'checkup', label: t('appointments.types.checkup') },
    { value: 'emergency', label: t('appointments.types.emergency') },
    { value: 'surgery', label: t('appointments.types.surgery') },
    { value: 'therapy', label: t('appointments.types.therapy') }
  ];

  const statusOptions = [
    { value: 'scheduled', label: t('appointments.status.scheduled') },
    { value: 'confirmed', label: t('appointments.status.confirmed') },
    { value: 'in-progress', label: t('appointments.status.inProgress') },
    { value: 'completed', label: t('appointments.status.completed') },
    { value: 'cancelled', label: t('appointments.status.cancelled') }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePatientSelect = (patient: Patient | null) => {
    setSelectedPatient(patient);
    if (patient) {
      setFormData(prev => ({
        ...prev,
        patientName: patient.name,
        patientEmail: patient.email,
        patientPhone: patient.phone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        patientName: '',
        patientEmail: '',
        patientPhone: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = t('appointments.validation.patientNameRequired');
    }

    if (!formData.patientEmail.trim()) {
      newErrors.patientEmail = t('appointments.validation.patientEmailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.patientEmail)) {
      newErrors.patientEmail = t('appointments.validation.patientEmailInvalid');
    }

    if (!formData.patientPhone.trim()) {
      newErrors.patientPhone = t('appointments.validation.patientPhoneRequired');
    }

    if (!formData.doctorName.trim()) {
      newErrors.doctorName = t('appointments.validation.doctorNameRequired');
    }

    if (!formData.appointmentDate) {
      newErrors.appointmentDate = t('appointments.validation.appointmentDateRequired');
    } else {
      const selectedDate = new Date(formData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.appointmentDate = t('appointments.validation.appointmentDatePast');
      }
    }

    if (!formData.appointmentTime) {
      newErrors.appointmentTime = t('appointments.validation.appointmentTimeRequired');
    }

    if (!formData.reason.trim()) {
      newErrors.reason = t('appointments.validation.reasonRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/appointments');
      } else {
        const errorData = await response.json();
        console.error('Error creating appointment:', errorData);
        // Handle error - could show a toast notification
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      // Handle error - could show a toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/appointments');
  };

  const nextTab = () => {
    const tabs = ['patient', 'appointment', 'details', 'review'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1] as any);
    }
  };

  const prevTab = () => {
    const tabs = ['patient', 'appointment', 'details', 'review'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1] as any);
    }
  };

  const isTabValid = (tab: string) => {
    switch (tab) {
      case 'patient':
        return formData.patientName && formData.patientEmail && formData.patientPhone;
      case 'appointment':
        return formData.doctorName && formData.appointmentDate && formData.appointmentTime;
      case 'details':
        return formData.reason;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout 
        title={t('appointments.newAppointment')} 
        description={t('appointments.newAppointmentDesc')}
      >
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={handleCancel}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[
                { id: 'patient', label: t('appointments.tabs.patientInfo'), icon: User },
                { id: 'appointment', label: t('appointments.tabs.appointmentDetails'), icon: Calendar },
                { id: 'details', label: t('appointments.tabs.additionalInfo'), icon: FileText },
                { id: 'review', label: t('appointments.tabs.review'), icon: CheckCircle }
              ].map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    activeTab === step.id 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : isTabValid(step.id)
                        ? 'bg-green-100 border-green-500 text-green-600'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      activeTab === step.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  {index < 3 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      isTabValid(step.id) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'patient', label: t('appointments.tabs.patientInfo'), icon: User },
                { id: 'appointment', label: t('appointments.tabs.appointmentDetails'), icon: Calendar },
                { id: 'details', label: t('appointments.tabs.additionalInfo'), icon: FileText },
                { id: 'review', label: t('appointments.tabs.review'), icon: CheckCircle }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Patient Information Tab */}
            {activeTab === 'patient' && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <User className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">{t('appointments.tabs.patientInfo')}</h2>
                </div>
                
                {/* Patient Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('appointments.selectPatient')} *
                  </label>
                  <SearchablePatientSelect
                    value={selectedPatient?.name || ''}
                    onChange={handlePatientSelect}
                    placeholder={t('appointments.placeholders.selectPatient')}
                    className="w-full"
                  />
                  {errors.patientName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.patientName}
                    </p>
                  )}
                </div>

                {/* Manual Patient Entry */}
                <div className="border-t pt-6">
                  <div className="flex items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{t('appointments.manualEntry')}</h3>
                    <span className="ml-2 text-sm text-gray-500">({t('appointments.or')})</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="patientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('appointments.patientEmail')} *
                      </label>
                      <input
                        type="email"
                        id="patientEmail"
                        name="patientEmail"
                        value={formData.patientEmail}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.patientEmail ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder={t('appointments.placeholders.patientEmail')}
                      />
                      {errors.patientEmail && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.patientEmail}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('appointments.patientPhone')} *
                      </label>
                      <input
                        type="tel"
                        id="patientPhone"
                        name="patientPhone"
                        value={formData.patientPhone}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.patientPhone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder={t('appointments.placeholders.patientPhone')}
                      />
                      {errors.patientPhone && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.patientPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appointment Details Tab */}
            {activeTab === 'appointment' && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <Calendar className="w-6 h-6 text-green-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">{t('appointments.tabs.appointmentDetails')}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('appointments.doctorName')} *
                    </label>
                    <SearchableDoctorSelect
                      value={formData.doctorName}
                      onChange={handleDoctorSelect}
                      placeholder={t('appointments.placeholders.selectDoctor') || 'Select a lawyer'}
                      disabled={session?.user?.role === 'doctor'}
                      className={errors.doctorName ? 'border-red-300' : ''}
                    />
                    {errors.doctorName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.doctorName}
                      </p>
                    )}
                    
                    {/* Lawyer Details Card */}
                    {selectedDoctor && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Scale className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">
                              {selectedDoctor.name}
                            </h4>
                            <div className="space-y-1.5 text-xs text-gray-600">
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{selectedDoctor.email}</span>
                              </div>
                              {selectedDoctor.qualifications && selectedDoctor.qualifications.length > 0 && (
                                <div className="flex items-start">
                                  <Award className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <div className="flex flex-wrap gap-1">
                                    {selectedDoctor.qualifications.map((qual, index) => (
                                      <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                                        {qual}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {selectedDoctor.specialization && (
                                <div className="flex items-center">
                                  <GraduationCap className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{selectedDoctor.specialization}</span>
                                </div>
                              )}
                              {selectedDoctor.department && (
                                <div className="flex items-center">
                                  <Building className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{selectedDoctor.department}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="appointmentType" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('appointments.appointmentType')}
                    </label>
                    <select
                      id="appointmentType"
                      name="appointmentType"
                      value={formData.appointmentType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {appointmentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('appointments.appointmentDate')} *
                    </label>
                    <input
                      type="date"
                      id="appointmentDate"
                      name="appointmentDate"
                      value={formData.appointmentDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.appointmentDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.appointmentDate && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.appointmentDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('appointments.appointmentTime')} *
                    </label>
                    <input
                      type="time"
                      id="appointmentTime"
                      name="appointmentTime"
                      value={formData.appointmentTime}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.appointmentTime ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.appointmentTime && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.appointmentTime}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('appointments.status')}
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <FileText className="w-6 h-6 text-purple-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">{t('appointments.tabs.additionalInfo')}</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('appointments.reason')} *
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.reason ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder={t('appointments.placeholders.reason')}
                    />
                    {errors.reason && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.reason}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('appointments.notes')}
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('appointments.placeholders.notes')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Review Tab */}
            {activeTab === 'review' && (
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">{t('appointments.tabs.review')}</h2>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">{t('appointments.patientInformation')}</h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-700"><span className="font-medium text-gray-900">Name:</span> {formData.patientName || 'Not provided'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-900">Email:</span> {formData.patientEmail || 'Not provided'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-900">Phone:</span> {formData.patientPhone || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">{t('appointments.appointmentDetails')}</h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-700"><span className="font-medium text-gray-900">Lawyer:</span> {formData.doctorName || 'Not provided'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-900">Type:</span> {appointmentTypes.find(t => t.value === formData.appointmentType)?.label || 'Not selected'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-900">Date:</span> {formData.appointmentDate || 'Not selected'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-900">Time:</span> {formData.appointmentTime || 'Not selected'}</p>
                        <p className="text-gray-700"><span className="font-medium text-gray-900">Status:</span> {statusOptions.find(s => s.value === formData.status)?.label || 'Not selected'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {formData.reason && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">{t('appointments.reason')}</h3>
                      <p className="text-sm text-gray-600">{formData.reason}</p>
                    </div>
                  )}
                  
                  {formData.notes && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">{t('appointments.notes')}</h3>
                      <p className="text-sm text-gray-600">{formData.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>

            {/* Tab Navigation Buttons */}
            <div className="flex justify-between mt-6">
            <div>
              {activeTab !== 'patient' && (
                <button
                  type="button"
                  onClick={prevTab}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {t('common.previous')}
                </button>
              )}
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                {t('common.cancel')}
              </button>
              
              {activeTab !== 'review' ? (
                <button
                  type="button"
                  onClick={nextTab}
                  disabled={!isTabValid(activeTab)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.next')}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('appointments.creating')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {t('appointments.createAppointment')}
                    </>
                  )}
                </button>
               )}
             </div>
           </div>
         </form>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}