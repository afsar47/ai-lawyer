'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Plus, Search, Calendar } from 'lucide-react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';

type HearingRow = {
  _id: string;
  hearingType: string;
  hearingDate: string;
  hearingTime: string;
  courtName: string;
  judgeName?: string;
  caseNumber?: string;
  clientName?: string;
  status: string;
};

export default function HearingsPage() {
  const { t } = useTranslations();
  const [items, setItems] = useState<HearingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<'all' | string>('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/hearings?limit=200');
        if (res.ok) setItems(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((h) => {
      const matchesStatus = status === 'all' || h.status === status;
      const matchesSearch =
        !q ||
        h.courtName?.toLowerCase().includes(q) ||
        (h.clientName || '').toLowerCase().includes(q) ||
        (h.caseNumber || '').toLowerCase().includes(q) ||
        (h.judgeName || '').toLowerCase().includes(q) ||
        (h.hearingType || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [items, searchTerm, status]);

  const badge = (value: string) => {
    const base = 'inline-flex px-2 py-1 rounded-full text-xs font-medium';
    if (value === 'scheduled') return `${base} bg-blue-100 text-blue-800`;
    if (value === 'confirmed') return `${base} bg-green-100 text-green-800`;
    if (value === 'in_progress') return `${base} bg-yellow-100 text-yellow-800`;
    if (value === 'completed') return `${base} bg-gray-100 text-gray-800`;
    if (value === 'cancelled') return `${base} bg-red-100 text-red-800`;
    if (value === 'adjourned') return `${base} bg-purple-100 text-purple-800`;
    return `${base} bg-gray-100 text-gray-800`;
  };

  const typeBadge = (value: string) => {
    const base = 'inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
    return base;
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('hearings.title')} description={t('hearings.description')}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-blue-700" />
              </div>
              <div className="text-sm text-gray-600">{filtered.length} {t('hearings.title').toLowerCase()}</div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setView(view === 'list' ? 'calendar' : 'list')}
                className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4" />
                <span>{view === 'list' ? t('navigation.calendar') : t('common.view')}</span>
              </button>
              <Link
                href="/hearings/new"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>{t('hearings.newHearing')}</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by court, client, case, judge..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('common.status')}</option>
                  <option value="scheduled">{t('hearings.statuses.scheduled')}</option>
                  <option value="confirmed">{t('hearings.statuses.confirmed')}</option>
                  <option value="in_progress">{t('hearings.statuses.in_progress')}</option>
                  <option value="completed">{t('hearings.statuses.completed')}</option>
                  <option value="cancelled">{t('hearings.statuses.cancelled')}</option>
                  <option value="adjourned">{t('hearings.statuses.adjourned')}</option>
                </select>
              </div>
            </div>
          </div>

          {view === 'list' ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-6 text-gray-600">{t('common.loading')}</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-gray-600">{t('hearings.noHearings')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Court
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Judge
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Case / Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filtered.map((h) => (
                        <tr key={h._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {new Date(h.hearingDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">{h.hearingTime}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={typeBadge(h.hearingType)}>
                              {h.hearingType.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{h.courtName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{h.judgeName || '—'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{h.caseNumber || '—'}</div>
                            <div className="text-xs text-gray-500">{h.clientName || ''}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={badge(h.status)}>{h.status.replace('_', ' ')}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/hearings/${h._id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center text-gray-600">
                Calendar view coming soon. Use list view for now.
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
