'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';

export default function IntakePage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    clientType: 'individual',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    matterTitle: '',
    matterDescription: '',
    practiceArea: '',
    urgency: 'medium',
    initialDeadlineTitle: '',
    initialDeadlineDate: '',
    initialDeadlineNotes: '',
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          initialDeadlineDate: form.initialDeadlineDate || undefined,
          initialDeadlineTitle: form.initialDeadlineTitle || undefined,
          initialDeadlineNotes: form.initialDeadlineNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t('intake.failedCreate'));
      router.push(`/cases/${data.matterId}`);
    } catch (err: any) {
      setError(err?.message || t('intake.failedCreate'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('intake.title')} description={t('intake.description')}>
        <div className="max-w-3xl mx-auto space-y-4">
          {error ? (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
          ) : null}

          <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.clientType')}</label>
                <select
                  name="clientType"
                  value={form.clientType}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="individual">{t('intake.individual')}</option>
                  <option value="organization">{t('intake.organization')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.urgency')}</label>
                <select
                  name="urgency"
                  value={form.urgency}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">{t('intake.low')}</option>
                  <option value="medium">{t('intake.medium')}</option>
                  <option value="high">{t('intake.high')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.clientName')} *</label>
                <input
                  name="clientName"
                  value={form.clientName}
                  onChange={onChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.practiceArea')}</label>
                <input
                  name="practiceArea"
                  value={form.practiceArea}
                  onChange={onChange}
                  placeholder={t('intake.practiceAreaPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.email')}</label>
                <input
                  name="clientEmail"
                  value={form.clientEmail}
                  onChange={onChange}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.phone')}</label>
                <input
                  name="clientPhone"
                  value={form.clientPhone}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.address')}</label>
              <input
                name="clientAddress"
                value={form.clientAddress}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.caseTitle')} *</label>
              <input
                name="matterTitle"
                value={form.matterTitle}
                onChange={onChange}
                required
                placeholder={t('intake.caseTitlePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.caseDescription')}</label>
              <textarea
                name="matterDescription"
                value={form.matterDescription}
                onChange={onChange}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="border-t pt-6 space-y-4">
              <div className="text-sm font-semibold text-gray-900">{t('intake.optionalDeadline')}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.deadlineTitle')}</label>
                  <input
                    name="initialDeadlineTitle"
                    value={form.initialDeadlineTitle}
                    onChange={onChange}
                    placeholder={t('intake.deadlineTitlePlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.deadlineDate')}</label>
                  <input
                    name="initialDeadlineDate"
                    value={form.initialDeadlineDate}
                    onChange={onChange}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.deadlineNotes')}</label>
                <input
                  name="initialDeadlineNotes"
                  value={form.initialDeadlineNotes}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? t('intake.creating') : t('intake.createIntake')}
              </button>
            </div>
          </form>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

