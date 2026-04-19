'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Filter,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import { useTranslations } from '../../hooks/useTranslations';

interface ServiceItem {
  _id: string;
  name: string;
  description: string;
  unitPrice: number;
  serviceType: 'consultation' | 'procedure' | 'test' | 'medication' | 'room' | 'other';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ServiceItemsPage() {
  const router = useRouter();
  const { t, translationsLoaded } = useTranslations();
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [activeOnly, setActiveOnly] = useState(false);

  useEffect(() => {
    fetchServiceItems();
  }, [serviceTypeFilter, activeOnly]);

  const fetchServiceItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (serviceTypeFilter !== 'all') {
        params.append('serviceType', serviceTypeFilter);
      }
      if (activeOnly) {
        params.append('activeOnly', 'true');
      }

      const response = await fetch(`/api/billing/service-items?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setServiceItems(data.serviceItems || []);
      } else {
        console.error('Failed to fetch service items');
      }
    } catch (error) {
      console.error('Error fetching service items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('billing.serviceItems.confirmDelete'))) {
      return;
    }

    try {
      const response = await fetch(`/api/billing/service-items/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchServiceItems();
      } else {
        alert(t('billing.serviceItems.deleteFailed'));
      }
    } catch (error) {
      console.error('Error deleting service item:', error);
      alert(t('billing.serviceItems.deleteFailed'));
    }
  };

  const filteredItems = serviceItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <SidebarLayout title="..." description="">
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
        title={t('billing.serviceItems.title')}
        description={t('billing.serviceItems.description')}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/billing"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{t('common.back')}</span>
            </Link>
            <Link
              href="/billing/service-items/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>{t('billing.serviceItems.addNew')}</span>
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder={t('billing.serviceItems.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={serviceTypeFilter}
                  onChange={(e) => setServiceTypeFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">{t('billing.serviceItems.allTypes')}</option>
                  <option value="consultation">{t('billing.serviceTypes.consultation')}</option>
                  <option value="procedure">{t('billing.serviceTypes.procedure')}</option>
                  <option value="test">{t('billing.serviceTypes.test')}</option>
                  <option value="medication">{t('billing.serviceTypes.medication')}</option>
                  <option value="room">{t('billing.serviceTypes.room')}</option>
                  <option value="other">{t('billing.serviceTypes.other')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activeOnly"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="activeOnly" className="text-sm text-gray-700">
                  {t('billing.serviceItems.activeOnly')}
                </label>
              </div>
            </div>
          </div>

          {/* Service Items List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('common.loading')}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('billing.serviceItems.noItems')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('billing.serviceItems.noItemsDesc')}
              </p>
              <Link
                href="/billing/service-items/new"
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>{t('billing.serviceItems.createItem')}</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('billing.serviceItems.name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('billing.serviceItems.description')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('billing.serviceItems.serviceType')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('billing.serviceItems.unitPrice')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('billing.serviceItems.status')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('billing.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {item.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {t(`billing.serviceTypes.${item.serviceType}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${item.unitPrice.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3" />
                            {t('billing.serviceItems.active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            <XCircle className="h-3 w-3" />
                            {t('billing.serviceItems.inactive')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/billing/service-items/${item._id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
