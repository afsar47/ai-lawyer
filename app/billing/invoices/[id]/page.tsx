'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  DollarSign,
  Printer,
  Download,
  FileText,
  User,
  Calendar,
} from 'lucide-react';
import ProtectedRoute from '../../../protected-route';
import SidebarLayout from '../../../components/sidebar-layout';
import { useTranslations } from '../../../hooks/useTranslations';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t, translationsLoaded } = useTranslations();
  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/billing/invoices/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data.invoice);
        setPayments(data.payments || []);
        setTotalPaid(data.totalPaid || 0);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!translationsLoaded || loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('billing.invoiceDetails')} description="">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  if (!invoice) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('billing.invoiceDetails')} description="">
          <div className="text-center py-12">
            <p className="text-gray-600">{t('billing.invoiceNotFound')}</p>
            <Link
              href="/billing"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              {t('common.back')} {t('billing.toBilling')}
            </Link>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  const remaining = invoice.total - totalPaid;

  return (
    <ProtectedRoute>
      <SidebarLayout
        title={t('billing.invoiceDetails')}
        description={invoice.invoiceNumber}
      >
        <div className="space-y-6">
          {/* Header Actions - Hidden in print */}
          <div className="flex items-center justify-between no-print">
            <Link
              href="/billing"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{t('common.back')}</span>
            </Link>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-5 w-5" />
                <span>{t('billing.print')}</span>
              </button>
              <Link
                href={`/billing/invoices/${params.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-5 w-5" />
                <span>{t('billing.edit')}</span>
              </Link>
              {remaining > 0 && (
                <Link
                  href={`/billing/invoices/${params.id}/payment`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <DollarSign className="h-5 w-5" />
                  <span>{t('billing.addPayment')}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Invoice Document - Print optimized */}
          <div className="invoice-document bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:p-8 print:shadow-none print:border-0 print:rounded-none">
            {/* Invoice Header */}
            <div className="invoice-header mb-8 print:mb-6">
              <div className="flex items-start justify-between mb-6 print:mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl print:mb-1">
                    INVOICE
                  </h1>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 print:text-xs">
                      {t('billing.invoiceNumber')}
                    </p>
                    <p className="text-xl font-semibold text-gray-900 print:text-lg">
                      {invoice.invoiceNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1 print:text-xs">
                    {t('billing.date')}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 print:text-base">
                    {formatDate(invoice.createdAt)}
                  </p>
                  {invoice.dueDate && (
                    <>
                      <p className="text-sm text-gray-500 mt-2 mb-1 print:text-xs print:mt-1">
                        {t('billing.dueDate')}
                      </p>
                      <p className="text-base font-medium text-gray-900 print:text-sm">
                        {formatDate(invoice.dueDate)}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="print:hidden">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {t(`billing.statusLabels.${invoice.status}`)}
                </span>
              </div>
            </div>

            {/* Client Information */}
            <div className="border-t border-gray-300 pt-6 mb-6 print:pt-4 print:mb-4">
              <div className="flex items-center mb-4 print:mb-3">
                <User className="w-5 h-5 text-gray-600 mr-2 print:hidden" />
                <h3 className="text-lg font-semibold text-gray-900 print:text-base print:font-bold print:uppercase print:tracking-wide">
                  {t('billing.patientInformation')}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1 print:text-xs print:font-medium">
                    {t('billing.patient')}
                  </p>
                  <p className="text-base font-semibold text-gray-900 print:text-sm">
                    {invoice.clientName || invoice.patientName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 print:text-xs print:font-medium">
                    {t('billing.email')}
                  </p>
                  <p className="text-base text-gray-900 print:text-sm">
                    {invoice.clientEmail || invoice.patientEmail}
                  </p>
                </div>
                {(invoice.clientPhone || invoice.patientPhone) && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 print:text-xs print:font-medium">
                      {t('billing.phone')}
                    </p>
                    <p className="text-base text-gray-900 print:text-sm">
                      {invoice.clientPhone || invoice.patientPhone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Items */}
            <div className="border-t border-gray-300 pt-6 print:pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 print:text-base print:font-bold print:uppercase print:tracking-wide print:mb-3">
                {t('billing.invoiceItems')}
              </h3>
              <div className="overflow-x-auto print:overflow-visible">
                <table className="min-w-full divide-y divide-gray-300 print:border print:border-gray-400">
                  <thead className="bg-gray-100 print:bg-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide print:border-r print:border-gray-400 print:px-3 print:py-2">
                        {t('billing.itemDescription')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide print:border-r print:border-gray-400 print:px-3 print:py-2">
                        {t('billing.quantity')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide print:border-r print:border-gray-400 print:px-3 print:py-2">
                        {t('billing.unitPrice')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide print:px-3 print:py-2">
                        {t('billing.total')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-300">
                    {invoice.items.map((item: any, index: number) => (
                      <tr key={index} className="print:border-b print:border-gray-300">
                        <td className="px-4 py-3 text-sm text-gray-900 print:px-3 print:py-2 print:border-r print:border-gray-300">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right print:px-3 print:py-2 print:border-r print:border-gray-300">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right print:px-3 print:py-2 print:border-r print:border-gray-300">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right print:px-3 print:py-2">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-6 flex justify-end print:mt-4">
                <div className="w-full md:w-1/3 space-y-2 print:w-2/5 print:space-y-1">
                  <div className="flex justify-between text-gray-700 print:text-sm">
                    <span className="font-medium">{t('billing.subtotal')}:</span>
                    <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax > 0 && (
                    <div className="flex justify-between text-gray-700 print:text-sm">
                      <span className="font-medium">{t('billing.tax')}:</span>
                      <span className="font-semibold">{formatCurrency(invoice.tax)}</span>
                    </div>
                  )}
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-gray-700 print:text-sm">
                      <span className="font-medium">{t('billing.discount')}:</span>
                      <span className="font-semibold">
                        -{formatCurrency(invoice.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t-2 border-gray-900 print:pt-2 print:text-base print:border-t print:border-gray-400">
                    <span>{t('billing.grandTotal')}:</span>
                    <span className="text-blue-600 print:text-gray-900">{formatCurrency(invoice.total)}</span>
                  </div>
                  {totalPaid > 0 && (
                    <>
                      <div className="flex justify-between text-gray-700 pt-3 print:pt-2 print:text-sm print:border-t print:border-gray-300">
                        <span className="font-medium">{t('billing.paidAmount')}:</span>
                        <span className="font-semibold text-green-600 print:text-gray-900">
                          {formatCurrency(totalPaid)}
                        </span>
                      </div>
                      {remaining > 0 && (
                        <div className="flex justify-between text-gray-700 print:text-sm">
                          <span className="font-medium">{t('billing.remaining')}:</span>
                          <span className="font-semibold text-red-600 print:text-gray-900">
                            {formatCurrency(remaining)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-6 pt-6 border-t border-gray-300 print:mt-4 print:pt-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2 print:text-xs print:uppercase print:tracking-wide">
                    {t('billing.notes')}
                  </p>
                  <p className="text-sm text-gray-900 print:text-xs">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment History - Hidden in print */}
          {payments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 no-print">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('billing.paymentHistory')}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('billing.paymentDate')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('billing.paymentMethod')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        {t('billing.paymentAmount')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('billing.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment: any) => (
                      <tr key={payment._id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {t(`billing.${payment.paymentMethod}`)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {payment.status === 'completed'
                              ? t('billing.paymentCompleted')
                              : payment.status}
                          </span>
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
