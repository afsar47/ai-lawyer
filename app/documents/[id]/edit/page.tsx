'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '../../../protected-route';
import SidebarLayout from '../../../components/sidebar-layout';

export default function EditDocumentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    type: 'other',
    status: 'draft',
    sharedWithClient: false,
    content: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/documents/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load document');
        setForm({
          title: data.title || '',
          type: data.type || 'other',
          status: data.status || 'draft',
          sharedWithClient: Boolean(data.sharedWithClient),
          content: data.content || '',
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((p) => ({ ...p, [name]: checked }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update document');
      router.push(`/documents/${id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update document');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title="Edit Document" description="Update document details">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={onChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="engagement">Engagement</option>
                      <option value="contract">Contract</option>
                      <option value="pleading">Pleading</option>
                      <option value="evidence">Evidence</option>
                      <option value="case_note">Case Note</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="review">In Review</option>
                      <option value="final">Final</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2 mt-6 md:mt-0">
                    <input
                      id="sharedWithClient"
                      name="sharedWithClient"
                      type="checkbox"
                      checked={form.sharedWithClient}
                      onChange={onChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sharedWithClient" className="text-sm text-gray-700">
                      Share with client
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    name="content"
                    value={form.content}
                    onChange={onChange}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/documents/${id}`)}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

