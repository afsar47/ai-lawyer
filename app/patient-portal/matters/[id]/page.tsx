'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';

export default function ClientPortalMatterDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [matter, setMatter] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/patient-portal/matters/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load matter');
        setMatter(data.matter);

        const docsRes = await fetch(`/api/patient-portal/documents?matterId=${encodeURIComponent(id)}`);
        const docsData = await docsRes.json();
        if (docsRes.ok) setDocuments(docsData.documents || []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load matter');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>;
  }

  if (!matter) {
    return <div className="text-gray-600">Case not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/patient-portal/matters"
          className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-xl font-semibold text-gray-900">{matter.caseNumber}</h1>
        <p className="text-sm text-gray-700 mt-1">{matter.title}</p>
        <p className="text-xs text-gray-500 mt-2">
          Status: {matter.status} • Practice area: {matter.practiceArea || '—'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-5 w-5 text-teal-700" />
          <h2 className="text-sm font-semibold text-gray-900">Shared documents</h2>
        </div>
        {documents.length === 0 ? (
          <div className="text-sm text-gray-600">No shared documents for this case yet.</div>
        ) : (
          <div className="space-y-3">
            {documents.map((d: any) => (
              <Link
                key={d._id}
                href={`/patient-portal/documents/${d._id}`}
                className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div className="text-sm font-medium text-gray-900">{d.title}</div>
                <div className="text-xs text-gray-500">
                  {d.documentNumber} • {d.type} • {d.status}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

