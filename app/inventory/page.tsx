'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/app/protected-route';
import SidebarLayout from '@/app/components/sidebar-layout';
import { useTranslations } from '@/app/hooks/useTranslations';
import { Package, Plus, Search, AlertTriangle, Wrench, Eye, Edit, Trash2, ShoppingCart, Users } from 'lucide-react';

interface InventoryItem {
  _id: string; name: string; category: string; sku: string; currentStock: number;
  reorderLevel: number; unitCost: number; totalValue: number; status: string;
  location?: string; department?: string; expiryDate?: string;
}

export default function InventoryPage() {
  const { t, translationsLoaded } = useTranslations();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { fetchItems(); }, [filterCategory, filterStatus]);

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`/api/inventory/items?${params}`);
      if (response.ok) setItems(await response.json());
    } catch (error) { console.error('Error fetching items:', error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('inventory.confirmDelete'))) return;
    try {
      const response = await fetch(`/api/inventory/items/${id}`, { method: 'DELETE' });
      if (response.ok) setItems(items.filter(i => i._id !== id));
    } catch (error) { console.error('Error deleting item:', error); }
  };

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = items.filter(i => i.status === 'low-stock').length;
  const outOfStockCount = items.filter(i => i.status === 'out-of-stock').length;
  const totalValue = items.reduce((sum, i) => sum + i.totalValue, 0);

  const categories = ['medical-supplies', 'equipment', 'consumables', 'instruments', 'furniture', 'linen', 'cleaning', 'other'];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'in-stock': 'bg-green-100 text-green-800', 'low-stock': 'bg-orange-100 text-orange-800',
      'out-of-stock': 'bg-red-100 text-red-800', 'expired': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!translationsLoaded) {
    return <ProtectedRoute><SidebarLayout title={t('inventory.title')} description=""><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></SidebarLayout></ProtectedRoute>;
  }

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('inventory.title')} description={t('inventory.description')}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder={t('inventory.searchItems')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">{t('inventory.allCategories')}</option>
                  {categories.map(cat => <option key={cat} value={cat}>{t(`inventory.categories.${cat}`)}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">{t('inventory.allStatuses')}</option>
                  <option value="in-stock">{t('inventory.statusLabels.in-stock')}</option>
                  <option value="low-stock">{t('inventory.statusLabels.low-stock')}</option>
                  <option value="out-of-stock">{t('inventory.statusLabels.out-of-stock')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/inventory/suppliers" className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Users className="h-5 w-5" /><span>{t('inventory.suppliers')}</span>
              </Link>
              <Link href="/inventory/purchase-orders" className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                <ShoppingCart className="h-5 w-5" /><span>{t('inventory.purchaseOrders')}</span>
              </Link>
              <Link href="/inventory/items/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-5 w-5" /><span>{t('inventory.addItem')}</span>
              </Link>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><Package className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-sm text-gray-500">{t('inventory.totalItems')}</p><p className="text-2xl font-bold">{items.length}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
                <div><p className="text-sm text-gray-500">{t('inventory.lowStock')}</p><p className="text-2xl font-bold">{lowStockCount}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><Wrench className="h-5 w-5 text-red-600" /></div>
                <div><p className="text-sm text-gray-500">{t('inventory.outOfStock')}</p><p className="text-2xl font-bold">{outOfStockCount}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><Package className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-sm text-gray-500">{t('inventory.totalValue')}</p><p className="text-2xl font-bold">${totalValue.toFixed(0)}</p></div>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('inventory.noItems')}</h3>
              <p className="text-gray-500 mb-4">{t('inventory.noItemsDescription')}</p>
              <Link href="/inventory/items/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-5 w-5" /><span>{t('inventory.addItem')}</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('inventory.item')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('inventory.category')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('inventory.stock')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('inventory.value')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('inventory.status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('inventory.location')}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.sku}</p>
                        </td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{t(`inventory.categories.${item.category}`)}</span></td>
                        <td className="px-6 py-4">
                          <span className="text-sm">{item.currentStock}</span>
                          {item.currentStock <= item.reorderLevel && <p className="text-xs text-orange-600">{t('inventory.reorderAt')}: {item.reorderLevel}</p>}
                        </td>
                        <td className="px-6 py-4 text-sm">${item.totalValue.toFixed(2)}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>{t(`inventory.statusLabels.${item.status}`)}</span></td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.location || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/inventory/items/${item._id}`} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"><Eye className="h-4 w-4" /></Link>
                            <Link href={`/inventory/items/${item._id}/edit`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="h-4 w-4" /></Link>
                            <button onClick={() => handleDelete(item._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
