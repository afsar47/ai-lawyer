'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';

export default function TaskDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    dueDate: '',
    assignedToEmail: '',
    assignedToName: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tasks/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load task');
        setTask(data);
        setForm({
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'open',
          priority: data.priority || 'medium',
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 10) : '',
          assignedToEmail: data.assignedToEmail || '',
          assignedToName: data.assignedToName || '',
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        assignedToEmail: form.assignedToEmail || undefined,
        assignedToName: form.assignedToName || undefined,
      };
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save task');
      setTask(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm('Delete this task?')) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to delete task');
      router.push('/tasks');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title="Task" description="View and edit task">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <Link href="/tasks" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to tasks
            </Link>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
          )}

          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : !task ? (
            <div className="text-gray-600">Task not found.</div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase">Case</div>
                  <div className="text-sm text-gray-900 mt-1">{task.matterNumber || '—'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase">Client</div>
                  <div className="text-sm text-gray-900 mt-1">{task.clientName || '—'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase">Created</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {task.createdAt ? new Date(task.createdAt).toLocaleString() : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase">Updated</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {task.updatedAt ? new Date(task.updatedAt).toLocaleString() : '—'}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="open">Open</option>
                      <option value="done">Done</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={form.dueDate}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned to email</label>
                    <input
                      name="assignedToEmail"
                      value={form.assignedToEmail}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned to name</label>
                    <input
                      name="assignedToName"
                      value={form.assignedToName}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={onChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={remove}
                    disabled={deleting}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

