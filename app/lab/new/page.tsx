'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FlaskConical,
  Plus,
  X,
  Save
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import { useTranslations } from '../../hooks/useTranslations';
import SearchablePatientSelect from '../../components/SearchablePatientSelect';
import { useSession } from 'next-auth/react';

export default function NewLabTestPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t, translationsLoaded } = useTranslations();
  const [loading, setLoading] = useState(false);
  const [testInput, setTestInput] = useState('');

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [formData, setFormData] = useState({
    testType: '',
    testCategory: 'other',
    tests: [] as string[],
    sampleType: '',
    priority: 'routine',
    notes: '',
  });

  const handlePatientChange = (patient: any | null) => {
    setSelectedPatient(patient);
  };

  const handleAddTest = () => {
    if (testInput.trim() && !formData.tests.includes(testInput.trim())) {
      setFormData({
        ...formData,
        tests: [...formData.tests, testInput.trim()],
      });
      setTestInput('');
    }
  };

  const handleRemoveTest = (test: string) => {
    setFormData({
      ...formData,
      tests: formData.tests.filter((t) => t !== test),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTest();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      alert(t('lab.selectPatient'));
      return;
    }

    if (!formData.testType) {
      alert(t('lab.fillRequiredFields'));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          patientId: selectedPatient._id,
          patientName: selectedPatient.name,
          patientEmail: selectedPatient.email || '',
          patientPhone: selectedPatient.phone || '',
          doctorId: session?.user?.id || '',
          doctorName: session?.user?.name || '',
        }),
      });

      if (response.ok) {
        router.push('/lab');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create lab test order');
      }
    } catch (error) {
      console.error('Error creating lab test:', error);
      alert('Failed to create lab test order');
    } finally {
      setLoading(false);
    }
  };

  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('lab.newTestOrder')} description="">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout
        title={t('lab.newTestOrder')}
        description={t('lab.createNewTestOrder')}
      >
        <div className="space-y-6">
          {/* Back Link */}
          <Link
            href="/lab"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t('common.back')} {t('lab.toLabTests')}</span>
          </Link>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('lab.patientInformation')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('lab.patient')} *
                  </label>
                  <SearchablePatientSelect
                    value={selectedPatient?.name || ''}
                    onChange={handlePatientChange}
                    placeholder={t('lab.selectPatient')}
                    className="w-full"
                  />
                </div>
                {selectedPatient && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('lab.email')}
                      </label>
                      <input
                        type="email"
                        value={selectedPatient.email || ''}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('lab.phone')}
                      </label>
                      <input
                        type="text"
                        value={selectedPatient.phone || ''}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Test Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('lab.testInformation')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('lab.testType')} *
                  </label>
                  <input
                    type="text"
                    value={formData.testType}
                    onChange={(e) =>
                      setFormData({ ...formData, testType: e.target.value })
                    }
                    placeholder={t('lab.testTypePlaceholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('lab.testCategory')}
                  </label>
                  <select
                    value={formData.testCategory}
                    onChange={(e) =>
                      setFormData({ ...formData, testCategory: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="hematology">{t('lab.categoryLabels.hematology')}</option>
                    <option value="biochemistry">{t('lab.categoryLabels.biochemistry')}</option>
                    <option value="microbiology">{t('lab.categoryLabels.microbiology')}</option>
                    <option value="immunology">{t('lab.categoryLabels.immunology')}</option>
                    <option value="pathology">{t('lab.categoryLabels.pathology')}</option>
                    <option value="urinalysis">{t('lab.categoryLabels.urinalysis')}</option>
                    <option value="other">{t('lab.categoryLabels.other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('lab.sampleType')}
                  </label>
                  <input
                    type="text"
                    value={formData.sampleType}
                    onChange={(e) =>
                      setFormData({ ...formData, sampleType: e.target.value })
                    }
                    placeholder={t('lab.sampleTypePlaceholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('lab.priority')}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="routine">{t('lab.priorityLabels.routine')}</option>
                    <option value="urgent">{t('lab.priorityLabels.urgent')}</option>
                    <option value="stat">{t('lab.priorityLabels.stat')}</option>
                  </select>
                </div>
              </div>

              {/* Individual Tests */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('lab.testsToPerform')}
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('lab.addTestPlaceholder')}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTest}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                {formData.tests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tests.map((test, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {test}
                        <button
                          type="button"
                          onClick={() => handleRemoveTest(test)}
                          className="hover:text-blue-900"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('lab.notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder={t('lab.notesPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link
                href="/lab"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-5 w-5" />
                )}
                <span>{t('lab.createOrder')}</span>
              </button>
            </div>
          </form>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
