'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Users } from 'lucide-react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';

type ClientRow = {
  _id: string;
  clientNumber: string;
  type: 'individual' | 'organization';
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
};

export default function ClientsPage() {
  const { t } = useTranslations();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [type, setType] = useState<'all' | 'individual' | 'organization'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'clientNumber'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    // reset to first page on query changes
    setPage(1);
  }, [searchTerm, type, sortBy, sortDir, pageSize]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const load = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          params.set('page', String(page));
          params.set('limit', String(pageSize));
          if (searchTerm.trim()) params.set('q', searchTerm.trim());
          if (type !== 'all') params.set('type', type);
          params.set('sortBy', sortBy);
          params.set('sortDir', sortDir);

          const res = await fetch(`/api/clients?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            setClients(data.data || []);
            setTotal(data.total || 0);
          }
        } finally {
          setLoading(false);
        }
      };
      load();
    }, 250);

    return () => clearTimeout(handle);
  }, [page, pageSize, searchTerm, type, sortBy, sortDir]);

  const filtered = useMemo(() => clients, [clients]);
  const totalPages = Math.max(Math.ceil((total || 0) / pageSize), 1);

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('clients.title')} description={t('clients.description')}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-700" />
              </div>
              <div className="text-sm text-gray-600">{total} {t('clients.clients')}</div>
            </div>
            <Link
              href="/clients/new"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{t('clients.newClient')}</span>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('clients.searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('clients.allTypes')}</option>
                  <option value="individual">{t('clients.individual')}</option>
                  <option value="organization">{t('clients.organization')}</option>
                </select>
                <select
                  value={`${sortBy}:${sortDir}`}
                  onChange={(e) => {
                    const [sb, sd] = e.target.value.split(':') as any;
                    setSortBy(sb);
                    setSortDir(sd);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt:desc">{t('clients.newest')}</option>
                  <option value="createdAt:asc">{t('clients.oldest')}</option>
                  <option value="name:asc">{t('clients.nameAZ')}</option>
                  <option value="name:desc">{t('clients.nameZA')}</option>
                  <option value="clientNumber:asc">{t('clients.clientNumberAsc')}</option>
                  <option value="clientNumber:desc">{t('clients.clientNumberDesc')}</option>
                </select>
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
              <div className="p-6 text-gray-600">{t('clients.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-gray-600">{t('clients.noClients')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('clients.client')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('clients.type')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('clients.contact')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('clients.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((c) => (
                      <tr key={c._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.clientNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {c.type === 'organization' ? t('clients.organization') : t('clients.individual')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{c.email || '—'}</div>
                          <div className="text-xs text-gray-500">{c.phone || ''}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/clients/${c._id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {t('clients.view')}
                          </Link>
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
              {t('clients.page')} {page} {t('clients.of')} {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t('clients.previous')}
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t('clients.next')}
              </button>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

