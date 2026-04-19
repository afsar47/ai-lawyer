'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import { useTranslations } from '../../hooks/useTranslations';

type ClientType = 'individual' | 'organization';

export default function NewClientPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: 'individual' as ClientType,
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    conflictCheckNotes: '',
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t('clients.newClientPage.failedCreate'));
      router.push(`/clients/${data._id}`);
    } catch (err: any) {
      setError(err?.message || t('clients.newClientPage.failedCreate'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('clients.newClientPage.title')} description={t('clients.newClientPage.description')}>
        <div className="max-w-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('clients.newClientPage.type')}</label>
              <select
                name="type"
                value={form.type}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="individual">{t('clients.individual')}</option>
                <option value="organization">{t('clients.organization')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('clients.newClientPage.name')}</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('clients.newClientPage.email')}</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('clients.newClientPage.phone')}</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('clients.newClientPage.address')}</label>
              <input
                name="address"
                value={form.address}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('clients.newClientPage.notes')}</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={onChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('clients.newClientPage.conflictCheckNotes')}</label>
              <textarea
                name="conflictCheckNotes"
                value={form.conflictCheckNotes}
                onChange={onChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? t('clients.newClientPage.saving') : t('clients.newClientPage.createClient')}
              </button>
            </div>
          </form>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

