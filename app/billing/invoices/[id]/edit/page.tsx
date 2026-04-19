'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  User,
  FileText,
  DollarSign,
} from 'lucide-react';
import ProtectedRoute from '../../../../protected-route';
import SidebarLayout from '../../../../components/sidebar-layout';
import { useTranslations } from '../../../../hooks/useTranslations';
import SearchableClientSelect from '../../../../components/SearchableClientSelect';
import SearchableServiceItemSelect from '../../../../components/SearchableServiceItemSelect';
import CaseSearchSelect, { CaseOption } from '../../../../components/CaseSearchSelect';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  serviceType?: 'consultation' | 'procedure' | 'test' | 'medication' | 'room' | 'other';
  serviceId?: string;
}

function EditInvoiceForm({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { t, translationsLoaded } = useTranslations();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedMatterId, setSelectedMatterId] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [serviceItems, setServiceItems] = useState<any[]>([]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending' | 'partial' | 'paid' | 'cancelled'>('draft');

  useEffect(() => {
    fetchServiceItems();
    fetchInvoice();
  }, [resolvedParams.id]);

  const fetchServiceItems = async () => {
    try {
      const response = await fetch('/api/billing/service-items?activeOnly=true');
      if (response.ok) {
        const data = await response.json();
        setServiceItems(data.serviceItems || []);
      }
    } catch (error) {
      console.error('Error fetching service items:', error);
    }
  };

  const handleCaseChange = (id: string, caseData: CaseOption | null) => {
    setSelectedMatterId(id);
    if (caseData) {
      setSelectedClient({
        _id: caseData.clientId || '',
        name: caseData.clientName,
        email: '',
        phone: '',
        clientNumber: caseData.clientId || '',
      });
    }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/billing/invoices/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        const invoice = data.invoice;
        
        // Set client (preferred) with legacy fallback
        const clientKey = invoice.clientId || invoice.patientId;
        if (clientKey) {
          setSelectedClient({
            _id: clientKey,
            clientNumber: invoice.patientId,
            name: invoice.clientName || invoice.patientName,
            email: invoice.clientEmail || invoice.patientEmail,
            phone: invoice.clientPhone || invoice.patientPhone,
          });
        }

        // Set items
        if (invoice.items && invoice.items.length > 0) {
          setItems(invoice.items);
        }

        // Set other fields
        setTax(invoice.tax || 0);
        setDiscount(invoice.discount || 0);
        setDueDate(invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '');
        setNotes(invoice.notes || '');
        setStatus(invoice.status || 'draft');
        setSelectedMatterId(invoice.matterId || '');
      } else {
        setError('Invoice not found');
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceItemSelect = (index: number, serviceItem: any | null) => {
    const newItems = [...items];
    if (serviceItem) {
      newItems[index] = {
        ...newItems[index],
        description: serviceItem.name,
        unitPrice: serviceItem.unitPrice,
        serviceType: serviceItem.serviceType,
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        description: '',
        unitPrice: 0,
        serviceType: undefined,
      };
    }
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      return sum + (item.quantity || 1) * (item.unitPrice || 0);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + (tax || 0) - (discount || 0);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (newStatus?: 'draft' | 'pending') => {
    if (!selectedClient) {
      setError(t('billing.validation.selectPatient'));
      return;
    }

    if (items.some(item => !item.description || item.unitPrice <= 0)) {
      setError(t('billing.validation.itemsRequired'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      const invoiceData = {
        clientId: selectedClient._id,
        matterId: selectedMatterId || undefined,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          total: (item.quantity || 1) * (item.unitPrice || 0),
          serviceType: item.serviceType,
          serviceId: item.serviceId,
        })),
        subtotal: calculateSubtotal(),
        tax: tax || 0,
        discount: discount || 0,
        total: calculateTotal(),
        status: newStatus || status,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
      };

      const response = await fetch(`/api/billing/invoices/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        router.push(`/billing/invoices/${resolvedParams.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t('billing.validation.updateFailed'));
      }
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError(t('billing.validation.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('billing.editInvoice')} description="">
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
        <SidebarLayout title={t('billing.editInvoice')} description="">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading invoice data...</span>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout
        title={t('billing.editInvoice')}
        description={t('billing.editInvoiceDescription')}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              href={`/billing/invoices/${resolvedParams.id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{t('common.back')}</span>
            </Link>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form className="space-y-6">
            {/* Case */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <FileText className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Case (optional)</h2>
              </div>
              <CaseSearchSelect
                value={selectedMatterId}
                onChange={handleCaseChange}
                placeholder="Search and select a case..."
              />
            </div>

            {/* Client Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <User className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('billing.patientInformation')}
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('billing.patient')} *
                </label>
                <SearchableClientSelect
                  value={selectedClient?.name || ''}
                  onChange={(client) => setSelectedClient(client)}
                  placeholder={t('billing.patientPlaceholder')}
                  className="w-full"
                />
                {selectedClient && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedClient.name}
                    </p>
                    <p className="text-sm text-gray-600">{selectedClient.email}</p>
                    <p className="text-sm text-gray-600">{selectedClient.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <FileText className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('billing.invoiceItems')}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>{t('billing.addItem')}</span>
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('billing.itemDescription')} *
                      </label>
                      <SearchableServiceItemSelect
                        value={item.description}
                        onChange={(serviceItem) => handleServiceItemSelect(index, serviceItem)}
                        placeholder={t('billing.serviceItems.searchPlaceholder')}
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('billing.quantity')} *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'quantity',
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('billing.unitPrice')} *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'unitPrice',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="col-span-12 md:col-span-1 flex items-end">
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('billing.total')}
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium">
                          ${((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-1 flex items-end">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals and Additional Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t('billing.invoiceDetails')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('billing.status')}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={status === 'paid'}
                  >
                    <option value="draft">{t('billing.statusLabels.draft')}</option>
                    <option value="pending">{t('billing.statusLabels.pending')}</option>
                    <option value="partial">{t('billing.statusLabels.partial')}</option>
                    <option value="paid">{t('billing.statusLabels.paid')}</option>
                    <option value="cancelled">{t('billing.statusLabels.cancelled')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('billing.dueDateLabel')}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>{t('billing.subtotal')}:</span>
                    <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>{t('billing.tax')}:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={tax}
                        onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="font-medium">${(tax || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>{t('billing.discount')}:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="font-medium">${(discount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t">
                    <span>{t('billing.grandTotal')}:</span>
                    <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('billing.notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('billing.notesPlaceholder')}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4">
              <Link
                href={`/billing/invoices/${resolvedParams.id}`}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </Link>
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                <span>{saving ? t('common.saving') : t('common.save')}</span>
              </button>
              {status !== 'paid' && (
                <button
                  type="button"
                  onClick={() => handleSubmit('pending')}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                  <span>{t('billing.updateAndSend')}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
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
      <EditInvoiceForm params={params} />
    </Suspense>
  );
}
