'use client';

import { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/app/protected-route';
import SidebarLayout from '@/app/components/sidebar-layout';
import { useTranslations } from '@/app/hooks/useTranslations';
import { ArrowLeft, Edit, Users, Phone, Mail, MapPin, FileText, Building, AlertCircle } from 'lucide-react';

function SupplierViewContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { t, translationsLoaded } = useTranslations();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [supplier, setSupplier] = useState<any>(null);

  useEffect(() => {
    fetchSupplier();
  }, [resolvedParams.id]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/suppliers/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setSupplier(data);
      } else {
        setError('Supplier not found');
      }
    } catch (err) {
      console.error('Error fetching supplier:', err);
      setError('Failed to load supplier data');
    } finally {
      setLoading(false);
    }
  };

  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('inventory.supplier')} description="">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('inventory.supplier')} description="">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading supplier data...</span>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  if (error || !supplier) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('inventory.supplier')} description="">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">{t('common.error')}</h3>
            <p className="mt-1 text-sm text-gray-500">{error || 'Supplier not found'}</p>
            <div className="mt-6">
              <Link
                href="/inventory/suppliers"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('common.back')}
              </Link>
            </div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout
        title={supplier.name || t('inventory.supplier')}
        description={supplier.code || ''}
      >
        <div className="max-w-4xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/inventory/suppliers"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('common.back')}</span>
            </Link>
            <Link
              href={`/inventory/suppliers/${supplier._id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>{t('common.edit')}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('inventory.supplierInfo')}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.supplierName')}</label>
                    <p className="mt-1 text-sm font-medium text-gray-900">{supplier.name}</p>
                  </div>
                  {supplier.code && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.supplierCode')}</label>
                      <p className="mt-1 text-sm font-medium text-gray-900 font-mono">{supplier.code}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.contactPerson')}</label>
                    <p className="mt-1 text-sm font-medium text-gray-900">{supplier.contactPerson}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.email')}</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900">{supplier.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.phone')}</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900">{supplier.phone}</p>
                    </div>
                  </div>
                  {supplier.alternatePhone && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.alternatePhone')}</label>
                      <div className="mt-1 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900">{supplier.alternatePhone}</p>
                      </div>
                    </div>
                  )}
                  {supplier.supplyType && supplier.supplyType.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.supplyType')}</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {supplier.supplyType.map((type: string) => (
                          <span
                            key={type}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                          >
                            {t(`inventory.supplyTypes.${type}`) || type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {supplier.address && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">{t('inventory.address')}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supplier.address.street && (
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.street')}</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{supplier.address.street}</p>
                      </div>
                    )}
                    {supplier.address.city && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.city')}</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{supplier.address.city}</p>
                      </div>
                    )}
                    {supplier.address.state && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.state')}</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{supplier.address.state}</p>
                      </div>
                    )}
                    {supplier.address.postalCode && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.postalCode')}</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{supplier.address.postalCode}</p>
                      </div>
                    )}
                    {supplier.address.country && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.country')}</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{supplier.address.country}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Business Information */}
              {(supplier.taxId || supplier.licenseNumber || supplier.paymentTerms || supplier.creditLimit) && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building className="h-5 w-5 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">{t('inventory.businessInfo')}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supplier.taxId && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.taxId')}</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{supplier.taxId}</p>
                      </div>
                    )}
                    {supplier.licenseNumber && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.licenseNumber')}</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{supplier.licenseNumber}</p>
                      </div>
                    )}
                    {supplier.paymentTerms && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.paymentTerms')}</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{supplier.paymentTerms}</p>
                      </div>
                    )}
                    {supplier.creditLimit !== undefined && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">{t('inventory.creditLimit')}</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          ${supplier.creditLimit?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {supplier.notes && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">{t('inventory.notes')}</h2>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{supplier.notes}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('common.status')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('common.active')}</span>
                    <span className={`text-sm font-medium ${supplier.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {supplier.isActive ? t('common.yes') : t('common.no')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

export default function SupplierViewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <SidebarLayout title="" description="">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    }>
      <SupplierViewContent params={params} />
    </Suspense>
  );
}
