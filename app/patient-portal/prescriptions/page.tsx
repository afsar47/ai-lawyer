'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from '../../hooks/useTranslations';
import { 
  Pill,
  Calendar,
  AlertTriangle,
  Search,
  Brain,
  Sparkles,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Report {
  _id: string;
  doctorName: string;
  reportDate: string;
  reportType: string;
  status: string;
  findings: string;
  diagnosis: string;
  recommendations: string;
  notes?: string;
  source: 'report';
}

interface AIResult {
  _id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
  aiModel?: {
    name: string;
    provider: string;
  };
  metadata?: {
    diagnosis?: string;
    medications?: string[];
  };
  source: 'ai';
}

type Prescription = Report | AIResult;

export default function PatientPrescriptionsPage() {
  const { data: session } = useSession();
  const { t } = useTranslations();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        // Fetch both treatment reports and AI prescriptions
        const [reportsRes, aiInsightsRes] = await Promise.all([
          fetch('/api/patient-portal/reports'),
          fetch('/api/patient-portal/ai-insights')
        ]);
        
        const reportsData = await reportsRes.json();
        const aiData = await aiInsightsRes.json();
        
        // Filter treatment reports
        const treatmentReports: Prescription[] = (reportsData.reports || [])
          .filter((r: Report) => r.reportType === 'treatment')
          .map((r: Report) => ({ ...r, source: 'report' as const }));
        
        // Filter only AI prescriptions (not treatment plans)
        const aiPrescriptions: Prescription[] = (aiData.aiInsights || [])
          .filter((ai: AIResult) => ai.type === 'prescription')
          .map((ai: AIResult) => ({ ...ai, source: 'ai' as const }));
        
        // Combine and sort by date
        const combined = [...treatmentReports, ...aiPrescriptions].sort((a, b) => {
          const dateA = new Date('source' in a && a.source === 'report' ? a.reportDate : a.createdAt);
          const dateB = new Date('source' in b && b.source === 'report' ? b.reportDate : b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        setPrescriptions(combined);
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isReport = (prescription: Prescription): prescription is Report => {
    return prescription.source === 'report';
  };

  const isAIResult = (prescription: Prescription): prescription is AIResult => {
    return prescription.source === 'ai';
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    
    if (isReport(p)) {
      return (
        p.doctorName.toLowerCase().includes(search) ||
        p.recommendations.toLowerCase().includes(search) ||
        p.diagnosis.toLowerCase().includes(search)
      );
    } else {
      return (
        p.title.toLowerCase().includes(search) ||
        p.content.toLowerCase().includes(search)
      );
    }
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('patientPortal.prescriptions.title')}</h1>
        <p className="text-gray-600 mt-1">{t('patientPortal.prescriptions.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('patientPortal.prescriptions.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      {/* Prescriptions Table */}
      {filteredPrescriptions.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('patientPortal.prescriptions.diagnosis')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prescribed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPrescriptions.map((prescription) => (
                  <tr key={prescription._id} className="hover:bg-gray-50 transition-colors">
                    {/* Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isAIResult(prescription) ? (
                          <>
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Brain className="h-4 w-4 text-purple-600" />
                            </div>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              AI
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Pill className="h-4 w-4 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-700">Manual</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Diagnosis */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {isReport(prescription) ? prescription.diagnosis : 
                         isAIResult(prescription) && prescription.metadata?.diagnosis ? prescription.metadata.diagnosis :
                         isAIResult(prescription) ? prescription.title : '-'}
                      </div>
                    </td>

                    {/* Prescribed By */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {isReport(prescription) ? prescription.doctorName : 
                         isAIResult(prescription) && prescription.aiModel ? prescription.aiModel.name : 'AI System'}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(isReport(prescription) ? prescription.reportDate : prescription.createdAt)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setSelectedPrescription(prescription)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Pill className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('patientPortal.prescriptions.noPrescriptions')}</h3>
          <p className="text-gray-500 mt-1">{t('patientPortal.prescriptions.noPrescriptionsDesc')}</p>
        </div>
      )}

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">{t('patientPortal.prescriptions.warningTitle')}</h4>
            <p className="text-sm text-amber-700 mt-1">
              {t('patientPortal.prescriptions.warningText')}
            </p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPrescription(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isAIResult(selectedPrescription) ? (
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Brain className="h-6 w-6 text-purple-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Pill className="h-6 w-6 text-green-600" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {isAIResult(selectedPrescription) ? selectedPrescription.title : t('patientPortal.prescriptions.treatmentPlan')}
                    </h2>
                    {isAIResult(selectedPrescription) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full mt-1">
                        <Sparkles className="h-3 w-3" />
                        AI Generated
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Prescribed By</p>
                  <p className="font-medium text-gray-900">
                    {isReport(selectedPrescription) ? selectedPrescription.doctorName : 
                     isAIResult(selectedPrescription) && selectedPrescription.aiModel ? selectedPrescription.aiModel.name : 'AI System'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(isReport(selectedPrescription) ? selectedPrescription.reportDate : selectedPrescription.createdAt)}
                  </p>
                </div>
              </div>

              {/* Diagnosis */}
              {((isReport(selectedPrescription) && selectedPrescription.diagnosis) || 
                (isAIResult(selectedPrescription) && selectedPrescription.metadata?.diagnosis)) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('patientPortal.prescriptions.diagnosis')}</h3>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-gray-700">
                      {isReport(selectedPrescription) ? selectedPrescription.diagnosis : selectedPrescription.metadata?.diagnosis}
                    </p>
                  </div>
                </div>
              )}

              {/* Medications */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('patientPortal.prescriptions.medications')}</h3>
                <div className={`p-4 rounded-lg border ${
                  isAIResult(selectedPrescription) 
                    ? 'bg-purple-50 border-purple-100' 
                    : 'bg-green-50 border-green-100'
                }`}>
                  {isReport(selectedPrescription) ? (
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedPrescription.recommendations}</p>
                  ) : (
                    <div className="text-gray-900 whitespace-pre-wrap"
                         dangerouslySetInnerHTML={{ __html: selectedPrescription.content.replace(/\n/g, '<br/>') }}
                    />
                  )}
                </div>
              </div>

              {/* Medication List (for AI results) */}
              {isAIResult(selectedPrescription) && selectedPrescription.metadata?.medications && selectedPrescription.metadata.medications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Medication List:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrescription.metadata.medications.map((med, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {isReport(selectedPrescription) && selectedPrescription.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('patientPortal.prescriptions.instructions')}</h3>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <p className="text-gray-700">{selectedPrescription.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


