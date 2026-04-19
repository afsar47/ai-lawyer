'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Search } from 'lucide-react';

type DocRow = {
  _id: string;
  documentNumber: string;
  title: string;
  type: string;
  status: string;
  matterNumber?: string;
  createdAt?: string;
};

export default function ClientPortalDocumentsPage() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/patient-portal/documents');
        const data = await res.json();
        if (res.ok) setDocs(data.documents || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => {
      return (
        d.documentNumber?.toLowerCase().includes(q) ||
        d.title?.toLowerCase().includes(q) ||
        (d.matterNumber || '').toLowerCase().includes(q) ||
        (d.type || '').toLowerCase().includes(q)
      );
    });
  }, [docs, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
          <FileText className="h-5 w-5 text-teal-700" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Shared Documents</h1>
          <p className="text-sm text-gray-600">Documents shared with you by the firm.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by document #, title, matter #..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-600">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-gray-600">No documents found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((d) => (
              <Link
                key={d._id}
                href={`/patient-portal/documents/${d._id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-semibold text-gray-900">{d.title}</div>
                <div className="text-xs text-gray-500">
                  {d.documentNumber} • {d.type} • {d.status}
                  {d.matterNumber ? ` • ${d.matterNumber}` : ''}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

