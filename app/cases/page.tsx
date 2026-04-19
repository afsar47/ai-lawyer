'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Plus, Search } from 'lucide-react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';

type CaseStatus = 'lead' | 'open' | 'closed';

type CaseRow = {
  _id: string;
  caseNumber: string;
  title: string;
  status: CaseStatus;
  priority: 'low' | 'medium' | 'high';
  practiceArea?: string;
  clientName: string;
  assignedLawyerName?: string;
  createdAt: string;
};

export default function CasesPage() {
  const { t } = useTranslations();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<'all' | CaseStatus>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, status, pageSize]);

  const filtered = useMemo(() => {
    return cases;
  }, [cases]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const load = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          params.set('page', String(page));
          params.set('limit', String(pageSize));
          if (searchTerm.trim()) params.set('q', searchTerm.trim());
          if (status !== 'all') params.set('status', status);
          const res = await fetch(`/api/cases?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            setCases(data.data || []);
            setTotal(data.total || 0);
          }
        } finally {
          setLoading(false);
        }
      };
      load();
    }, 250);
    return () => clearTimeout(handle);
  }, [page, pageSize, searchTerm, status]);

  const totalPages = Math.max(Math.ceil((total || 0) / pageSize), 1);

  const badge = (value: string, kind: 'status' | 'priority') => {
    const base = 'inline-flex px-2 py-1 rounded-full text-xs font-medium';
    if (kind === 'status') {
      if (value === 'open') return `${base} bg-green-100 text-green-800`;
      if (value === 'lead') return `${base} bg-yellow-100 text-yellow-800`;
      return `${base} bg-gray-100 text-gray-800`;
    }
    if (value === 'high') return `${base} bg-red-100 text-red-800`;
    if (value === 'medium') return `${base} bg-blue-100 text-blue-800`;
    return `${base} bg-gray-100 text-gray-800`;
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('cases.title')} description={t('cases.description')}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <div className="text-sm text-gray-600">{total} {t('cases.cases')}</div>
              </div>
            </div>
            <Link
              href="/cases/new"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{t('cases.newCase')}</span>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('cases.searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('cases.allStatuses')}</option>
                  <option value="lead">{t('cases.statuses.open')}</option>
                  <option value="open">{t('cases.statuses.in_progress')}</option>
                  <option value="closed">{t('cases.statuses.closed')}</option>
                </select>
              </div>
              <div>
                <select
                  value={String(pageSize)}
                  onChange={(e) => setPageSize(parseInt(e.target.value, 10) || 25)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="10">10 / page</option>
                  <option value="25">25 / page</option>
                  <option value="50">50 / page</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="py-10 text-center text-gray-600">{t('cases.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('cases.noCases')}</h3>
                <p className="mt-1 text-sm text-gray-600">{t('cases.noCases')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {t('cases.case')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {t('cases.client')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {t('cases.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {t('deadlines.priority')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {t('lawyers.lawyer')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {t('cases.openDate')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {t('cases.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((c) => (
                      <tr key={c._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link href={`/cases/${c._id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                            {c.caseNumber}
                          </Link>
                          <div className="text-sm text-gray-700">{c.title}</div>
                          {c.practiceArea && <div className="text-xs text-gray-500">{c.practiceArea}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.clientName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={badge(c.status, 'status')}>{c.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={badge(c.priority, 'priority')}>{c.priority}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {c.assignedLawyerName || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-3">
                            <Link
                              href={`/cases/${c._id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              {t('cases.view')}
                            </Link>
                            <Link
                              href={`/cases/${c._id}/edit`}
                              className="text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                              {t('cases.edit')}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {t('cases.page')} {page} {t('cases.of')} {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t('cases.previous')}
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t('cases.next')}
              </button>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

