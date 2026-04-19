'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import CaseSearchSelect, { CaseOption } from '../../components/CaseSearchSelect';

function NewDeadlineForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedMatterId = searchParams.get('matterId') || '';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    type: 'deadline',
    status: 'upcoming',
    dueDate: '',
    matterId: preselectedMatterId,
    notes: '',
  });

  useEffect(() => {
    setForm((p) => ({ ...p, matterId: preselectedMatterId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedMatterId]);

  const handleCaseChange = (id: string, caseData: CaseOption | null) => {
    setForm((p) => ({ ...p, matterId: id }));
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        type: form.type,
        status: form.status,
        dueDate: form.dueDate,
        notes: form.notes,
      };
      if (form.matterId) payload.matterId = form.matterId;

      const res = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create deadline');
      router.push(`/deadlines/${data._id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create deadline');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title="New Deadline" description="Create a deadline or court date">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <Link href="/deadlines" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deadlines
            </Link>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
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
                placeholder="e.g., File response to motion"
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
                  <option value="deadline">Deadline</option>
                  <option value="court_date">Court date</option>
                  <option value="meeting">Meeting</option>
                  <option value="reminder">Reminder</option>
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
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due date *</label>
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={onChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <CaseSearchSelect
              label="Case (optional)"
              value={form.matterId}
              onChange={handleCaseChange}
              placeholder="Search and select a case..."
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={onChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Create Deadline'}
              </button>
            </div>
          </form>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

export default function NewDeadlinePage() {
  return (
    <Suspense fallback={<div className="text-gray-600">Loading...</div>}>
      <NewDeadlineForm />
    </Suspense>
  );
}

