'use client';

import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import SearchablePatientSelect from '../components/SearchablePatientSelect';
import FormattedAIResult from '../components/FormattedAIResult';
import { useTranslations } from '../hooks/useTranslations';
import { aiService } from '../../lib/ai-service';
import { aiConfigManager } from '../../lib/ai-config';
import {
  Pill,
  AlertTriangle,
  Activity,
  Brain,
  Zap,
  Target,
  FileText,
  Download,
  Share2,
  Heart,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Stethoscope,
  TrendingUp,
  Save,
  Printer,
  Plus,
  Edit,
  Trash2,
  Search,
  Info,
  XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AIDrugInteractionPage() {
  const { t, translationsLoaded } = useTranslations();
  const [activeTab, setActiveTab] = useState<'drugs' | 'profile' | 'analysis' | 'report'>('profile');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [currentMedications, setCurrentMedications] = useState<string[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientInfo, setPatientInfo] = useState({
    age: 30,
    gender: '',
    medicalHistory: '',
    currentMedications: '',
    allergies: ''
  });
  const [loading, setLoading] = useState(true);
  const [activeModel, setActiveModel] = useState<any>(null);
  
  // Drug input form state
  const [newDrug, setNewDrug] = useState({
    name: '',
    dosage: '',
    frequency: '',
    purpose: ''
  });

  // Fetch patients and active model on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch patients
        const response = await fetch('/api/patients');
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
        }

        // Load active AI model
        const model = await aiConfigManager.getActiveModel();
        setActiveModel(model);
        console.log('Active AI model loaded:', model);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
          allergies: fullPatient.allergies?.join(', ') || ''
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
        allergies: ''
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
          allergies: selectedPatient.allergies?.join(', ') || ''
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
        allergies: ''
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
            medications: currentMedications,
            patientInfo,
            aiAnalysis,
          },
          aiModel: activeModel ? {
            id: activeModel.id,
            name: activeModel.name,
            provider: activeModel.provider,
          } : undefined,
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

  // Function to perform AI drug interaction analysis
  const performDrugInteractionAnalysis = async () => {
    if (currentMedications.length === 0) {
      alert('Please add at least one medication before analysis.');
      return;
    }
    
    if (!selectedPatientId) {
      alert('Please select a patient before analyzing drug interactions.');
      return;
    }

    if (!activeModel) {
      alert('No active AI model found. Please configure an AI model in Settings first.');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      console.log('Starting drug interaction analysis with model:', activeModel);
      const result = await aiService.checkDrugInteractions({
        medications: currentMedications,
        patientAge: patientInfo.age,
        medicalConditions: patientInfo.medicalHistory ? [patientInfo.medicalHistory] : [],
        allergies: patientInfo.allergies ? [patientInfo.allergies] : [],
        modelId: activeModel.id
      });
      
      console.log('AI analysis result:', result);
      
      if (result.success && result.content) {
        setAiAnalysis(result.content);
        console.log('AI Drug Interaction Analysis:', result.content);
        setActiveTab('analysis');

        // Save AI result to patient record
        if (selectedPatientId) {
          await saveAIResult(
            'drug-interaction',
            `Drug Interaction Analysis - ${currentMedications.length} Medication${currentMedications.length > 1 ? 's' : ''}`,
            result.content,
            {
              medications: currentMedications,
            }
          );
        }
      } else {
        console.error('AI drug interaction analysis failed:', result.error);
        setAiAnalysis(`AI analysis failed: ${result.error || 'Unknown error'}. Please check your AI model configuration.`);
        setActiveTab('analysis');
      }
    } catch (error) {
      console.error('Error during AI drug interaction analysis:', error);
      setAiAnalysis(`AI analysis error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your AI model configuration.`);
      setActiveTab('analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to add medication
  const addMedication = (medication: string) => {
    if (medication.trim() && !currentMedications.includes(medication.trim())) {
      setCurrentMedications([...currentMedications, medication.trim()]);
    }
  };

  // Function to handle adding new drug from form
  const handleAddDrug = () => {
    if (newDrug.name.trim()) {
      const drugString = `${newDrug.name.trim()}${newDrug.dosage ? ` (${newDrug.dosage})` : ''}${newDrug.frequency ? ` - ${newDrug.frequency}` : ''}${newDrug.purpose ? ` - ${newDrug.purpose}` : ''}`;
      addMedication(drugString);
      // Reset form
      setNewDrug({
        name: '',
        dosage: '',
        frequency: '',
        purpose: ''
      });
    }
  };

  // Function to handle quick add drugs
  const handleQuickAddDrug = (drugName: string) => {
    addMedication(drugName);
  };

  // Function to remove medication
  const removeMedication = (medication: string) => {
    setCurrentMedications(currentMedications.filter(m => m !== medication));
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
        title={t('ai.ai.drugInteraction.title')} 
        description={t('ai.ai.drugInteraction.description')}
      >
        <div className="space-y-6">
          {/* Header with AI Stats */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <Pill className="w-8 h-8" />
              <h2 className="text-2xl font-bold">{t('ai.ai.drugInteraction.title')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">99.8%</div>
                <div className="text-red-100">{t('ai.ai.drugInteraction.accuracyRate')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">1.2s</div>
                <div className="text-red-100">{t('ai.ai.drugInteraction.analysisTime')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">50K+</div>
                <div className="text-red-100">{t('ai.ai.drugInteraction.drugDatabase')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-red-100">{t('ai.ai.drugInteraction.safetyMonitoring')}</div>
              </div>
            </div>
            
            {/* Active Model Information */}
            {activeModel ? (
              <div className="mt-4 p-3 bg-opacity-20 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <Brain className="w-4 h-4" />
                  <span>{t('ai.ai.drugInteraction.activeModel')}: <strong>{activeModel.name}</strong> ({activeModel.provider})</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-yellow-500 bg-opacity-20 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t('ai.ai.drugInteraction.noActiveModel')} <a href="/ai-settings" className="underline">{t('ai.ai.drugInteraction.configureModel')}</a></span>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'profile' as const, label: t('ai.ai.drugInteraction.patientProfile'), icon: User },
                { id: 'drugs' as const, label: t('ai.ai.drugInteraction.drugList'), icon: Pill },
                { id: 'analysis' as const, label: t('ai.ai.drugInteraction.aiAnalysis'), icon: Brain },
                { id: 'report' as const, label: t('ai.ai.drugInteraction.report'), icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Medications Tab */}
          {activeTab === 'drugs' && (
            <div className="space-y-6">
              {!selectedPatientId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('ai.ai.drugInteraction.patientSelectionRequired')}</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    {t('ai.ai.drugInteraction.patientSelectionRequiredDesc')}
                  </p>
                </div>
              )}

              {/* Add New Drug */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>{t('ai.ai.drugInteraction.addNewMedication')}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.ai.drugInteraction.drugName')}</label>
                    <input
                      type="text"
                      placeholder={t('ai.ai.drugInteraction.enterDrugName')}
                      value={newDrug.name}
                      onChange={(e) => setNewDrug(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={!selectedPatientId}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.ai.drugInteraction.dosage')}</label>
                    <input
                      type="text"
                      placeholder={t('ai.ai.drugInteraction.dosagePlaceholder')}
                      value={newDrug.dosage}
                      onChange={(e) => setNewDrug(prev => ({ ...prev, dosage: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={!selectedPatientId}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.ai.drugInteraction.frequency')}</label>
                    <input
                      type="text"
                      placeholder={t('ai.ai.drugInteraction.frequencyPlaceholder')}
                      value={newDrug.frequency}
                      onChange={(e) => setNewDrug(prev => ({ ...prev, frequency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={!selectedPatientId}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.ai.drugInteraction.purpose')}</label>
                    <input
                      type="text"
                      placeholder={t('ai.ai.drugInteraction.purposePlaceholder')}
                      value={newDrug.purpose}
                      onChange={(e) => setNewDrug(prev => ({ ...prev, purpose: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={!selectedPatientId}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddDrug}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedPatientId || !newDrug.name.trim()}
                >
                  {t('ai.ai.drugInteraction.addMedication')}
                </button>

                {/* Quick Add Common Drugs */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{t('ai.ai.drugInteraction.quickAddCommonDrugs')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Aspirin', 'Ibuprofen', 'Acetaminophen', 'Lisinopril', 'Metformin', 'Atorvastatin', 'Omeprazole'].map((drug) => (
                      <button
                        key={drug}
                        onClick={() => handleQuickAddDrug(drug)}
                        disabled={!selectedPatientId}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {drug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Current Medications List */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('ai.ai.drugInteraction.currentMedications')} ({currentMedications.length})
                </h3>
                {currentMedications.length > 0 ? (
                  <div className="space-y-3">
                    {currentMedications.map((drug, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{drug}</div>
                        </div>
                        <button 
                          onClick={() => setCurrentMedications(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Pill className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>{t('ai.ai.drugInteraction.noMedicationsAdded')}</p>
                  </div>
                )}
              </div>

              {/* Analyze Button */}
              <div className="text-center">
                <button 
                  onClick={performDrugInteractionAnalysis}
                  disabled={!selectedPatientId || isAnalyzing}
                  className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-red-300 flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>{t('ai.ai.drugInteraction.analyzing')}</span>
                    </>
                  ) : (
                    <>
                      <Pill className="w-6 h-6" />
                      <span>{t('ai.ai.drugInteraction.analyzeDrugInteractions')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Patient Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Patient Selection */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>{t('ai.ai.drugInteraction.patientSelection')}</span>
                </h3>
                
                {loading ? (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    <span>{t('ai.ai.drugInteraction.loadingPatients')}</span>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('ai.ai.drugInteraction.selectPatient')} *
                      </label>
                      <SearchablePatientSelect
                        value={selectedPatient?.name || ''}
                        onChange={handlePatientSelect}
                        placeholder={t('ai.ai.drugInteraction.choosePatient')}
                        className="w-full"
                      />
                      {selectedPatientId && (
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>{t('ai.ai.drugInteraction.patientInfoLoaded')}</span>
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {t('ai.ai.drugInteraction.selectPatientDesc')}
                      </p>
                    </div>

                    {selectedPatientId && (
                      <>
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center space-x-2 text-blue-800">
                            <Info className="h-4 w-4" />
                            <span className="text-sm font-medium">Patient Information (Editable)</span>
                          </div>
                          <p className="text-sm text-blue-700 mt-1">
                            You can edit the patient information below. Changes will be used for AI analysis but won't affect the original patient record.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                            <input
                              type="number"
                              value={patientInfo.age}
                              onChange={(e) => setPatientInfo({...patientInfo, age: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                            <select
                              value={patientInfo.gender}
                              onChange={(e) => setPatientInfo({...patientInfo, gender: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              <option value="">Select gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Medical History</label>
                            <textarea
                              value={patientInfo.medicalHistory}
                              onChange={(e) => setPatientInfo({...patientInfo, medicalHistory: e.target.value})}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                              placeholder="Previous conditions, surgeries, chronic diseases..."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
                            <textarea
                              value={patientInfo.currentMedications}
                              onChange={(e) => setPatientInfo({...patientInfo, currentMedications: e.target.value})}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                              placeholder="List current medications and dosages..."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                            <textarea
                              value={patientInfo.allergies}
                              onChange={(e) => setPatientInfo({...patientInfo, allergies: e.target.value})}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                              placeholder="Known allergies to medications, foods, or environmental factors..."
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <input
                      type="number"
                      value={patientInfo.age}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      placeholder="Enter weight"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={!selectedPatientId}
                    />
                  </div>
                </div>
              </div>

              {!selectedPatientId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Patient selection required</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please select a patient above to enable medical condition and allergy management. Patient information is required for accurate drug interaction analysis.
                  </p>
                </div>
              )}

              {/* Medical Conditions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Medical Conditions</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add medical condition"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={!selectedPatientId}
                    />
                    <button 
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!selectedPatientId}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Hypertension', 'Type 2 Diabetes', 'High Cholesterol'].map((condition, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                        {condition}
                        <button className="ml-2 text-red-600 hover:text-red-800">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Allergies */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Drug Allergies</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add drug allergy"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={!selectedPatientId}
                    />
                    <button 
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!selectedPatientId}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Penicillin', 'Sulfa Drugs'].map((allergy, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                        {allergy}
                        <button className="ml-2 text-yellow-600 hover:text-yellow-800">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Organ Function */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organ Function Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Liver Function</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option>Normal</option>
                      <option>Impaired</option>
                      <option>Severe Impairment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kidney Function</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option>Normal</option>
                      <option>Impaired</option>
                      <option>Severe Impairment</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Analysis Results */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>AI Drug Interaction Analysis</span>
                </h3>
                
                {isAnalyzing ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Analyzing drug interactions with AI...</p>
                  </div>
                ) : aiAnalysis ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Brain className="w-5 h-5" />
                      <span>AI Analysis Results</span>
                    </h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <FormattedAIResult 
                        content={aiAnalysis} 
                        type="drug-interaction"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No analysis performed yet. Add medications and click &quot;Analyze Interactions&quot; to get started.</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {!aiAnalysis && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-center">
                    <button
                      onClick={performDrugInteractionAnalysis}
                      disabled={currentMedications.length === 0 || isAnalyzing}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                    >
                      <Brain className="w-5 h-5" />
                      <span>Analyze Interactions</span>
                    </button>
                    {currentMedications.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">Add medications first to perform analysis</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Safety Report Tab */}
          {activeTab === 'report' && (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Drug Safety Report</h2>
                                          <p className="text-gray-700">Comprehensive analysis generated on {new Date().toLocaleDateString()}</p>
                </div>
                
                {aiAnalysis ? (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-lg font-semibold text-blue-800">AI Analysis Complete</div>
                    <div className="text-sm text-blue-600">Review the detailed analysis below</div>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-600">No Analysis Available</div>
                    <div className="text-sm text-gray-500">Complete drug interaction analysis to generate report</div>
                  </div>
                )}
              </div>

              {/* AI Analysis Results */}
              {aiAnalysis && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Drug Interaction Analysis</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-sm text-red-800 leading-relaxed">
                        {aiAnalysis}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* No Analysis Message */}
              {!aiAnalysis && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Available</h3>
                  <p className="text-gray-500 mb-6">Complete the drug interaction analysis first to generate a safety report.</p>
                  <button
                    onClick={() => setActiveTab('drugs')}
                    className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Start Drug Analysis
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Download Report</span>
                </button>
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center space-x-2">
                  <Share2 className="w-5 h-5" />
                  <span>Share with Doctor</span>
                </button>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Schedule Consultation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
