'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
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
import ProtectedRoute from '../../../protected-route';
import SidebarLayout from '../../../components/sidebar-layout';
import { useTranslations } from '../../../hooks/useTranslations';
import SearchableClientSelect from '../../../components/SearchableClientSelect';
import SearchableServiceItemSelect from '../../../components/SearchableServiceItemSelect';
import CaseSearchSelect, { CaseOption } from '../../../components/CaseSearchSelect';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  serviceType?: 'consultation' | 'procedure' | 'test' | 'medication' | 'room' | 'other';
  serviceId?: string;
}

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, translationsLoaded } = useTranslations();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedMatterId, setSelectedMatterId] = useState<string>(searchParams.get('matterId') || '');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [serviceItems, setServiceItems] = useState<any[]>([]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchServiceItems();
  }, []);

  useEffect(() => {
    const preClientId = searchParams.get('clientId');
    const preMatterId = searchParams.get('matterId');
    if (preMatterId) setSelectedMatterId(preMatterId);
    if (preClientId) {
      // Best-effort prefill: fetch client by id via list endpoint
      (async () => {
        try {
          const res = await fetch(`/api/clients?limit=200`);
          if (res.ok) {
            const data = await res.json();
            const found = Array.isArray(data) ? data.find((c: any) => c._id === preClientId) : null;
            if (found) setSelectedClient(found);
          }
        } catch {
          // ignore
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        _id: (caseData as any).clientId || '',
        name: caseData.clientName,
        email: '',
        phone: '',
        clientNumber: (caseData as any).clientId || '',
      });
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

  // Wait for translations to load
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

  const handleSubmit = async (status: 'draft' | 'pending') => {
    if (!selectedClient) {
      alert(t('billing.validation.selectPatient'));
      return;
    }

    if (items.some(item => !item.description || item.unitPrice < 0 || (item.quantity || 0) <= 0)) {
      alert(t('billing.validation.itemsRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      const invoiceData = {
        clientId: selectedClient._id || selectedClient.clientNumber,
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
        status,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
      };

      const response = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/billing/invoices/${data.invoice._id}`);
      } else {
        const error = await response.json();
        alert(error.error || t('billing.validation.createFailed'));
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(t('billing.validation.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout
        title={t('billing.createInvoice')}
        description={t('billing.description')}
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
          </div>

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
              <p className="text-xs text-gray-500 mt-2">
                If you select a matter, the client will auto-fill from that matter.
              </p>
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
                        min="0.01"
                        step="0.25"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'quantity',
                            parseFloat(e.target.value) || 1
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
                href="/billing"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </Link>
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                <span>{t('billing.saveDraft')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('pending')}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
                <span>{t('billing.createAndSend')}</span>
              </button>
            </div>
          </form>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="text-gray-600">Loading...</div>}>
      <NewInvoiceForm />
    </Suspense>
  );
}
