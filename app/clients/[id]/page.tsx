'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Briefcase,
  FileText,
  Plus,
  Receipt,
  StickyNote,
  User,
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import { useTranslations } from '../../hooks/useTranslations';

export default function ClientDetailsPage() {
  const { t } = useTranslations();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [client, setClient] = useState<any>(null);
  const [matters, setMatters] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'matters' | 'contacts' | 'documents' | 'invoices' | 'notes'
  >('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    relationship: '',
    isPrimary: false,
    notes: '',
  });
  const [savingContact, setSavingContact] = useState(false);

  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    tags: '',
  });
  const [savingNote, setSavingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<any | null>(null);
  const [editNoteForm, setEditNoteForm] = useState({ title: '', content: '', tags: '' });
  const [savingEditNote, setSavingEditNote] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [cRes, mRes, ctRes, dRes, iRes, nRes] = await Promise.all([
          fetch(`/api/clients/${id}`),
          fetch(`/api/cases?clientId=${encodeURIComponent(String(id))}`),
          fetch(`/api/contacts?clientId=${encodeURIComponent(String(id))}`),
          fetch(`/api/documents?clientId=${encodeURIComponent(String(id))}&limit=20`),
          fetch(`/api/billing/invoices?clientId=${encodeURIComponent(String(id))}`),
          fetch(`/api/notes?scope=client&clientId=${encodeURIComponent(String(id))}`),
        ]);

        const cData = await cRes.json();
        if (!cRes.ok) throw new Error(cData?.error || 'Failed to load client');
        setClient(cData);

        if (mRes.ok) setMatters(await mRes.json());
        if (ctRes.ok) {
          const ct = await ctRes.json();
          setContacts(ct.contacts || []);
        }
        if (dRes.ok) setDocuments(await dRes.json());
        if (iRes.ok) {
          const inv = await iRes.json();
          setInvoices(inv.invoices || []);
        }
        if (nRes.ok) {
          const n = await nRes.json();
          setNotes(n.notes || []);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load client');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const activeMattersCount = useMemo(() => matters.filter((m) => m.status === 'open').length, [matters]);
  const totalBilled = useMemo(() => invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0), [invoices]);
  const outstanding = useMemo(() => {
    return invoices
      .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  }, [invoices]);

  const tabs: Array<{ id: typeof activeTab; label: string; count?: number }> = [
    { id: 'overview', label: t('clients.detailsPage.tabs.overview') },
    { id: 'matters', label: t('clients.detailsPage.tabs.cases'), count: matters.length },
    { id: 'contacts', label: t('clients.detailsPage.tabs.contacts'), count: contacts.length },
    { id: 'documents', label: t('clients.detailsPage.tabs.documents'), count: documents.length },
    { id: 'invoices', label: t('clients.detailsPage.tabs.invoices'), count: invoices.length },
    { id: 'notes', label: t('clients.detailsPage.tabs.notes'), count: notes.length },
  ];

  const currency = (n: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n || 0);

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('clients.client')} description={t('clients.detailsPage.title')}>
        {loading ? (
          <div className="text-gray-600">{t('common.loading')}</div>
        ) : error ? (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
        ) : !client ? (
          <div className="text-gray-600">{t('clients.detailsPage.notFound')}</div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{client.name}</h2>
                <div className="text-sm text-gray-600">
                  {client.clientNumber} • {client.type === 'organization' ? t('clients.organization') : t('clients.individual')}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {client.email ? <span className="mr-3">{client.email}</span> : null}
                  {client.phone ? <span>{client.phone}</span> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/cases/new?clientId=${encodeURIComponent(String(client._id))}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  {t('clients.detailsPage.newCase')}
                </Link>
                <button
                  type="button"
                  onClick={() => setCreatingContact(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                  {t('clients.detailsPage.addContact')}
                </button>
                <Link
                  href={`/billing/invoices/new?clientId=${encodeURIComponent(String(client._id))}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <Receipt className="h-4 w-4" />
                  {t('clients.detailsPage.newInvoice')}
                </Link>
                <Link
                  href={`/documents/new?clientId=${encodeURIComponent(String(client._id))}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4" />
                  {t('clients.detailsPage.newDocument')}
                </Link>
                <Link
                  href={`/clients/${client._id}/edit`}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                >
                  {t('common.edit')}
                </Link>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    const msg = `${t('clients.detailsPage.deleteConfirm')} "${client.name}"?\n\n- ${matters.length} ${t('clients.detailsPage.tabs.cases').toLowerCase()}\n- ${contacts.length} ${t('clients.detailsPage.tabs.contacts').toLowerCase()}\n- ${documents.length} ${t('clients.detailsPage.tabs.documents').toLowerCase()}\n- ${invoices.length} ${t('clients.detailsPage.tabs.invoices').toLowerCase()}`;
                    if (!confirm(msg)) return;
                    setDeleting(true);
                    try {
                      const res = await fetch(`/api/clients/${client._id}`, { method: 'DELETE' });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) throw new Error(data?.error || t('clients.detailsPage.deleteFailed'));
                      window.location.href = '/clients';
                    } catch (err: any) {
                      setError(err?.message || t('clients.detailsPage.deleteFailed'));
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting ? t('common.deleting') : t('common.delete')}
                </button>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-xs text-gray-500 uppercase">{t('clients.detailsPage.activeMatters')}</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">{activeMattersCount}</div>
                <div className="text-xs text-gray-500 mt-1">{matters.length} {t('common.total')}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-xs text-gray-500 uppercase">{t('clients.detailsPage.totalBilled')}</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">{currency(totalBilled)}</div>
                <div className="text-xs text-gray-500 mt-1">{invoices.length} {t('clients.detailsPage.tabs.invoices').toLowerCase()}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-xs text-gray-500 uppercase">{t('clients.detailsPage.outstanding')}</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">{currency(outstanding)}</div>
                <div className="text-xs text-gray-500 mt-1">{t('clients.detailsPage.excludesCancelled')}</div>
              </div>
            </div>

            {/* Tabs */}
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
                        <div className="flex items-center gap-2 mb-3">
                          <User className="h-4 w-4 text-gray-500" />
                          <div className="text-sm font-semibold text-gray-900">{t('clients.detailsPage.clientProfile')}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 uppercase">{t('common.email')}</div>
                            <div className="text-sm text-gray-900 mt-1">{client.email || '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase">{t('common.phone')}</div>
                            <div className="text-sm text-gray-900 mt-1">{client.phone || '—'}</div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-xs text-gray-500 uppercase">{t('common.address')}</div>
                            <div className="text-sm text-gray-900 mt-1">{client.address || '—'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Briefcase className="h-4 w-4 text-gray-500" />
                          <div className="text-sm font-semibold text-gray-900">{t('clients.detailsPage.recentMatters')}</div>
                        </div>
                        {matters.length === 0 ? (
                          <div className="text-sm text-gray-600">{t('clients.detailsPage.noMatters')}</div>
                        ) : (
                          <div className="space-y-2">
                            {matters.slice(0, 5).map((m) => (
                              <div key={m._id} className="flex items-center justify-between">
                                <Link href={`/cases/${m._id}`} className="text-sm text-blue-600 hover:text-blue-800">
                                  {m.caseNumber} — {m.title}
                                </Link>
                                <span className="text-xs text-gray-500">{m.status}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <StickyNote className="h-4 w-4 text-gray-500" />
                            <div className="text-sm font-semibold text-gray-900">{t('clients.detailsPage.recentNotes')}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('notes')}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {t('common.viewAll')}
                          </button>
                        </div>
                        {notes.length === 0 ? (
                          <div className="text-sm text-gray-600">{t('clients.detailsPage.noNotes')}</div>
                        ) : (
                          <div className="space-y-2">
                            {notes.slice(0, 3).map((n) => (
                              <div key={n._id} className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm text-gray-900 truncate">{n.title || t('clients.detailsPage.note')}</div>
                                  <div className="text-xs text-gray-500 truncate">{String(n.content || '').slice(0, 80)}</div>
                                </div>
                                <div className="text-xs text-gray-500 whitespace-nowrap">
                                  {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <StickyNote className="h-4 w-4 text-gray-500" />
                          <div className="text-sm font-semibold text-gray-900">{t('clients.detailsPage.firmNotes')}</div>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes || '—'}</div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <StickyNote className="h-4 w-4 text-gray-500" />
                          <div className="text-sm font-semibold text-gray-900">{t('clients.detailsPage.conflictCheck')}</div>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{client.conflictCheckNotes || '—'}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'matters' ? (
                  <div className="space-y-3">
                    {matters.length === 0 ? (
                      <div className="text-sm text-gray-600">{t('clients.detailsPage.noMatters')}</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('clients.detailsPage.tableHeaders.case')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('clients.detailsPage.tableHeaders.status')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('clients.detailsPage.tableHeaders.assigned')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {matters.map((m) => (
                              <tr key={m._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <Link href={`/cases/${m._id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                                    {m.caseNumber}
                                  </Link>
                                  <div className="text-sm text-gray-700">{m.title}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{m.status}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{m.assignedLawyerName || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}

                {activeTab === 'contacts' ? (
                  <div className="space-y-3">
                    {contacts.length === 0 ? (
                      <div className="text-sm text-gray-600">{t('clients.detailsPage.noContacts')}</div>
                    ) : (
                      <div className="space-y-3">
                        {contacts.map((c) => (
                          <div key={c._id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-gray-900">
                                {c.name} {c.isPrimary ? <span className="text-xs text-green-700 ml-2">{t('clients.detailsPage.primary')}</span> : null}
                              </div>
                              <div className="text-xs text-gray-500">{c.relationship || ''}</div>
                            </div>
                            <div className="text-sm text-gray-700 mt-1">
                              {c.email ? <div>{c.email}</div> : null}
                              {c.phone ? <div>{c.phone}</div> : null}
                              {c.title ? <div className="text-xs text-gray-500 mt-1">{c.title}</div> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                {activeTab === 'documents' ? (
                  <div className="space-y-3">
                    {documents.length === 0 ? (
                      <div className="text-sm text-gray-600">{t('clients.detailsPage.noDocuments')}</div>
                    ) : (
                      <div className="space-y-2">
                        {documents.map((d) => (
                          <div key={d._id} className="flex items-center justify-between border-b border-gray-100 py-2">
                            <Link href={`/documents/${d._id}`} className="text-sm text-blue-600 hover:text-blue-800">
                              {d.documentNumber} — {d.title}
                            </Link>
                            <div className="text-xs text-gray-500">{d.status}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                {activeTab === 'invoices' ? (
                  <div className="space-y-3">
                    {invoices.length === 0 ? (
                      <div className="text-sm text-gray-600">{t('clients.detailsPage.noInvoices')}</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('clients.detailsPage.tableHeaders.invoice')}</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{t('clients.detailsPage.tableHeaders.status')}</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">{t('clients.detailsPage.tableHeaders.total')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {invoices.map((inv) => (
                              <tr key={inv._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <Link href={`/billing/invoices/${inv._id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                                    {inv.invoiceNumber}
                                  </Link>
                                  {inv.matterNumber ? (
                                    <div className="text-xs text-gray-500 mt-1">{t('clients.detailsPage.tableHeaders.case')}: {inv.matterNumber}</div>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{inv.status}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right">{currency(Number(inv.total) || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}

                {activeTab === 'notes' ? (
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <StickyNote className="h-4 w-4 text-gray-500" />
                        <div className="text-sm font-semibold text-gray-900">{t('clients.detailsPage.addNote')}</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          value={noteForm.title}
                          onChange={(e) => setNoteForm((p) => ({ ...p, title: e.target.value }))}
                          placeholder={t('clients.detailsPage.titleOptional')}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          value={noteForm.tags}
                          onChange={(e) => setNoteForm((p) => ({ ...p, tags: e.target.value }))}
                          placeholder={t('clients.detailsPage.tagsPlaceholder')}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <textarea
                        value={noteForm.content}
                        onChange={(e) => setNoteForm((p) => ({ ...p, content: e.target.value }))}
                        placeholder={t('clients.detailsPage.writeNote')}
                        rows={4}
                        className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex justify-end mt-3">
                        <button
                          type="button"
                          disabled={savingNote}
                          onClick={async () => {
                            if (!noteForm.content.trim()) return;
                            setSavingNote(true);
                            try {
                              const res = await fetch('/api/notes', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  scope: 'client',
                                  clientId: String(client._id),
                                  title: noteForm.title || undefined,
                                  content: noteForm.content,
                                  tags: noteForm.tags
                                    ? noteForm.tags
                                        .split(',')
                                        .map((tg: string) => tg.trim())
                                        .filter(Boolean)
                                    : [],
                                }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data?.error || t('clients.detailsPage.createNoteFailed'));
                              setNotes((prev) => [data.note, ...prev]);
                              setNoteForm({ title: '', content: '', tags: '' });
                            } catch (e: any) {
                              setError(e?.message || t('clients.detailsPage.createNoteFailed'));
                            } finally {
                              setSavingNote(false);
                            }
                          }}
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {savingNote ? t('common.saving') : t('clients.detailsPage.saveNote')}
                        </button>
                      </div>
                    </div>

                    {notes.length === 0 ? (
                      <div className="text-sm text-gray-600">{t('clients.detailsPage.noNotes')}</div>
                    ) : (
                      <div className="space-y-3">
                        {notes.map((n) => (
                          <div key={n._id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900">{n.title || t('clients.detailsPage.note')}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNote(n);
                                    setEditNoteForm({
                                      title: n.title || '',
                                      content: n.content || '',
                                      tags: Array.isArray(n.tags) ? n.tags.join(', ') : '',
                                    });
                                  }}
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  {t('common.edit')}
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!confirm(t('clients.detailsPage.deleteNoteConfirm'))) return;
                                    try {
                                      const res = await fetch(`/api/notes/${n._id}`, { method: 'DELETE' });
                                      const data = await res.json().catch(() => ({}));
                                      if (!res.ok) throw new Error(data?.error || t('clients.detailsPage.deleteNoteFailed'));
                                      setNotes((prev) => prev.filter((x) => x._id !== n._id));
                                    } catch (e: any) {
                                      setError(e?.message || t('clients.detailsPage.deleteNoteFailed'));
                                    }
                                  }}
                                  className="text-sm text-red-600 hover:text-red-800"
                                >
                                  {t('common.delete')}
                                </button>
                              </div>
                            </div>
                            {Array.isArray(n.tags) && n.tags.length ? (
                              <div className="mt-1 text-xs text-gray-500">{n.tags.join(', ')}</div>
                            ) : null}
                            <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{n.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Contact modal */}
            {creatingContact ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={() => setCreatingContact(false)} />
                <div className="relative w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
                  <div className="text-lg font-semibold text-gray-900 mb-4">{t('clients.detailsPage.addContact')}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={contactForm.name}
                      onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder={`${t('common.name')} *`}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      value={contactForm.title}
                      onChange={(e) => setContactForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder={t('clients.detailsPage.contactTitle')}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      value={contactForm.email}
                      onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder={t('common.email')}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      value={contactForm.phone}
                      onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder={t('common.phone')}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      value={contactForm.relationship}
                      onChange={(e) => setContactForm((p) => ({ ...p, relationship: e.target.value }))}
                      placeholder={t('clients.detailsPage.relationshipPlaceholder')}
                      className="px-3 py-2 border border-gray-300 rounded-lg md:col-span-2"
                    />
                    <textarea
                      value={contactForm.notes}
                      onChange={(e) => setContactForm((p) => ({ ...p, notes: e.target.value }))}
                      placeholder={t('common.notes')}
                      rows={3}
                      className="px-3 py-2 border border-gray-300 rounded-lg md:col-span-2"
                    />
                  </div>
                  <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={contactForm.isPrimary}
                      onChange={(e) => setContactForm((p) => ({ ...p, isPrimary: e.target.checked }))}
                    />
                    {t('clients.detailsPage.primaryContact')}
                  </label>

                  <div className="flex justify-end gap-2 mt-5">
                    <button
                      type="button"
                      onClick={() => setCreatingContact(false)}
                      className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      disabled={savingContact}
                      onClick={async () => {
                        if (!contactForm.name.trim()) return;
                        setSavingContact(true);
                        try {
                          const res = await fetch('/api/contacts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              clientId: String(client._id),
                              ...contactForm,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || t('clients.detailsPage.createContactFailed'));
                          setContacts((prev) => [data.contact, ...prev]);
                          setContactForm({
                            name: '',
                            email: '',
                            phone: '',
                            title: '',
                            relationship: '',
                            isPrimary: false,
                            notes: '',
                          });
                          setCreatingContact(false);
                        } catch (e: any) {
                          setError(e?.message || t('clients.detailsPage.createContactFailed'));
                        } finally {
                          setSavingContact(false);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingContact ? t('common.saving') : t('clients.detailsPage.saveContact')}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Edit note modal */}
            {editingNote ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={() => setEditingNote(null)} />
                <div className="relative w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
                  <div className="text-lg font-semibold text-gray-900 mb-4">{t('clients.detailsPage.editNote')}</div>
                  <div className="space-y-3">
                    <input
                      value={editNoteForm.title}
                      onChange={(e) => setEditNoteForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder={t('clients.detailsPage.titleOptional')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      value={editNoteForm.tags}
                      onChange={(e) => setEditNoteForm((p) => ({ ...p, tags: e.target.value }))}
                      placeholder={t('clients.detailsPage.tagsPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <textarea
                      value={editNoteForm.content}
                      onChange={(e) => setEditNoteForm((p) => ({ ...p, content: e.target.value }))}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={t('clients.detailsPage.content')}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-5">
                    <button
                      type="button"
                      onClick={() => setEditingNote(null)}
                      className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      disabled={savingEditNote}
                      onClick={async () => {
                        if (!editingNote?._id) return;
                        if (!editNoteForm.content.trim()) return;
                        setSavingEditNote(true);
                        try {
                          const res = await fetch(`/api/notes/${editingNote._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              title: editNoteForm.title || undefined,
                              content: editNoteForm.content,
                              tags: editNoteForm.tags
                                ? editNoteForm.tags
                                    .split(',')
                                    .map((tg: string) => tg.trim())
                                    .filter(Boolean)
                                : [],
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || t('clients.detailsPage.updateNoteFailed'));
                          setNotes((prev) => prev.map((x) => (x._id === data.note._id ? data.note : x)));
                          setEditingNote(null);
                        } catch (e: any) {
                          setError(e?.message || t('clients.detailsPage.updateNoteFailed'));
                        } finally {
                          setSavingEditNote(false);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingEditNote ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </SidebarLayout>
    </ProtectedRoute>
  );
}

