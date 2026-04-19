'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Plus, Search } from 'lucide-react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';

type DeadlineRow = {
  _id: string;
  title: string;
  type: string;
  status: string;
  dueDate: string;
  matterNumber?: string;
  clientName?: string;
};

export default function DeadlinesPage() {
  const { t } = useTranslations();
  const [items, setItems] = useState<DeadlineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<'all' | string>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/deadlines?limit=200');
        if (res.ok) setItems(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((d) => {
      const matchesStatus = status === 'all' || d.status === status;
      const matchesSearch =
        !q ||
        d.title?.toLowerCase().includes(q) ||
        (d.clientName || '').toLowerCase().includes(q) ||
        (d.matterNumber || '').toLowerCase().includes(q) ||
        (d.type || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [items, searchTerm, status]);

  const badge = (value: string) => {
    const base = 'inline-flex px-2 py-1 rounded-full text-xs font-medium';
    if (value === 'upcoming') return `${base} bg-yellow-100 text-yellow-800`;
    if (value === 'completed') return `${base} bg-green-100 text-green-800`;
    return `${base} bg-gray-100 text-gray-800`;
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('deadlines.title')} description={t('deadlines.description')}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-blue-700" />
              </div>
              <div className="text-sm text-gray-600">{filtered.length} {t('deadlines.deadlines')}</div>
            </div>
            <Link
              href="/deadlines/new"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{t('deadlines.newDeadline')}</span>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('deadlines.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('deadlines.all')}</option>
                  <option value="upcoming">{t('deadlines.pending')}</option>
                  <option value="completed">{t('deadlines.completed')}</option>
                  <option value="cancelled">{t('tasks.cancelled')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-6 text-gray-600">{t('tasks.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-gray-600">{t('deadlines.noDeadlines')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('deadlines.dueDate')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('deadlines.deadline')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('deadlines.caseClient')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('deadlines.status')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('deadlines.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((d) => (
                      <tr key={d._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{new Date(d.dueDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{d.type}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{d.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{d.matterNumber || '—'}</div>
                          <div className="text-xs text-gray-500">{d.clientName || ''}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={badge(d.status)}>{d.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/deadlines/${d._id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {t('deadlines.view')}
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

