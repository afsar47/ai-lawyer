'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/app/protected-route';
import SidebarLayout from '@/app/components/sidebar-layout';
import { useTranslations } from '@/app/hooks/useTranslations';
import { ArrowLeft, Save, Users } from 'lucide-react';

export default function NewSupplierPage() {
  const router = useRouter();
  const { t, translationsLoaded } = useTranslations();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '', contactPerson: '', email: '', phone: '', alternatePhone: '',
    street: '', city: '', state: '', postalCode: '', country: '',
    supplyType: [] as string[], taxId: '', licenseNumber: '', paymentTerms: '', creditLimit: 0, notes: '',
  });

  const handleSupplyTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      supplyType: prev.supplyType.includes(type)
        ? prev.supplyType.filter(t => t !== type)
        : [...prev.supplyType, type]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.supplyType.length === 0) { setError(t('inventory.pleaseSelectSupplyType')); return; }
    setSubmitting(true); setError('');

    try {
      const response = await fetch('/api/inventory/suppliers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          address: { street: formData.street, city: formData.city, state: formData.state, postalCode: formData.postalCode, country: formData.country },
          creditLimit: Number(formData.creditLimit) || 0,
        }),
      });
      if (response.ok) router.push('/inventory/suppliers');
      else { const data = await response.json(); setError(data.error || t('common.error')); }
    } catch { setError(t('common.error')); }
    finally { setSubmitting(false); }
  };

  const supplyTypes = ['medicines', 'equipment', 'consumables', 'all'];

  if (!translationsLoaded) {
    return <ProtectedRoute><SidebarLayout title="" description=""><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></SidebarLayout></ProtectedRoute>;
  }

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('inventory.addSupplier')} description={t('inventory.addSupplierDescription')}>
        <div className="max-w-3xl">
          <Link href="/inventory/suppliers" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-5 w-5" /><span>{t('common.back')}</span>
          </Link>

          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" />{t('inventory.supplierInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.supplierName')} *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.contactPerson')} *</label>
                  <input type="text" required value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.email')} *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.phone')} *</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.alternatePhone')}</label>
                  <input type="tel" value={formData.alternatePhone} onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.supplyType')} *</label>
                <div className="flex flex-wrap gap-3">
                  {supplyTypes.map(type => (
                    <label key={type} className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.supplyType.includes(type)} onChange={() => handleSupplyTypeChange(type)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <span className="text-sm">{t(`inventory.supplyTypes.${type}`)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('inventory.address')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.street')}</label>
                  <input type="text" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.city')}</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.state')}</label>
                  <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.postalCode')}</label>
                  <input type="text" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.country')}</label>
                  <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
              </div>
            </div>

            {/* Business Info */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('inventory.businessInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.taxId')}</label>
                  <input type="text" value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.licenseNumber')}</label>
                  <input type="text" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.paymentTerms')}</label>
                  <input type="text" value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Net 30" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.creditLimit')}</label>
                  <input type="number" min="0" value={formData.creditLimit} onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.notes')}</label>
                  <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4">
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Save className="h-5 w-5" /><span>{submitting ? t('common.saving') : t('inventory.saveSupplier')}</span>
              </button>
              <Link href="/inventory/suppliers" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</Link>
            </div>
          </form>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
