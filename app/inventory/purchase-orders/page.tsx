'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/app/protected-route';
import SidebarLayout from '@/app/components/sidebar-layout';
import { useTranslations } from '@/app/hooks/useTranslations';
import { ShoppingCart, Plus, Search, Eye, Edit, Trash2, CheckCircle, Clock, XCircle, Truck } from 'lucide-react';

interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  supplierName: string;
  items: { itemName: string; quantity: number; }[];
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  orderDate: string;
  expectedDeliveryDate?: string;
}

export default function PurchaseOrdersPage() {
  const { t, translationsLoaded } = useTranslations();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { fetchOrders(); }, [filterStatus]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      const response = await fetch(`/api/inventory/purchase-orders?${params}`);
      if (response.ok) setOrders(await response.json());
    } catch (error) { console.error('Error fetching orders:', error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('inventory.confirmDeleteOrder'))) return;
    try {
      const response = await fetch(`/api/inventory/purchase-orders/${id}`, { method: 'DELETE' });
      if (response.ok) setOrders(orders.filter(o => o._id !== id));
      else {
        const data = await response.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (error) { console.error('Error deleting order:', error); }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/inventory/purchase-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) fetchOrders();
    } catch (error) { console.error('Error updating status:', error); }
  };

  const filteredOrders = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-blue-100 text-blue-800',
      'ordered': 'bg-purple-100 text-purple-800',
      'partial': 'bg-orange-100 text-orange-800',
      'received': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'ordered': return <Truck className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'text-gray-500',
      'normal': 'text-blue-500',
      'high': 'text-orange-500',
      'urgent': 'text-red-500',
    };
    return colors[priority] || 'text-gray-500';
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const orderedCount = orders.filter(o => o.status === 'ordered').length;
  const totalValue = orders.filter(o => !['cancelled', 'received'].includes(o.status)).reduce((sum, o) => sum + o.totalAmount, 0);

  if (!translationsLoaded) {
    return <ProtectedRoute><SidebarLayout title="" description=""><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></SidebarLayout></ProtectedRoute>;
  }

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('inventory.purchaseOrders')} description={t('inventory.purchaseOrdersDescription')}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder={t('inventory.searchOrders')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">{t('inventory.allStatuses')}</option>
                <option value="draft">{t('inventory.orderStatus.draft')}</option>
                <option value="pending">{t('inventory.orderStatus.pending')}</option>
                <option value="approved">{t('inventory.orderStatus.approved')}</option>
                <option value="ordered">{t('inventory.orderStatus.ordered')}</option>
                <option value="received">{t('inventory.orderStatus.received')}</option>
                <option value="cancelled">{t('inventory.orderStatus.cancelled')}</option>
              </select>
            </div>
            <Link href="/inventory/purchase-orders/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="h-5 w-5" /><span>{t('inventory.newOrder')}</span>
            </Link>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-sm text-gray-500">{t('inventory.totalOrders')}</p><p className="text-2xl font-bold">{orders.length}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center"><Clock className="h-5 w-5 text-yellow-600" /></div>
                <div><p className="text-sm text-gray-500">{t('inventory.pendingApproval')}</p><p className="text-2xl font-bold">{pendingCount}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"><Truck className="h-5 w-5 text-purple-600" /></div>
                <div><p className="text-sm text-gray-500">{t('inventory.awaitingDelivery')}</p><p className="text-2xl font-bold">{orderedCount}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-sm text-gray-500">{t('inventory.pendingValue')}</p><p className="text-2xl font-bold">${totalValue.toFixed(0)}</p></div>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('inventory.noOrders')}</h3>
              <p className="text-gray-500 mb-4">{t('inventory.noOrdersDescription')}</p>
              <Link href="/inventory/purchase-orders/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-5 w-5" /><span>{t('inventory.newOrder')}</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('inventory.orderNumber')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('inventory.supplier')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('inventory.items')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('inventory.total')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('inventory.status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('inventory.orderDate')}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium">{order.orderNumber}</p>
                          <p className={`text-xs ${getPriorityColor(order.priority)}`}>{t(`inventory.priorityLabels.${order.priority}`)}</p>
                        </td>
                        <td className="px-6 py-4 text-sm">{order.supplierName}</td>
                        <td className="px-6 py-4 text-sm">
                          {order.items.length} {order.items.length === 1 ? t('inventory.item') : t('inventory.items')}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">${order.totalAmount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {t(`inventory.orderStatus.${order.status}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {order.status === 'pending' && (
                              <button onClick={() => handleStatusChange(order._id, 'approved')} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title={t('inventory.approve')}>
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            {order.status === 'approved' && (
                              <button onClick={() => handleStatusChange(order._id, 'ordered')} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title={t('inventory.markOrdered')}>
                                <Truck className="h-4 w-4" />
                              </button>
                            )}
                            {order.status === 'ordered' && (
                              <button onClick={() => handleStatusChange(order._id, 'received')} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title={t('inventory.markReceived')}>
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <Link href={`/inventory/purchase-orders/${order._id}`} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"><Eye className="h-4 w-4" /></Link>
                            {['draft', 'pending'].includes(order.status) && (
                              <Link href={`/inventory/purchase-orders/${order._id}/edit`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="h-4 w-4" /></Link>
                            )}
                            {['draft', 'cancelled'].includes(order.status) && (
                              <button onClick={() => handleDelete(order._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                            )}
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
