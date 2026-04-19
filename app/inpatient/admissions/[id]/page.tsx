'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/app/protected-route';
import SidebarLayout from '@/app/components/sidebar-layout';
import { useTranslations } from '@/app/hooks/useTranslations';
import { ArrowLeft, User, Calendar, Heart, FileText, AlertCircle, CheckCircle, Printer, Edit, LogOut, Plus } from 'lucide-react';

interface VitalSign { timestamp: string; bloodPressure?: string; pulse?: number; temperature?: number; oxygenSaturation?: number; notes?: string; recordedBy?: string; }
interface NursingNote { timestamp: string; note: string; nurseName: string; category: string; }
interface Admission {
  _id: string; admissionNumber: string; patientId: string; patientName: string; patientEmail?: string; patientPhone?: string;
  wardId: string; wardName: string; bedId: string; bedNumber: string; admittingDoctorName: string;
  admissionType: string; admissionDate: string; chiefComplaint: string; admissionDiagnosis?: string;
  status: string; priority: string; vitalSigns: VitalSign[]; nursingNotes: NursingNote[]; allergies: string[];
  emergencyContact?: { name: string; relationship: string; phone: string };
  dischargeInfo?: { dischargeType: string; dischargeSummary?: string; dischargeInstructions?: string; followUpDate?: string; dischargedBy?: string; dischargedAt?: string };
  createdAt: string;
}

export default function AdmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { t, translationsLoaded } = useTranslations();
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [vitalForm, setVitalForm] = useState({ bloodPressure: '', pulse: '', temperature: '', oxygenSaturation: '', notes: '' });
  const [noteForm, setNoteForm] = useState({ note: '', category: 'routine' });

  useEffect(() => { fetchAdmission(); }, [resolvedParams.id]);

  const fetchAdmission = async () => {
    try { const res = await fetch(`/api/inpatient/admissions/${resolvedParams.id}`); if (res.ok) setAdmission(await res.json()); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAddVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/inpatient/admissions/${resolvedParams.id}/vitals`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bloodPressure: vitalForm.bloodPressure || undefined, pulse: vitalForm.pulse ? parseInt(vitalForm.pulse) : undefined, temperature: vitalForm.temperature ? parseFloat(vitalForm.temperature) : undefined, oxygenSaturation: vitalForm.oxygenSaturation ? parseInt(vitalForm.oxygenSaturation) : undefined, notes: vitalForm.notes || undefined }),
    });
    if (res.ok) { setShowVitalModal(false); setVitalForm({ bloodPressure: '', pulse: '', temperature: '', oxygenSaturation: '', notes: '' }); fetchAdmission(); }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/inpatient/admissions/${resolvedParams.id}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(noteForm) });
    if (res.ok) { setShowNoteModal(false); setNoteForm({ note: '', category: 'routine' }); fetchAdmission(); }
  };

  const getStatusColor = (s: string) => ({ 'admitted': 'bg-blue-100 text-blue-800', 'in-treatment': 'bg-purple-100 text-purple-800', 'ready-for-discharge': 'bg-green-100 text-green-800', 'discharged': 'bg-gray-100 text-gray-800' }[s] || 'bg-gray-100 text-gray-800');
  const getPriorityColor = (p: string) => ({ 'normal': 'bg-green-100 text-green-800', 'urgent': 'bg-orange-100 text-orange-800', 'critical': 'bg-red-100 text-red-800' }[p] || 'bg-gray-100 text-gray-800');
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatDateTime = (d: string) => new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (!translationsLoaded || loading) return <ProtectedRoute><SidebarLayout title="" description=""><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></SidebarLayout></ProtectedRoute>;
  if (!admission) return <ProtectedRoute><SidebarLayout title="" description=""><div className="text-center py-12"><p className="text-gray-500">{t('inpatient.admissionNotFound')}</p><Link href="/inpatient/admissions" className="text-blue-600 hover:underline">{t('common.back')}</Link></div></SidebarLayout></ProtectedRoute>;

  const isActive = !['discharged', 'transferred', 'deceased', 'lama'].includes(admission.status);

  return (
    <ProtectedRoute>
      <SidebarLayout title={admission.patientName} description={admission.admissionNumber}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between no-print">
            <Link href="/inpatient/admissions" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="h-5 w-5" /><span>{t('common.back')}</span></Link>
            <div className="flex items-center gap-3">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Printer className="h-5 w-5" /><span>{t('common.print')}</span></button>
              {isActive && (<>
                <Link href={`/inpatient/admissions/${admission._id}/edit`} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Edit className="h-5 w-5" /><span>{t('common.edit')}</span></Link>
                <Link href={`/inpatient/admissions/${admission._id}/discharge`} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><LogOut className="h-5 w-5" /><span>{t('inpatient.discharge')}</span></Link>
              </>)}
            </div>
          </div>

          {/* Patient Overview */}
          <div className="bg-white rounded-lg shadow-sm p-6 admission-document">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center"><User className="h-8 w-8 text-blue-600" /></div>
                <div>
                  <h2 className="text-2xl font-bold">{admission.patientName}</h2>
                  <p className="text-gray-500">{admission.admissionNumber}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(admission.status)}`}>{t(`inpatient.statusLabels.${admission.status}`)}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(admission.priority)}`}>{t(`inpatient.priorityLabels.${admission.priority}`)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right"><p className="text-sm text-gray-500">{t('inpatient.admissionDate')}</p><p className="text-lg font-medium">{formatDate(admission.admissionDate)}</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-t pt-6">
              <div><p className="text-sm text-gray-500">{t('inpatient.ward')}</p><p className="font-medium">{admission.wardName}</p></div>
              <div><p className="text-sm text-gray-500">{t('inpatient.bed')}</p><p className="font-medium">{admission.bedNumber}</p></div>
              <div><p className="text-sm text-gray-500">{t('inpatient.doctor')}</p><p className="font-medium">{admission.admittingDoctorName}</p></div>
              <div><p className="text-sm text-gray-500">{t('inpatient.admissionType')}</p><p className="font-medium capitalize">{t(`inpatient.admissionTypes.${admission.admissionType}`)}</p></div>
            </div>
            {admission.chiefComplaint && <div className="mt-6 pt-6 border-t"><p className="text-sm font-medium text-gray-700 mb-2">{t('inpatient.chiefComplaint')}</p><p>{admission.chiefComplaint}</p></div>}
            {admission.allergies?.length > 0 && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{t('inpatient.allergies')}</p><div className="flex flex-wrap gap-2">{admission.allergies.map((a, i) => <span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">{a}</span>)}</div></div>}
          </div>

          {/* Vital Signs */}
          {isActive && <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Heart className="h-5 w-5 text-red-500" />{t('inpatient.vitalSigns')}</h3>
              <button onClick={() => setShowVitalModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 no-print"><Plus className="h-4 w-4" />{t('inpatient.addVitals')}</button>
            </div>
            {admission.vitalSigns?.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('inpatient.dateTime')}</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('inpatient.bp')}</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('inpatient.pulse')}</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('inpatient.temp')}</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('inpatient.spo2')}</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('inpatient.recordedBy')}</th></tr></thead>
                <tbody className="divide-y divide-gray-200">{admission.vitalSigns.slice().reverse().slice(0, 10).map((v, i) => <tr key={i}><td className="px-4 py-2 text-sm">{formatDateTime(v.timestamp)}</td><td className="px-4 py-2 text-sm">{v.bloodPressure || '-'}</td><td className="px-4 py-2 text-sm">{v.pulse || '-'}</td><td className="px-4 py-2 text-sm">{v.temperature ? `${v.temperature}°F` : '-'}</td><td className="px-4 py-2 text-sm">{v.oxygenSaturation ? `${v.oxygenSaturation}%` : '-'}</td><td className="px-4 py-2 text-sm">{v.recordedBy || '-'}</td></tr>)}</tbody>
              </table>
            ) : <p className="text-gray-500 text-center py-4">{t('inpatient.noVitals')}</p>}
          </div>}

          {/* Nursing Notes */}
          {isActive && <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-blue-500" />{t('inpatient.nursingNotes')}</h3>
              <button onClick={() => setShowNoteModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 no-print"><Plus className="h-4 w-4" />{t('inpatient.addNote')}</button>
            </div>
            {admission.nursingNotes?.length > 0 ? (
              <div className="space-y-3">{admission.nursingNotes.slice().reverse().slice(0, 10).map((n, i) => <div key={i} className="p-3 bg-gray-50 rounded-lg"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">{n.nurseName}</span><span className="text-xs text-gray-500">{formatDateTime(n.timestamp)}</span></div><p className="text-sm text-gray-700">{n.note}</p><span className="inline-block mt-2 px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs capitalize">{n.category}</span></div>)}</div>
            ) : <p className="text-gray-500 text-center py-4">{t('inpatient.noNotes')}</p>}
          </div>}

          {/* Emergency Contact */}
          {admission.emergencyContact?.name && <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">{t('inpatient.emergencyContact')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><p className="text-sm text-gray-500">{t('inpatient.contactName')}</p><p className="font-medium">{admission.emergencyContact.name}</p></div>
              <div><p className="text-sm text-gray-500">{t('inpatient.relationship')}</p><p className="font-medium">{admission.emergencyContact.relationship}</p></div>
              <div><p className="text-sm text-gray-500">{t('inpatient.contactPhone')}</p><p className="font-medium">{admission.emergencyContact.phone}</p></div>
            </div>
          </div>}

          {/* Discharge Info */}
          {admission.dischargeInfo && <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" />{t('inpatient.dischargeInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">{t('inpatient.dischargeType')}</p><p className="font-medium capitalize">{admission.dischargeInfo.dischargeType}</p></div>
              {admission.dischargeInfo.dischargedAt && <div><p className="text-sm text-gray-500">{t('inpatient.dischargedAt')}</p><p className="font-medium">{formatDateTime(admission.dischargeInfo.dischargedAt)}</p></div>}
              {admission.dischargeInfo.dischargedBy && <div><p className="text-sm text-gray-500">{t('inpatient.dischargedBy')}</p><p className="font-medium">{admission.dischargeInfo.dischargedBy}</p></div>}
              {admission.dischargeInfo.followUpDate && <div><p className="text-sm text-gray-500">{t('inpatient.followUpDate')}</p><p className="font-medium">{formatDate(admission.dischargeInfo.followUpDate)}</p></div>}
            </div>
            {admission.dischargeInfo.dischargeSummary && <div className="mt-4"><p className="text-sm text-gray-500 mb-1">{t('inpatient.dischargeSummary')}</p><p>{admission.dischargeInfo.dischargeSummary}</p></div>}
          </div>}
        </div>

        {/* Add Vitals Modal */}
        {showVitalModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">{t('inpatient.addVitals')}</h3>
          <form onSubmit={handleAddVitals} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.bloodPressure')}</label><input type="text" placeholder="120/80" value={vitalForm.bloodPressure} onChange={(e) => setVitalForm({ ...vitalForm, bloodPressure: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.pulse')}</label><input type="number" placeholder="72" value={vitalForm.pulse} onChange={(e) => setVitalForm({ ...vitalForm, pulse: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.temperature')}</label><input type="number" step="0.1" placeholder="98.6" value={vitalForm.temperature} onChange={(e) => setVitalForm({ ...vitalForm, temperature: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.spo2')}</label><input type="number" placeholder="98" value={vitalForm.oxygenSaturation} onChange={(e) => setVitalForm({ ...vitalForm, oxygenSaturation: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.notes')}</label><textarea rows={2} value={vitalForm.notes} onChange={(e) => setVitalForm({ ...vitalForm, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowVitalModal(false)} className="px-4 py-2 border rounded-lg">{t('common.cancel')}</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('common.save')}</button></div>
          </form>
        </div></div>}

        {/* Add Note Modal */}
        {showNoteModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">{t('inpatient.addNote')}</h3>
          <form onSubmit={handleAddNote} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.category')}</label><select value={noteForm.category} onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="routine">{t('inpatient.noteCategories.routine')}</option><option value="observation">{t('inpatient.noteCategories.observation')}</option><option value="medication">{t('inpatient.noteCategories.medication')}</option><option value="procedure">{t('inpatient.noteCategories.procedure')}</option><option value="incident">{t('inpatient.noteCategories.incident')}</option><option value="other">{t('inpatient.noteCategories.other')}</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inpatient.note')}</label><textarea required rows={4} value={noteForm.note} onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowNoteModal(false)} className="px-4 py-2 border rounded-lg">{t('common.cancel')}</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('common.save')}</button></div>
          </form>
        </div></div>}
      </SidebarLayout>
    </ProtectedRoute>
  );
}
