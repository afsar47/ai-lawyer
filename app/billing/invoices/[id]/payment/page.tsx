'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, Calendar } from 'lucide-react';
import ProtectedRoute from '@/app/protected-route';
import SidebarLayout from '@/app/components/sidebar-layout';
import { useTranslations } from '@/app/hooks/useTranslations';

export default function RecordPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { t, translationsLoaded } = useTranslations();

  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (params?.id) {
      fetchInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/billing/invoices/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data.invoice);
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = useMemo(
    () =>
      payments.reduce((sum, p) => (p.status === 'completed' ? sum + p.amount : sum), 0),
    [payments]
  );

  const remaining = invoice ? Math.max(invoice.total - totalPaid, 0) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      alert(t('billing.paymentAmount'));
      return;
    }

    if (numericAmount > remaining) {
      alert(t('billing.paymentAmount') + ' ' + t('billing.remaining'));
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: params.id,
          amount: numericAmount,
          paymentMethod,
          paymentDate,
          transactionId,
          notes,
        }),
      });

      if (response.ok) {
        alert(t('billing.paymentRecorded'));
        router.push(`/billing/invoices/${params.id}`);
      } else {
        const error = await response.json();
        alert(error.error || t('common.error'));
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!translationsLoaded || loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout title={t('billing.recordPayment')} description="">
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
        <SidebarLayout title={t('billing.recordPayment')} description="">
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

  return (
    <ProtectedRoute>
      <SidebarLayout
        title={t('billing.recordPayment')}
        description={invoice.invoiceNumber}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href={`/billing/invoices/${params.id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{t('common.back')}</span>
            </Link>
            <div className="text-right">
              <p className="text-sm text-gray-600">{t('billing.remaining')}</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(remaining)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('billing.paymentAmount')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('billing.paymentMethod')}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="cash">{t('billing.cash')}</option>
                    <option value="card">{t('billing.card')}</option>
                    <option value="upi">{t('billing.upi')}</option>
                    <option value="bankTransfer">{t('billing.bankTransfer')}</option>
                    <option value="cheque">{t('billing.cheque')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('billing.paymentDate')}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <Calendar className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('billing.transactionId')}
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('billing.transactionId')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('billing.paymentNotes')}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('billing.paymentNotes')}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Link
                  href={`/billing/invoices/${params.id}`}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <DollarSign className="h-5 w-5" />
                  <span>
                    {submitting ? t('common.saving') : t('billing.recordPayment')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
