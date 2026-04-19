'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/app/protected-route';
import SidebarLayout from '@/app/components/sidebar-layout';
import { useTranslations } from '@/app/hooks/useTranslations';
import SearchablePatientSelect from '@/app/components/SearchablePatientSelect';
import { ArrowLeft, Save, Radio } from 'lucide-react';

interface Patient { _id: string; name: string; email?: string; phone?: string; dateOfBirth?: string; gender?: string; }
interface Doctor { _id: string; name: string; specialization?: string; }

export default function NewRadiologyStudyPage() {
  const router = useRouter();
  const { t, translationsLoaded } = useTranslations();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [formData, setFormData] = useState({
    patientId: '', patientName: '', patientAge: '', patientGender: '',
    referringDoctorId: '', referringDoctorName: '',
    studyType: 'x-ray', bodyPart: '', studyDescription: '',
    clinicalHistory: '', indication: '', priority: 'routine',
    scheduledDate: '', contrastUsed: false, contrastDetails: '', notes: '',
  });

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      if (response.ok) setDoctors(await response.json());
    } catch (error) { console.error('Error fetching doctors:', error); }
  };

  const handlePatientChange = (patient: Patient | null) => {
    setSelectedPatient(patient);
    if (patient) {
      let age = '';
      if (patient.dateOfBirth) {
        try {
          const birthDate = new Date(patient.dateOfBirth);
          const calculatedAge = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          if (!isNaN(calculatedAge) && calculatedAge >= 0) {
            age = String(calculatedAge);
          }
        } catch (e) {
          console.error('Error calculating age:', e);
        }
      }
      setFormData(prev => ({ 
        ...prev, 
        patientId: patient._id, 
        patientName: patient.name, 
        patientAge: age, 
        patientGender: patient.gender || '' 
      }));
    } else {
      setFormData(prev => ({ ...prev, patientId: '', patientName: '', patientAge: '', patientGender: '' }));
    }
  };

  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const doctorId = e.target.value;
    const doctor = doctors.find(d => d._id === doctorId);
    setFormData(prev => ({ ...prev, referringDoctorId: doctorId, referringDoctorName: doctor?.name || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) { setError(t('radiology.pleaseSelectPatient')); return; }
    setSubmitting(true); setError('');

    try {
      const response = await fetch('/api/radiology', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, patientAge: formData.patientAge ? parseInt(formData.patientAge) : undefined }),
      });
      if (response.ok) {
        const study = await response.json();
        router.push(`/radiology/${study._id}`);
      } else {
        const data = await response.json();
        setError(data.error || t('common.error'));
      }
    } catch { setError(t('common.error')); }
    finally { setSubmitting(false); }
  };

  const studyTypes = [
    { value: 'x-ray', label: 'X-Ray' }, { value: 'ct-scan', label: 'CT Scan' }, { value: 'mri', label: 'MRI' },
    { value: 'ultrasound', label: 'Ultrasound' }, { value: 'mammography', label: 'Mammography' },
    { value: 'fluoroscopy', label: 'Fluoroscopy' }, { value: 'pet-scan', label: 'PET Scan' },
    { value: 'dexa-scan', label: 'DEXA Scan' }, { value: 'other', label: 'Other' },
  ];

  const bodyParts = ['Head', 'Neck', 'Chest', 'Abdomen', 'Pelvis', 'Spine - Cervical', 'Spine - Thoracic', 'Spine - Lumbar',
    'Shoulder', 'Elbow', 'Wrist', 'Hand', 'Hip', 'Knee', 'Ankle', 'Foot', 'Upper Extremity', 'Lower Extremity', 'Full Body', 'Other'];

  if (!translationsLoaded) {
    return <ProtectedRoute><SidebarLayout title="" description=""><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></SidebarLayout></ProtectedRoute>;
  }

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('radiology.newStudy')} description={t('radiology.newStudyDescription')}>
        <div className="max-w-4xl">
          <Link href="/radiology" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-5 w-5" /><span>{t('common.back')}</span>
          </Link>

          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Selection */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Radio className="h-5 w-5 text-blue-600" />{t('radiology.patientInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('radiology.selectPatient')} *</label>
                  <SearchablePatientSelect value={selectedPatient?.name || ''} onChange={handlePatientChange} placeholder={t('radiology.searchPatient')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('radiology.patientAge')}</label>
                  <input type="text" value={formData.patientAge} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('radiology.patientGender')}</label>
                  <input type="text" value={formData.patientGender} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                </div>
              </div>
            </div>

            {/* Study Details */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('radiology.studyDetails')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('radiology.studyType')} *</label>
                  <select required value={formData.studyType} onChange={(e) => setFormData({ ...formData, studyType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {studyTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('radiology.bodyPart')} *</label>
                  <select required value={formData.bodyPart} onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">{t('radiology.selectBodyPart')}</option>
                    {bodyParts.map(part => <option key={part} value={part}>{part}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('radiology.studyDescription')} *</label>
                  <input type="text" required value={formData.studyDescription} onChange={(e) => setFormData({ ...formData, studyDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={t('radiology.studyDescriptionPlaceholder')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('radiology.referringDoctor')}</label>
                  <select value={formData.referringDoctorId} onChange={handleDoctorChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">{t('radiology.selectDoctor')}</option>
                    {doctors.map(doc => <option key={doc._id} value={doc._id}>{doc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('radiology.priority')}</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="routine">{t('radiology.priorityLabels.routine')}</option>
                    <option value="urgent">{t('radiology.priorityLabels.urgent')}</option>
                    <option value="stat">{t('radiology.priorityLabels.stat')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('radiology.scheduledDate')}</label>
                  <input type="datetime-local" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
            </div>

            {/* Clinical Information */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('radiology.clinicalInfo')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('radiology.indication')}</label>
                  <input type="text" value={formData.indication} onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={t('radiology.indicationPlaceholder')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('radiology.clinicalHistory')}</label>
                  <textarea rows={3} value={formData.clinicalHistory} onChange={(e) => setFormData({ ...formData, clinicalHistory: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={t('radiology.clinicalHistoryPlaceholder')} />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="contrastUsed" checked={formData.contrastUsed} onChange={(e) => setFormData({ ...formData, contrastUsed: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <label htmlFor="contrastUsed" className="text-sm font-medium text-gray-700">{t('radiology.contrastUsed')}</label>
                </div>
                {formData.contrastUsed && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('radiology.contrastDetails')}</label>
                    <input type="text" value={formData.contrastDetails} onChange={(e) => setFormData({ ...formData, contrastDetails: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('radiology.notes')}</label>
                  <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4">
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Save className="h-5 w-5" /><span>{submitting ? t('common.saving') : t('radiology.orderStudy')}</span>
              </button>
              <Link href="/radiology" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</Link>
            </div>
          </form>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
