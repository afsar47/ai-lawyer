'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/app/protected-route';
import SidebarLayout from '@/app/components/sidebar-layout';
import { useTranslations } from '@/app/hooks/useTranslations';
import SearchablePatientSelect from '@/app/components/SearchablePatientSelect';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';

interface Ward { _id: string; wardNumber: string; name: string; type: string; availableBeds: number; dailyRate: number; }
interface Bed { _id: string; bedNumber: string; type: string; status: string; dailyRate: number; }
interface Doctor { _id: string; name: string; specialization?: string; }
interface Patient { _id: string; name: string; email?: string; phone?: string; age?: number; gender?: string; }

export default function NewAdmissionPage() {
  const router = useRouter();
  const { t, translationsLoaded } = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [formData, setFormData] = useState({
    patientId: '', patientName: '', patientEmail: '', patientPhone: '', patientAge: 0, patientGender: '',
    wardId: '', bedId: '', admittingDoctorId: '', admittingDoctorName: '', admissionType: 'elective',
    admissionDate: new Date().toISOString().split('T')[0], expectedDischargeDate: '',
    chiefComplaint: '', admissionDiagnosis: '', priority: 'normal', allergies: [] as string[],
    dietaryRestrictions: '', specialInstructions: '',
    emergencyContactName: '', emergencyContactRelationship: '', emergencyContactPhone: '',
  });
  const [newAllergy, setNewAllergy] = useState('');

  useEffect(() => { fetchWards(); fetchDoctors(); }, []);
  useEffect(() => { if (formData.wardId) fetchBeds(formData.wardId); else setBeds([]); }, [formData.wardId]);

  const fetchWards = async () => {
    const res = await fetch('/api/inpatient/wards?isActive=true&hasAvailableBeds=true');
    if (res.ok) setWards(await res.json());
  };
  const fetchBeds = async (wardId: string) => {
    const res = await fetch(`/api/inpatient/beds?wardId=${wardId}&status=available`);
    if (res.ok) setBeds(await res.json());
  };
  const fetchDoctors = async () => {
    const res = await fetch('/api/doctors');
    if (res.ok) setDoctors(await res.json());
  };

  const handlePatientChange = (patient: Patient | null) => {
    setSelectedPatient(patient);
    if (patient) {
      setFormData({ ...formData, patientId: patient._id, patientName: patient.name,
        patientEmail: patient.email || '', patientPhone: patient.phone || '',
        patientAge: patient.age || 0, patientGender: patient.gender || '' });
    } else {
      setFormData({ ...formData, patientId: '', patientName: '', patientEmail: '', patientPhone: '', patientAge: 0, patientGender: '' });
    }
  };

  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors.find(d => d._id === doctorId);
    setFormData({ ...formData, admittingDoctorId: doctorId, admittingDoctorName: doctor?.name || '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) { setError(t('inpatient.selectPatientError')); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/inpatient/admissions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, emergencyContact: { name: formData.emergencyContactName, relationship: formData.emergencyContactRelationship, phone: formData.emergencyContactPhone } }),
      });
      if (res.ok) router.push('/inpatient/admissions');
      else { const data = await res.json(); setError(data.error || t('common.error')); }
    } catch { setError(t('common.error')); }
    finally { setLoading(false); }
  };

  const addAllergy = () => { if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) { setFormData({ ...formData, allergies: [...formData.allergies, newAllergy.trim()] }); setNewAllergy(''); } };
  const removeAllergy = (a: string) => setFormData({ ...formData, allergies: formData.allergies.filter(x => x !== a) });

  if (!translationsLoaded) return <ProtectedRoute><SidebarLayout title="" description=""><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></SidebarLayout></ProtectedRoute>;

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('inpatient.newAdmission')} description={t('inpatient.newAdmissionDescription')}>
        <div className="max-w-4xl">
          <Link href="/inpatient/admissions" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-5 w-5" /><span>{t('common.back')}</span>
          </Link>
          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><UserPlus className="h-5 w-5 text-blue-600" />{t('inpatient.patientInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.selectPatient')} *</label>
                  <SearchablePatientSelect value={selectedPatient?.name || ''} onChange={handlePatientChange} placeholder={t('inpatient.searchPatient')} />
                </div>
                {selectedPatient && (<>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.email')}</label><input type="email" value={formData.patientEmail} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.phone')}</label><input type="tel" value={formData.patientPhone} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" /></div>
                </>)}
              </div>
            </div>
            {/* Ward & Bed */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">{t('inpatient.wardBedAssignment')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.ward')} *</label>
                  <select required value={formData.wardId} onChange={(e) => setFormData({ ...formData, wardId: e.target.value, bedId: '' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">{t('inpatient.selectWard')}</option>
                    {wards.map(w => <option key={w._id} value={w._id}>{w.name} ({w.wardNumber}) - {w.availableBeds} beds</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.bed')} *</label>
                  <select required value={formData.bedId} onChange={(e) => setFormData({ ...formData, bedId: e.target.value })} disabled={!formData.wardId} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">{t('inpatient.selectBed')}</option>
                    {beds.map(b => <option key={b._id} value={b._id}>{b.bedNumber} - ${b.dailyRate}/day</option>)}
                  </select>
                </div>
              </div>
            </div>
            {/* Doctor & Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">{t('inpatient.admissionDetails')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.admittingDoctor')} *</label>
                  <select required value={formData.admittingDoctorId} onChange={(e) => handleDoctorChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">{t('inpatient.selectDoctor')}</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.admissionType')} *</label>
                  <select required value={formData.admissionType} onChange={(e) => setFormData({ ...formData, admissionType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="elective">{t('inpatient.admissionTypes.elective')}</option>
                    <option value="emergency">{t('inpatient.admissionTypes.emergency')}</option>
                    <option value="transfer">{t('inpatient.admissionTypes.transfer')}</option>
                    <option value="referral">{t('inpatient.admissionTypes.referral')}</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.admissionDate')} *</label>
                  <input type="date" required value={formData.admissionDate} onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.priority')} *</label>
                  <select required value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="normal">{t('inpatient.priorityLabels.normal')}</option>
                    <option value="urgent">{t('inpatient.priorityLabels.urgent')}</option>
                    <option value="critical">{t('inpatient.priorityLabels.critical')}</option>
                  </select>
                </div>
              </div>
              <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.chiefComplaint')} *</label>
                <textarea required rows={3} value={formData.chiefComplaint} onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.admissionDiagnosis')}</label>
                <textarea rows={2} value={formData.admissionDiagnosis} onChange={(e) => setFormData({ ...formData, admissionDiagnosis: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            {/* Allergies */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">{t('inpatient.medicalInfo')}</h3>
              <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.allergies')}</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={t('inpatient.allergyPlaceholder')} />
                  <button type="button" onClick={addAllergy} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.add')}</button>
                </div>
                <div className="flex flex-wrap gap-2">{formData.allergies.map((a, i) => <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">{a}<button type="button" onClick={() => removeAllergy(a)}>×</button></span>)}</div>
              </div>
            </div>
            {/* Emergency Contact */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">{t('inpatient.emergencyContact')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.contactName')}</label><input type="text" value={formData.emergencyContactName} onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.relationship')}</label><input type="text" value={formData.emergencyContactRelationship} onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.contactPhone')}</label><input type="tel" value={formData.emergencyContactPhone} onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
              </div>
            </div>
            {/* Submit */}
            <div className="flex items-center gap-4">
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Save className="h-5 w-5" /><span>{loading ? t('common.saving') : t('inpatient.admitPatient')}</span>
              </button>
              <Link href="/inpatient/admissions" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</Link>
            </div>
          </form>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
