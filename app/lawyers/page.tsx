'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users, Plus, Search, Filter, MoreVertical } from 'lucide-react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';

export default function LawyersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'doctor' | 'staff'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [workload, setWorkload] = useState<Record<string, number>>({});

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchLawyers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, page, pageSize, roleFilter, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleFilter, pageSize]);

  const fetchLawyers = async () => {
    try {
      const params = new URLSearchParams();
      params.set('roles', roleFilter === 'all' ? 'admin,doctor,staff' : roleFilter);
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (searchTerm.trim()) params.set('q', searchTerm.trim());

      const response = await fetch(`/api/lawyers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const rows = data.data || [];
        setLawyers(rows);
        setTotal(data.total || 0);

        const emails = rows.map((u: any) => String(u.email || '').toLowerCase()).filter(Boolean);
        if (emails.length) {
          const wRes = await fetch(`/api/lawyers/workload?emails=${encodeURIComponent(emails.join(','))}`);
          if (wRes.ok) {
            const wData = await wRes.json();
            setWorkload(wData.counts || {});
          }
        } else {
          setWorkload({});
        }
      }
    } catch (error) {
      console.error('Error fetching lawyers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLawyers = lawyers;

  const currency = (n: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n || 0);

  const licenseStatus = (dateStr?: string) => {
    if (!dateStr) return { label: '—', cls: 'bg-gray-100 text-gray-800' };
    const dt = new Date(dateStr);
    if (Number.isNaN(dt.getTime())) return { label: '—', cls: 'bg-gray-100 text-gray-800' };
    const days = Math.ceil((dt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: `Expired`, cls: 'bg-red-100 text-red-800' };
    if (days <= 30) return { label: `Expiring (${days}d)`, cls: 'bg-yellow-100 text-yellow-800' };
    return { label: dt.toLocaleDateString(), cls: 'bg-green-100 text-green-800' };
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditLawyer = (lawyer: any) => {
    router.push(`/lawyers/${lawyer._id}/edit`);
  };

  const handleDeleteLawyer = async (lawyerId: string, lawyerName: string) => {
    if (!confirm(`Are you sure you want to delete ${lawyerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/lawyers?id=${lawyerId}`, { method: 'DELETE' });
      if (response.ok) {
        alert('Lawyer deleted successfully!');
        fetchLawyers();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting lawyer:', error);
      alert('Error deleting lawyer');
    }
  };

  const toggleActionsMenu = (lawyerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowActionsMenu(showActionsMenu === lawyerId ? null : lawyerId);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const menuElements = document.querySelectorAll('[data-menu-id]');
      let clickedInsideMenu = false;
      menuElements.forEach((menu) => {
        if (menu.contains(target)) clickedInsideMenu = true;
      });
      if (!clickedInsideMenu) setShowActionsMenu(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionsMenu]);

  if (!isAdmin) return null;
  const totalPages = Math.max(Math.ceil((total || 0) / pageSize), 1);

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('lawyers.title')} description={t('lawyers.description')}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {total} {total === 1 ? t('lawyers.user') : t('lawyers.users')}
            </span>
          </div>
          <Link
            href="/lawyers/new"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t('lawyers.addLawyer')}</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('lawyers.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('lawyers.allRoles')}</option>
                <option value="doctor">{t('lawyers.lawyersRole')}</option>
                <option value="staff">{t('lawyers.staffRole')}</option>
                <option value="admin">{t('lawyers.adminsRole')}</option>
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
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">{t('common.loading')}</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t('lawyers.lawyer')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t('lawyers.role')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t('lawyers.practiceAreas')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t('lawyers.activeCases')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {t('lawyers.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLawyers.map((lawyer) => (
                    <tr
                      key={lawyer._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/lawyers/${lawyer._id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/lawyers/${lawyer._id}`);
                        }
                      }}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{lawyer.name}</div>
                            <div className="text-sm text-gray-500">{lawyer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getRoleColor(lawyer.role)}`}>
                          {lawyer.role === 'doctor' ? 'Lawyer' : (lawyer.role || 'Lawyer')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {Array.isArray(lawyer.practiceAreas) && lawyer.practiceAreas.length
                            ? lawyer.practiceAreas.slice(0, 3).join(', ') + (lawyer.practiceAreas.length > 3 ? '…' : '')
                            : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const email = String(lawyer.email || '').toLowerCase();
                          const openCount = workload[email] || 0;
                          const max = lawyer.maxCases !== undefined && lawyer.maxCases !== null ? Number(lawyer.maxCases) : null;
                          const isOverloaded = max && openCount >= max;
                          return (
                            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${isOverloaded ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                              {max ? `${openCount} / ${max}` : openCount}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/lawyers/${lawyer._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            {t('lawyers.details')}
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLawyer(lawyer);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            {t('lawyers.edit')}
                          </button>
                          {lawyer.email !== session?.user?.email && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleActionsMenu(lawyer._id, e);
                                }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {showActionsMenu === lawyer._id && (
                                <div
                                  data-menu-id={lawyer._id}
                                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                                >
                                  <button
                                    onClick={() => {
                                      setShowActionsMenu(null);
                                      handleDeleteLawyer(lawyer._id, lawyer.name);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    {t('lawyers.delete')}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            {t('lawyers.page')} {page} {t('lawyers.of')} {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {t('lawyers.previous')}
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {t('lawyers.next')}
            </button>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

