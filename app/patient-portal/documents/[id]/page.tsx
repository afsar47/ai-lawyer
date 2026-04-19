'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';

export default function ClientPortalDocumentDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/patient-portal/documents/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load document');
        setDoc(data.document);
      } catch (err: any) {
        setError(err?.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) return <div className="text-gray-600">Loading...</div>;
  if (error) return <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>;
  if (!doc) return <div className="text-gray-600">Document not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/patient-portal/documents"
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Link>
        <button
          type="button"
          disabled={downloading}
          onClick={async () => {
            setDownloading(true);
            try {
              const { default: jsPDF } = await import('jspdf');
              const pdf = new jsPDF();
              pdf.setFontSize(16);
              pdf.text(String(doc.title || 'Document'), 14, 18);
              pdf.setFontSize(10);
              pdf.text(`${doc.documentNumber || ''}  •  ${doc.type || ''}  •  ${doc.status || ''}`.trim(), 14, 26);
              pdf.setFontSize(11);
              const content = String(doc.content || '').trim() || '—';
              const lines = pdf.splitTextToSize(content, 180);
              pdf.text(lines, 14, 36);
              pdf.save(`${doc.documentNumber || 'document'}.pdf`);
            } finally {
              setDownloading(false);
            }
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>{downloading ? 'Preparing...' : 'Download PDF'}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-xl font-semibold text-gray-900">{doc.title}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {doc.documentNumber} • {doc.type} • {doc.status}
          {doc.matterNumber ? ` • ${doc.matterNumber}` : ''}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-sm font-semibold text-gray-900 mb-2">Content</div>
        <div className="text-sm text-gray-700 whitespace-pre-wrap">{doc.content || '—'}</div>
      </div>
    </div>
  );
}

