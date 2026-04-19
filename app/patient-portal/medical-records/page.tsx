'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from '../../hooks/useTranslations';
import { 
  ClipboardList,
  Heart,
  Droplets,
  AlertCircle,
  Pill,
  FileText,
  Activity,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  UserCircle
} from 'lucide-react';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory: string[];
  allergies: string[];
  currentMedications: string[];
  bloodType?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  assignedDoctor?: string;
}

export default function PatientMedicalRecordsPage() {
  const { data: session } = useSession();
  const { t } = useTranslations();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedicalRecords = async () => {
      try {
        const res = await fetch('/api/patient-portal/medical-records');
        const data = await res.json();
        setPatient(data.patient);
      } catch (error) {
        console.error('Error fetching medical records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalRecords();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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

  if (!patient) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
        <ClipboardList className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">{t('patientPortal.medicalRecords.notFound')}</h3>
        <p className="text-gray-500 mt-1">{t('patientPortal.medicalRecords.notFoundDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('patientPortal.medicalRecords.title')}</h1>
        <p className="text-gray-600 mt-1">{t('patientPortal.medicalRecords.subtitle')}</p>
      </div>

      {/* Patient Info Card */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <UserCircle className="h-12 w-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{patient.name}</h2>
            <p className="text-teal-100">{patient.patientId}</p>
            <div className="flex items-center gap-4 mt-2 text-teal-100 text-sm">
              <span>{calculateAge(patient.dateOfBirth)} {t('patientPortal.medicalRecords.yearsOld')}</span>
              <span>•</span>
              <span className="capitalize">{patient.gender}</span>
              {patient.bloodType && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Droplets className="h-4 w-4" />
                    {patient.bloodType}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Medical History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">{t('patientPortal.medicalRecords.medicalHistory')}</h3>
          </div>
          <div className="p-5">
            {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
              <ul className="space-y-2">
                {patient.medicalHistory.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">{t('patientPortal.medicalRecords.noMedicalHistory')}</p>
            )}
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">{t('patientPortal.medicalRecords.allergies')}</h3>
          </div>
          <div className="p-5">
            {patient.allergies && patient.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm border border-orange-200"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">{t('patientPortal.medicalRecords.noAllergies')}</p>
            )}
          </div>
        </div>

        {/* Current Medications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Pill className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-gray-900">{t('patientPortal.medicalRecords.currentMedications')}</h3>
          </div>
          <div className="p-5">
            {patient.currentMedications && patient.currentMedications.length > 0 ? (
              <ul className="space-y-2">
                {patient.currentMedications.map((medication, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{medication}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">{t('patientPortal.medicalRecords.noMedications')}</p>
            )}
          </div>
        </div>

        {/* Insurance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">{t('patientPortal.medicalRecords.insurance')}</h3>
          </div>
          <div className="p-5">
            {patient.insuranceProvider ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">{t('patientPortal.medicalRecords.provider')}</p>
                  <p className="font-medium text-gray-900">{patient.insuranceProvider}</p>
                </div>
                {patient.insuranceNumber && (
                  <div>
                    <p className="text-sm text-gray-500">{t('patientPortal.medicalRecords.policyNumber')}</p>
                    <p className="font-medium text-gray-900">{patient.insuranceNumber}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">{t('patientPortal.medicalRecords.noInsurance')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      {patient.emergencyContact && patient.emergencyContact.name && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5" />
            {t('patientPortal.medicalRecords.emergencyContact')}
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-red-600">{t('patientPortal.medicalRecords.contactName')}</p>
              <p className="font-medium text-red-900">{patient.emergencyContact.name}</p>
            </div>
            <div>
              <p className="text-sm text-red-600">{t('patientPortal.medicalRecords.contactPhone')}</p>
              <p className="font-medium text-red-900">{patient.emergencyContact.phone}</p>
            </div>
            <div>
              <p className="text-sm text-red-600">{t('patientPortal.medicalRecords.relationship')}</p>
              <p className="font-medium text-red-900">{patient.emergencyContact.relationship}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
