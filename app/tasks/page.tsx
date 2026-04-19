'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Plus, Search } from 'lucide-react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';

type TaskRow = {
  _id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  matterNumber?: string;
  clientName?: string;
  assignedToEmail?: string;
};

export default function TasksPage() {
  const { t: translate } = useTranslations();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<'all' | string>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/tasks?limit=300');
        if (res.ok) setTasks(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesStatus = status === 'all' || t.status === status;
      const matchesSearch =
        !q ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.clientName || '').toLowerCase().includes(q) ||
        (t.matterNumber || '').toLowerCase().includes(q) ||
        (t.assignedToEmail || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [tasks, searchTerm, status]);

  const badge = (value: string, kind: 'status' | 'priority') => {
    const base = 'inline-flex px-2 py-1 rounded-full text-xs font-medium';
    if (kind === 'status') {
      if (value === 'open') return `${base} bg-yellow-100 text-yellow-800`;
      if (value === 'done') return `${base} bg-green-100 text-green-800`;
      return `${base} bg-gray-100 text-gray-800`;
    }
    if (value === 'high') return `${base} bg-red-100 text-red-800`;
    if (value === 'medium') return `${base} bg-blue-100 text-blue-800`;
    return `${base} bg-gray-100 text-gray-800`;
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title={translate('tasks.title')} description={translate('tasks.description')}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-blue-700" />
              </div>
              <div className="text-sm text-gray-600">{filtered.length} {translate('tasks.tasks')}</div>
            </div>
            <Link
              href="/tasks/new"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{translate('tasks.newTask')}</span>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={translate('tasks.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{translate('tasks.all')}</option>
                  <option value="open">{translate('tasks.open')}</option>
                  <option value="done">{translate('tasks.done')}</option>
                  <option value="cancelled">{translate('tasks.cancelled')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-6 text-gray-600">{translate('tasks.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-gray-600">{translate('tasks.noTasks')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {translate('tasks.task')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {translate('tasks.caseClient')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {translate('tasks.due')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {translate('tasks.status')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {translate('tasks.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((task) => (
                      <tr key={task._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          <div className="text-xs text-gray-500">{task.assignedToEmail || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{task.matterNumber || '—'}</div>
                          <div className="text-xs text-gray-500">{task.clientName || ''}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                          </div>
                          <div className="text-xs text-gray-500">{badge(task.priority, 'priority')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={badge(task.status, 'status')}>{task.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/tasks/${task._id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            {translate('tasks.view')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

