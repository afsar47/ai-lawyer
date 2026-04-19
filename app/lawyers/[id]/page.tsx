'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarClock,
  Edit,
  FileText,
  Gavel,
  Receipt,
  Users,
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import { useTranslations } from '../../hooks/useTranslations';

export default function LawyerDetailsPage() {
  const { t } = useTranslations();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lawyer, setLawyer] = useState<any>(null);
  const [counts, setCounts] = useState<any>(null);
  const [data, setData] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'matters' | 'clients' | 'appointments' | 'documents' | 'deadlines' | 'hearings' | 'invoices'
  >('overview');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
    }
  }, [isAdmin, router]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/lawyers/${encodeURIComponent(String(id))}/details`);
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error || 'Failed to load lawyer');
        setLawyer(payload.lawyer || null);
        setCounts(payload.counts || null);
        setData(payload.data || null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load lawyer');
      } finally {
        setLoading(false);
      }
    };
    if (isAdmin) load();
  }, [id, isAdmin]);

  const licenseBadge = useMemo(() => {
    const dt = lawyer?.licenseExpiry ? new Date(lawyer.licenseExpiry) : null;
    if (!dt || Number.isNaN(dt.getTime())) return { label: '—', cls: 'bg-gray-100 text-gray-800' };
    const days = Math.ceil((dt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: t('lawyers.expired'), cls: 'bg-red-100 text-red-800' };
    if (days <= 30) return { label: `${t('lawyers.expiring')} (${days}d)`, cls: 'bg-yellow-100 text-yellow-800' };
    return { label: dt.toLocaleDateString(), cls: 'bg-green-100 text-green-800' };
  }, [lawyer?.licenseExpiry, t]);

  const currency = (n: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n || 0);

  const totalBilled = useMemo(() => {
    const rows = (data?.invoices || []) as any[];
    return rows.reduce((sum, inv) => sum + (Number(inv?.total) || 0), 0);
  }, [data?.invoices]);

  const tabs: Array<{ id: typeof activeTab; label: string; count?: number }> = [
    { id: 'overview', label: t('lawyers.detailsPage.tabs.overview') },
    { id: 'matters', label: t('lawyers.detailsPage.tabs.cases'), count: counts?.mattersTotal ?? (data?.matters?.length || 0) },
    { id: 'clients', label: t('lawyers.detailsPage.tabs.clients'), count: counts?.clients ?? (data?.clients?.length || 0) },
    { id: 'appointments', label: t('lawyers.detailsPage.tabs.consultations'), count: counts?.appointments ?? (data?.appointments?.length || 0) },
    { id: 'documents', label: t('lawyers.detailsPage.tabs.documents'), count: counts?.documents ?? (data?.documents?.length || 0) },
    { id: 'deadlines', label: t('lawyers.detailsPage.tabs.deadlines'), count: counts?.deadlines ?? (data?.deadlines?.length || 0) },
    { id: 'hearings', label: t('lawyers.detailsPage.tabs.hearings'), count: counts?.hearings ?? (data?.hearings?.length || 0) },
    { id: 'invoices', label: t('lawyers.detailsPage.tabs.invoices'), count: counts?.invoices ?? (data?.invoices?.length || 0) },
  ];

  if (!isAdmin) return null;

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('lawyers.lawyer')} description={t('lawyers.detailsPage.title')}>
        {loading ? (
          <div className="text-gray-600">{t('common.loading')}</div>
        ) : error ? (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
        ) : !lawyer ? (
          <div className="text-gray-600">{t('lawyers.detailsPage.notFound')}</div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <Link href="/lawyers" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('lawyers.detailsPage.backToLawyers')}
              </Link>
              <Link
                href={`/lawyers/${lawyer._id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
              >
                <Edit className="h-4 w-4" />
                {t('lawyers.detailsPage.editProfile')}
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-semibold text-gray-900 truncate">{lawyer.name}</div>
                  <div className="text-sm text-gray-600 truncate">{lawyer.email}</div>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    {lawyer.role === 'doctor' ? 'lawyer' : lawyer.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase">{t('lawyers.detailsPage.openMatters')}</div>
                  <div className="text-2xl font-semibold text-gray-900 mt-1">{counts?.mattersOpen ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('lawyers.detailsPage.capacity')}: {lawyer.maxCases ? `${counts?.mattersOpen ?? 0} / ${lawyer.maxCases}` : '—'}
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase">{t('lawyers.detailsPage.tabs.clients')}</div>
                  <div className="text-2xl font-semibold text-gray-900 mt-1">
                    {counts?.clients ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{counts?.mattersTotal ?? 0} {t('lawyers.detailsPage.mattersTotal')}</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase">{t('lawyers.detailsPage.invoicesTotal')}</div>
                  <div className="text-2xl font-semibold text-gray-900 mt-1">{currency(totalBilled)}</div>
                  <div className="text-xs text-gray-500 mt-1">{counts?.invoices ?? 0} {t('lawyers.detailsPage.tabs.invoices').toLowerCase()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase">{t('lawyers.detailsPage.defaultRate')}</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {lawyer.defaultHourlyRate !== undefined && lawyer.defaultHourlyRate !== null
                      ? `${currency(Number(lawyer.defaultHourlyRate) || 0)}/hr`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase">{t('lawyers.practiceAreas')}</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {Array.isArray(lawyer.practiceAreas) && lawyer.practiceAreas.length ? lawyer.practiceAreas.join(', ') : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase">{t('lawyers.detailsPage.license')}</div>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${licenseBadge.cls}`}>
                      {licenseBadge.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{lawyer.licenseNumber || '—'}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200 px-4 py-3 flex flex-wrap gap-2">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      activeTab === t.id ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t.label}
                    {typeof t.count === 'number' ? (
                      <span className={`ml-2 text-xs ${activeTab === t.id ? 'text-white/90' : 'text-gray-500'}`}>
                        {t.count}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'overview' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="text-sm font-semibold text-gray-900 mb-3">{t('lawyers.detailsPage.profile')}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 uppercase">{t('lawyers.newLawyer.phone')}</div>
                            <div className="text-sm text-gray-900 mt-1">{lawyer.phone || '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase">{t('lawyers.newLawyer.department')}</div>
                            <div className="text-sm text-gray-900 mt-1">{lawyer.department || '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase">{t('lawyers.newLawyer.specialization')}</div>
                            <div className="text-sm text-gray-900 mt-1">{lawyer.specialization || '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase">{t('lawyers.detailsPage.experience')}</div>
                            <div className="text-sm text-gray-900 mt-1">
                              {lawyer.yearsOfExperience !== undefined && lawyer.yearsOfExperience !== null
                                ? `${lawyer.yearsOfExperience} ${t('lawyers.detailsPage.years')}`
                                : '—'}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-xs text-gray-500 uppercase">{t('lawyers.newLawyer.address')}</div>
                            <div className="text-sm text-gray-900 mt-1">{lawyer.address || '—'}</div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-xs text-gray-500 uppercase">{t('lawyers.newLawyer.bio')}</div>
                            <div className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{lawyer.bio || '—'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Briefcase className="h-4 w-4 text-gray-500" />
                          <div className="text-sm font-semibold text-gray-900">{t('lawyers.detailsPage.recentMatters')}</div>
                        </div>
                        {(data?.matters || []).length === 0 ? (
                          <div className="text-sm text-gray-600">{t('lawyers.detailsPage.noMatters')}</div>
                        ) : (
                          <div className="space-y-2">
                            {(data?.matters || []).slice(0, 8).map((m: any) => (
                              <div key={m._id} className="flex items-center justify-between gap-3">
                                <Link href={`/cases/${m._id}`} className="text-sm text-blue-600 hover:text-blue-800 truncate">
                                  {m.caseNumber} — {m.title}
                                </Link>
                                <span className="text-xs text-gray-500 whitespace-nowrap">{m.status}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CalendarClock className="h-4 w-4 text-gray-500" />
                          <div className="text-sm font-semibold text-gray-900">{t('lawyers.detailsPage.upcomingDeadlines')}</div>
                        </div>
                        {(data?.deadlines || []).length === 0 ? (
                          <div className="text-sm text-gray-600">{t('lawyers.detailsPage.noDeadlines')}</div>
                        ) : (
                          <div className="space-y-2">
                            {(data?.deadlines || []).slice(0, 8).map((d: any) => (
                              <div key={d._id} className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm text-gray-900 truncate">{d.title}</div>
                                  <div className="text-xs text-gray-500 truncate">{d.matterNumber || 'Case'}</div>
                                </div>
                                <div className="text-xs text-gray-500 whitespace-nowrap">
                                  {d.dueDate ? new Date(d.dueDate).toLocaleDateString() : '—'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Gavel className="h-4 w-4 text-gray-500" />
                          <div className="text-sm font-semibold text-gray-900">{t('lawyers.detailsPage.upcomingHearings')}</div>
                        </div>
                        {(data?.hearings || []).length === 0 ? (
                          <div className="text-sm text-gray-600">{t('lawyers.detailsPage.noHearings')}</div>
                        ) : (
                          <div className="space-y-2">
                            {(data?.hearings || []).slice(0, 8).map((h: any) => (
                              <div key={h._id} className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm text-gray-900 truncate">{h.courtName || 'Court'}</div>
                                  <div className="text-xs text-gray-500 truncate">{h.caseNumber || 'Case'}</div>
                                </div>
                                <div className="text-xs text-gray-500 whitespace-nowrap">
                                  {h.hearingDate ? new Date(h.hearingDate).toLocaleDateString() : '—'} {h.hearingTime || ''}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'matters' ? (
                  <div className="space-y-3">
                    {(data?.matters || []).length === 0 ? (
                      <div className="text-sm text-gray-600">{t('lawyers.detailsPage.noMatters')}</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.case')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.client')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.status')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.stage')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {(data?.matters || []).map((m: any) => (
                              <tr key={m._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <Link href={`/cases/${m._id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                                    {m.caseNumber}
                                  </Link>
                                  <div className="text-sm text-gray-700">{m.title}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {m.clientId ? (
                                    <Link href={`/clients/${m.clientId}`} className="text-blue-600 hover:text-blue-800">
                                      {m.clientName}
                                    </Link>
                                  ) : (
                                    m.clientName || '—'
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{m.status || '—'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{m.stage || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}

                {activeTab === 'clients' ? (
                  <div className="space-y-3">
                    {(data?.clients || []).length === 0 ? (
                      <div className="text-sm text-gray-600">{t('lawyers.detailsPage.noClients')}</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.client')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.email')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {(data?.clients || []).map((c: any, idx: number) => (
                              <tr key={c.clientId || `${c.clientName}-${idx}`} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {c.clientId ? (
                                    <Link href={`/clients/${c.clientId}`} className="text-blue-600 hover:text-blue-800">
                                      {c.clientName || c.clientId}
                                    </Link>
                                  ) : (
                                    c.clientName || '—'
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{c.clientEmail || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}

                {activeTab === 'appointments' ? (
                  <div className="space-y-3">
                    {(data?.appointments || []).length === 0 ? (
                      <div className="text-sm text-gray-600">{t('lawyers.detailsPage.noConsultations')}</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.when')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.client')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.type')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.status')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {(data?.appointments || []).map((a: any) => (
                              <tr key={a._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>
                                      {a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : '—'}{' '}
                                      {a.appointmentTime || ''}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {a.patientName || a.patientEmail || '—'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{a.appointmentType || '—'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{a.status || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}

                {activeTab === 'documents' ? (
                  <div className="space-y-3">
                    {(data?.documents || []).length === 0 ? (
                      <div className="text-sm text-gray-600">{t('lawyers.detailsPage.noDocuments')}</div>
                    ) : (
                      <div className="space-y-2">
                        {(data?.documents || []).map((d: any) => (
                          <div key={d._id} className="flex items-center justify-between border-b border-gray-100 py-2">
                            <div className="min-w-0">
                              <Link href={`/documents/${d._id}`} className="text-sm text-blue-600 hover:text-blue-800">
                                {d.documentNumber ? `${d.documentNumber} — ` : ''}
                                {d.title}
                              </Link>
                              <div className="text-xs text-gray-500 truncate">
                                {(d.matterNumber || d.matterId) ? `Case: ${d.matterNumber || d.matterId}` : '—'}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <div className="text-xs text-gray-500">{d.status || '—'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                {activeTab === 'deadlines' ? (
                  <div className="space-y-3">
                    {(data?.deadlines || []).length === 0 ? (
                      <div className="text-sm text-gray-600">{t('lawyers.detailsPage.noDeadlines')}</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.due')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.title')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.case')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.status')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {(data?.deadlines || []).map((d: any) => (
                              <tr key={d._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  <div className="flex items-center gap-2">
                                    <CalendarClock className="h-4 w-4 text-gray-400" />
                                    <span>{d.dueDate ? new Date(d.dueDate).toLocaleDateString() : '—'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">{d.title}</td>
                                <td className="px-4 py-3 text-sm">
                                  {d.matterId ? (
                                    <Link href={`/cases/${d.matterId}`} className="text-blue-600 hover:text-blue-800">
                                      {d.matterNumber || 'Case'}
                                    </Link>
                                  ) : (
                                    d.matterNumber || '—'
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{d.status || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}

                {activeTab === 'hearings' ? (
                  <div className="space-y-3">
                    {(data?.hearings || []).length === 0 ? (
                      <div className="text-sm text-gray-600">{t('lawyers.detailsPage.noHearings')}</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.when')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.court')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.case')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.status')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {(data?.hearings || []).map((h: any) => (
                              <tr key={h._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  <div className="flex items-center gap-2">
                                    <Gavel className="h-4 w-4 text-gray-400" />
                                    <span>
                                      {h.hearingDate ? new Date(h.hearingDate).toLocaleDateString() : '—'} {h.hearingTime || ''}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">{h.courtName || '—'}</td>
                                <td className="px-4 py-3 text-sm">
                                  {h.caseId ? (
                                    <Link href={`/cases/${h.caseId}`} className="text-blue-600 hover:text-blue-800">
                                      {h.caseNumber || 'Case'}
                                    </Link>
                                  ) : (
                                    h.caseNumber || '—'
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{h.status || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}

                {activeTab === 'invoices' ? (
                  <div className="space-y-3">
                    {(data?.invoices || []).length === 0 ? (
                      <div className="text-sm text-gray-600">{t('lawyers.detailsPage.noInvoices')}</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.invoice')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.client')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.status')}</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">{t('lawyers.detailsPage.tableHeaders.total')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {(data?.invoices || []).map((inv: any) => (
                              <tr key={inv._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <Link
                                    href={`/billing/invoices/${inv._id}`}
                                    className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-2"
                                  >
                                    <Receipt className="h-4 w-4" />
                                    {inv.invoiceNumber}
                                  </Link>
                                  {inv.matterNumber ? (
                                    <div className="text-xs text-gray-500 mt-1">Case: {inv.matterNumber}</div>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{inv.clientName || inv.patientName || '—'}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{inv.status || '—'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right">{currency(Number(inv.total) || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </SidebarLayout>
    </ProtectedRoute>
  );
}

