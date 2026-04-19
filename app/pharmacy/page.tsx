'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/app/protected-route';
import SidebarLayout from '@/app/components/sidebar-layout';
import { useTranslations } from '@/app/hooks/useTranslations';
import { Pill, Plus, Search, AlertTriangle, Package, Clock, Eye, Edit, Trash2 } from 'lucide-react';

interface Medicine {
  _id: string; name: string; genericName: string; brandName?: string; category: string;
  strength: string; unit: string; currentStock: number; reorderLevel: number;
  sellingPrice: number; expiryDate?: string; isActive: boolean; sku: string;
}

export default function PharmacyPage() {
  const { t, translationsLoaded } = useTranslations();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState('');

  useEffect(() => { fetchMedicines(); }, [filterCategory, filterStock]);

  const fetchMedicines = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterStock === 'low') params.append('lowStock', 'true');
      if (filterStock === 'expiring') params.append('expiringSoon', 'true');

      const response = await fetch(`/api/pharmacy/medicines?${params}`);
      if (response.ok) setMedicines(await response.json());
    } catch (error) { console.error('Error fetching medicines:', error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('pharmacy.confirmDelete'))) return;
    try {
      const response = await fetch(`/api/pharmacy/medicines/${id}`, { method: 'DELETE' });
      if (response.ok) setMedicines(medicines.filter(m => m._id !== id));
    } catch (error) { console.error('Error deleting medicine:', error); }
  };

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = medicines.filter(m => m.currentStock <= m.reorderLevel).length;
  const expiringCount = medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);
    return expiry <= thirtyDays && expiry >= new Date();
  }).length;
  const totalValue = medicines.reduce((sum, m) => sum + (m.currentStock * m.sellingPrice), 0);

  const categories = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'powder', 'solution', 'suspension', 'other'];

  if (!translationsLoaded) {
    return <ProtectedRoute><SidebarLayout title={t('pharmacy.title')} description=""><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></SidebarLayout></ProtectedRoute>;
  }

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('pharmacy.title')} description={t('pharmacy.description')}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder={t('pharmacy.searchMedicines')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">{t('pharmacy.allCategories')}</option>
                  {categories.map(cat => <option key={cat} value={cat}>{t(`pharmacy.categories.${cat}`)}</option>)}
                </select>
                <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">{t('pharmacy.allStock')}</option>
                  <option value="low">{t('pharmacy.lowStock')}</option>
                  <option value="expiring">{t('pharmacy.expiringSoon')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/pharmacy/dispensing" className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                <Package className="h-5 w-5" /><span>{t('pharmacy.dispensing')}</span>
              </Link>
              <Link href="/pharmacy/medicines/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-5 w-5" /><span>{t('pharmacy.addMedicine')}</span>
              </Link>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><Pill className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-sm text-gray-500">{t('pharmacy.totalMedicines')}</p><p className="text-2xl font-bold">{medicines.length}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
                <div><p className="text-sm text-gray-500">{t('pharmacy.lowStock')}</p><p className="text-2xl font-bold">{lowStockCount}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><Clock className="h-5 w-5 text-red-600" /></div>
                <div><p className="text-sm text-gray-500">{t('pharmacy.expiringSoon')}</p><p className="text-2xl font-bold">{expiringCount}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><Package className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-sm text-gray-500">{t('pharmacy.stockValue')}</p><p className="text-2xl font-bold">${totalValue.toFixed(0)}</p></div>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : filteredMedicines.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('pharmacy.noMedicines')}</h3>
              <p className="text-gray-500 mb-4">{t('pharmacy.noMedicinesDescription')}</p>
              <Link href="/pharmacy/medicines/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-5 w-5" /><span>{t('pharmacy.addMedicine')}</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pharmacy.medicine')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pharmacy.category')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pharmacy.stock')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pharmacy.price')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pharmacy.expiry')}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMedicines.map((med) => {
                      const isLowStock = med.currentStock <= med.reorderLevel;
                      const isExpiring = med.expiryDate && new Date(med.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                      return (
                        <tr key={med._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium">{med.name}</p>
                              <p className="text-xs text-gray-500">{med.genericName} • {med.strength}</p>
                              <p className="text-xs text-gray-400">{med.sku}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{t(`pharmacy.categories.${med.category}`)}</span></td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${isLowStock ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                              {med.currentStock} {med.unit}
                            </span>
                            {isLowStock && <p className="text-xs text-orange-600 mt-1">{t('pharmacy.reorderAt')}: {med.reorderLevel}</p>}
                          </td>
                          <td className="px-6 py-4 text-sm">${med.sellingPrice.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            {med.expiryDate ? (
                              <span className={`text-sm ${isExpiring ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                {new Date(med.expiryDate).toLocaleDateString()}
                              </span>
                            ) : <span className="text-gray-400 text-sm">-</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/pharmacy/medicines/${med._id}`} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"><Eye className="h-4 w-4" /></Link>
                              <Link href={`/pharmacy/medicines/${med._id}/edit`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="h-4 w-4" /></Link>
                              <button onClick={() => handleDelete(med._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
