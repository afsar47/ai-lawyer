'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function ClientPortalInvoiceDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/patient-portal/invoices/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load invoice');
        setInvoice(data.invoice);
      } catch (err: any) {
        setError(err?.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) return <div className="text-gray-600">Loading...</div>;
  if (error) return <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>;
  if (!invoice) return <div className="text-gray-600">Invoice not found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/patient-portal/invoices"
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-xl font-semibold text-gray-900">{invoice.invoiceNumber}</h1>
        <p className="text-sm text-gray-600 mt-1">
          Status: {invoice.status} • Total: {invoice.total}
        </p>
        {invoice.dueDate && (
          <p className="text-xs text-gray-500 mt-2">Due {new Date(invoice.dueDate).toLocaleDateString()}</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-sm font-semibold text-gray-900 mb-3">Items</div>
        <div className="space-y-2">
          {(invoice.items || []).map((it: any, idx: number) => (
            <div key={idx} className="flex items-start justify-between p-3 rounded-lg bg-gray-50">
              <div className="text-sm text-gray-900">
                <div className="font-medium">{it.description}</div>
                <div className="text-xs text-gray-500">
                  Qty {it.quantity} • Unit {it.unitPrice}
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-900">{it.total}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

