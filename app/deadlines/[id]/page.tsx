'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';

export default function DeadlineDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/deadlines/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load deadline');
        setItem(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load deadline');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  return (
    <ProtectedRoute>
      <SidebarLayout title="Deadline" description="Deadline details">
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : error ? (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
        ) : !item ? (
          <div className="text-gray-600">Deadline not found.</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                <p className="text-sm text-gray-600">
                  {item.type} • {item.status} • Due {new Date(item.dueDate).toLocaleDateString()}
                </p>
              </div>
              <Link
                href={`/deadlines/${item._id}/edit`}
                className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Case</div>
                <div className="text-sm text-gray-900 mt-1">{item.matterNumber || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Client</div>
                <div className="text-sm text-gray-900 mt-1">{item.clientName || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Created</div>
                <div className="text-sm text-gray-900 mt-1">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase">Updated</div>
                <div className="text-sm text-gray-900 mt-1">
                  {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-semibold text-gray-900 mb-2">Notes</div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{item.notes || '—'}</div>
            </div>
          </div>
        )}
      </SidebarLayout>
    </ProtectedRoute>
  );
}

