'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Receipt, Search } from 'lucide-react';

type InvoiceRow = {
  _id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  createdAt?: string;
  dueDate?: string;
};

export default function ClientPortalInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/patient-portal/invoices');
        const data = await res.json();
        if (res.ok) setInvoices(data.invoices || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => inv.invoiceNumber?.toLowerCase().includes(q));
  }, [invoices, searchTerm]);

  const badge = (status: string) => {
    const base = 'inline-flex px-2 py-1 rounded-full text-xs font-medium';
    if (status === 'paid') return `${base} bg-green-100 text-green-800`;
    if (status === 'pending' || status === 'partial') return `${base} bg-yellow-100 text-yellow-800`;
    if (status === 'cancelled') return `${base} bg-gray-100 text-gray-800`;
    return `${base} bg-blue-100 text-blue-800`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
          <Receipt className="h-5 w-5 text-teal-700" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-600">View your invoices and payment status.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice #..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-600">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-gray-600">No invoices found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((inv) => (
              <Link
                key={inv._id}
                href={`/patient-portal/invoices/${inv._id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{inv.invoiceNumber}</div>
                    <div className="text-xs text-gray-500">
                      Total {inv.total} {inv.dueDate ? `• Due ${new Date(inv.dueDate).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  <span className={badge(inv.status)}>{inv.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

