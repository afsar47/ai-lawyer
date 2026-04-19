'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Briefcase, CalendarClock, ClipboardList, Edit, FileText, Plus, Trash2, Gavel, Receipt, ShieldAlert, StickyNote, Activity, User } from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';

type CaseDoc = {
  _id: string;
  caseNumber: string;
  title: string;
  description?: string;
  status: 'lead' | 'open' | 'closed';
  stage?: 'intake' | 'active' | 'litigation' | 'settlement' | 'closed';
  priority: 'low' | 'medium' | 'high';
  practiceArea?: string;
  jurisdiction?: string;
  courtName?: string;
  docketNumber?: string;
  opposingCounsel?: string;
  opposingParties?: string[];
  conflictCheckStatus?: 'pending' | 'cleared' | 'conflict';
  conflictCheckDate?: string;
  conflictCheckNotes?: string;
  openedAt?: string;
  closedAt?: string;
  closedReason?: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  assignedLawyerName?: string;
  assignedLawyerEmail?: string;
  createdAt: string;
  updatedAt: string;
};

type TabId = 'overview' | 'documents' | 'tasks' | 'deadlines' | 'hearings' | 'notes' | 'activity';

export default function CaseViewPage() {
  const params = useParams();
  const router = useRouter();
  const [caseDoc, setCaseDoc] = useState<CaseDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [documents, setDocuments] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [hearings, setHearings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', tags: '' });
  const [savingNote, setSavingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<any | null>(null);
  const [editNoteForm, setEditNoteForm] = useState({ title: '', content: '', tags: '' });
  const [savingEditNote, setSavingEditNote] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/cases/${params.id}`);
        if (res.ok) {
          setCaseDoc(await res.json());
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  useEffect(() => {
    const loadLinked = async () => {
      if (!caseDoc?._id) return;
      try {
        const [docsRes, deadlinesRes, tasksRes, hearingsRes, invRes] = await Promise.all([
          fetch(`/api/documents?matterId=${encodeURIComponent(caseDoc._id)}&limit=50`),
          fetch(`/api/deadlines?matterId=${encodeURIComponent(caseDoc._id)}&limit=50`),
          fetch(`/api/tasks?matterId=${encodeURIComponent(caseDoc._id)}&limit=50`),
          fetch(`/api/hearings?caseId=${encodeURIComponent(caseDoc._id)}&limit=50`),
          fetch(`/api/billing/invoices?matterId=${encodeURIComponent(caseDoc._id)}`),
        ]);
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDocuments(docsData.documents || docsData || []);
        }
        if (deadlinesRes.ok) setDeadlines(await deadlinesRes.json());
        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (hearingsRes.ok) setHearings(await hearingsRes.json());
        if (invRes.ok) {
          const data = await invRes.json();
          setInvoices(data.invoices || []);
        }
      } catch {
        // ignore
      }
    };
    loadLinked();
  }, [caseDoc?._id]);

  useEffect(() => {
    const loadActivity = async () => {
      if (!caseDoc?._id) return;
      try {
        const res = await fetch(`/api/cases/${encodeURIComponent(caseDoc._id)}/activity`);
        if (res.ok) {
          const data = await res.json();
          setActivity(data.events || []);
        }
      } catch {
        // ignore
      }
    };
    loadActivity();
  }, [caseDoc?._id]);

  useEffect(() => {
    const loadNotes = async () => {
      if (!caseDoc?._id) return;
      try {
        const res = await fetch(`/api/notes?scope=matter&caseId=${encodeURIComponent(caseDoc._id)}`);
        if (res.ok) {
          const data = await res.json();
          setNotes(data.notes || []);
        }
      } catch {
        // ignore
      }
    };
    loadNotes();
  }, [caseDoc?._id]);

  const currency = (n: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n || 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const outstanding = invoices
    .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

  const tabs: Array<{ id: TabId; label: string; icon: any; count?: number }> = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList, count: tasks.length },
    { id: 'deadlines', label: 'Deadlines', icon: CalendarClock, count: deadlines.length },
    { id: 'hearings', label: 'Hearings', icon: Gavel, count: hearings.length },
    { id: 'notes', label: 'Notes', icon: StickyNote, count: notes.length },
    { id: 'activity', label: 'Activity', icon: Activity, count: activity.length },
  ];

  const onDelete = async () => {
    if (!caseDoc) return;
    if (!confirm(`Delete ${caseDoc.caseNumber}? This cannot be undone.`)) return;
    const res = await fetch(`/api/cases/${caseDoc._id}`, { method: 'DELETE' });
    if (res.ok) router.push('/cases');
    else alert('Failed to delete case');
  };

  const statusBadge = (status: string) => {
    const base = 'px-2.5 py-1 rounded-full text-xs font-medium';
    if (status === 'open') return `${base} bg-green-100 text-green-800`;
    if (status === 'lead') return `${base} bg-yellow-100 text-yellow-800`;
    return `${base} bg-gray-100 text-gray-800`;
  };

  const priorityBadge = (priority: string) => {
    const base = 'px-2.5 py-1 rounded-full text-xs font-medium';
    if (priority === 'high') return `${base} bg-red-100 text-red-800`;
    if (priority === 'medium') return `${base} bg-orange-100 text-orange-800`;
    return `${base} bg-blue-100 text-blue-800`;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout title="Case" description="Loading case...">
          <div className="py-10 text-center text-gray-600">Loading...</div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  if (!caseDoc) {
    return (
      <ProtectedRoute>
        <SidebarLayout title="Case not found" description="This case does not exist or you don't have access.">
          <div className="py-10 text-center text-gray-600">
            <Link href="/cases" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Link>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout title={caseDoc.caseNumber} description={caseDoc.title}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/cases" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{caseDoc.caseNumber}</h1>
                  <p className="text-sm text-gray-600">{caseDoc.title}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={statusBadge(caseDoc.status)}>{caseDoc.status}</span>
              <span className={priorityBadge(caseDoc.priority)}>{caseDoc.priority}</span>
              <Link
                href={`/cases/${caseDoc._id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Link>
              <button
                onClick={onDelete}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm font-medium"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-1 overflow-x-auto pb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500">Documents</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{documents.length}</div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500">Open Tasks</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{tasks.filter(t => t.status !== 'completed').length}</div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500">Upcoming Deadlines</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{deadlines.filter(d => d.status !== 'completed').length}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Case Details */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 uppercase">Practice Area</div>
                          <div className="text-sm text-gray-900 mt-1">{caseDoc.practiceArea || '—'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase">Stage</div>
                          <div className="text-sm text-gray-900 mt-1 capitalize">{caseDoc.stage || 'active'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase">Created</div>
                          <div className="text-sm text-gray-900 mt-1">{new Date(caseDoc.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase">Updated</div>
                          <div className="text-sm text-gray-900 mt-1">{new Date(caseDoc.updatedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      {caseDoc.description && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase">Description</div>
                          <div className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{caseDoc.description}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Client & Lawyer */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">People</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-700" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 uppercase">Client</div>
                          <div className="text-sm font-medium text-gray-900">{caseDoc.clientName}</div>
                          <div className="text-sm text-gray-600">{caseDoc.clientEmail || '—'}</div>
                          <Link href={`/clients/${caseDoc.clientId}`} className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block">
                            View profile →
                          </Link>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-700" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 uppercase">Assigned Lawyer</div>
                          <div className="text-sm font-medium text-gray-900">{caseDoc.assignedLawyerName || '—'}</div>
                          <div className="text-sm text-gray-600">{caseDoc.assignedLawyerEmail || ''}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Court & Jurisdiction */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Gavel className="h-5 w-5 text-blue-700" />
                      <h3 className="text-lg font-semibold text-gray-900">Court & Jurisdiction</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Jurisdiction</div>
                        <div className="text-sm text-gray-900 mt-1">{caseDoc.jurisdiction || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Court</div>
                        <div className="text-sm text-gray-900 mt-1">{caseDoc.courtName || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Docket Number</div>
                        <div className="text-sm text-gray-900 mt-1">{caseDoc.docketNumber || '—'}</div>
                      </div>
                      {caseDoc.opposingCounsel && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase">Opposing Counsel</div>
                          <div className="text-sm text-gray-900 mt-1">{caseDoc.opposingCounsel}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Snapshot */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Receipt className="h-5 w-5 text-blue-700" />
                      <h3 className="text-lg font-semibold text-gray-900">Financial</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Invoiced</span>
                        <span className="text-sm font-semibold text-gray-900">{currency(totalInvoiced)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Outstanding</span>
                        <span className="text-sm font-semibold text-orange-600">{currency(outstanding)}</span>
                      </div>
                      <div className="pt-3 border-t border-gray-100">
                        <Link
                          href={`/billing/invoices/new?matterId=${encodeURIComponent(caseDoc._id)}&clientId=${encodeURIComponent(caseDoc.clientId)}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Create invoice →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Conflict Check */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldAlert className="h-5 w-5 text-blue-700" />
                      <h3 className="text-lg font-semibold text-gray-900">Conflict Check</h3>
                    </div>
                    <div className="flex items-start gap-6">
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Status</div>
                        <div className={`mt-1 inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          caseDoc.conflictCheckStatus === 'cleared' ? 'bg-green-100 text-green-800' :
                          caseDoc.conflictCheckStatus === 'conflict' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {caseDoc.conflictCheckStatus || 'pending'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Date Checked</div>
                        <div className="text-sm text-gray-900 mt-1">
                          {caseDoc.conflictCheckDate ? new Date(caseDoc.conflictCheckDate).toLocaleDateString() : 'Not yet checked'}
                        </div>
                      </div>
                      {caseDoc.conflictCheckNotes && (
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 uppercase">Notes</div>
                          <div className="text-sm text-gray-900 mt-1">{caseDoc.conflictCheckNotes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Documents</h3>
                  <Link
                    href={`/documents/new?matterId=${encodeURIComponent(caseDoc._id)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add Document
                  </Link>
                </div>
                {documents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No documents linked to this case yet.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {documents.map((d: any) => (
                      <Link key={d._id} href={`/documents/${d._id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{d.title}</div>
                            <div className="text-sm text-gray-500">{d.documentNumber} • {d.type}</div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${d.status === 'final' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {d.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Tasks</h3>
                  <Link
                    href={`/tasks/new?matterId=${encodeURIComponent(caseDoc._id)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Link>
                </div>
                {tasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No tasks linked to this case yet.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {tasks.map((t: any) => (
                      <Link key={t._id} href={`/tasks/${t._id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{t.title}</div>
                            <div className="text-sm text-gray-500">
                              {t.priority} priority {t.dueDate ? `• Due ${new Date(t.dueDate).toLocaleDateString()}` : ''}
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.status === 'completed' ? 'bg-green-100 text-green-800' : t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {t.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Deadlines Tab */}
            {activeTab === 'deadlines' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Deadlines</h3>
                  <Link
                    href={`/deadlines/new?matterId=${encodeURIComponent(caseDoc._id)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add Deadline
                  </Link>
                </div>
                {deadlines.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No deadlines linked to this case yet.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {deadlines.map((dl: any) => (
                      <Link key={dl._id} href={`/deadlines/${dl._id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{dl.title}</div>
                            <div className="text-sm text-gray-500">Due {new Date(dl.dueDate).toLocaleDateString()} • {dl.type}</div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${dl.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {dl.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Hearings Tab */}
            {activeTab === 'hearings' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Hearings</h3>
                  <Link
                    href={`/hearings/new?caseId=${encodeURIComponent(caseDoc._id)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add Hearing
                  </Link>
                </div>
                {hearings.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No hearings linked to this case yet.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {hearings.map((h: any) => (
                      <Link key={h._id} href={`/hearings/${h._id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{h.hearingType?.replace('_', ' ')} - {h.courtName}</div>
                            <div className="text-sm text-gray-500">{new Date(h.hearingDate).toLocaleDateString()} at {h.hearingTime}</div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${h.status === 'completed' ? 'bg-green-100 text-green-800' : h.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {h.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Add Note</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={noteForm.title}
                      onChange={(e) => setNoteForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Title (optional)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      value={noteForm.tags}
                      onChange={(e) => setNoteForm((p) => ({ ...p, tags: e.target.value }))}
                      placeholder="Tags (comma-separated)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <textarea
                    value={noteForm.content}
                    onChange={(e) => setNoteForm((p) => ({ ...p, content: e.target.value }))}
                    placeholder="Write a note…"
                    rows={4}
                    className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      disabled={savingNote}
                      onClick={async () => {
                        if (!caseDoc?._id) return;
                        if (!noteForm.content.trim()) return;
                        setSavingNote(true);
                        try {
                          const res = await fetch('/api/notes', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              scope: 'matter',
                              caseId: String(caseDoc._id),
                              title: noteForm.title || undefined,
                              content: noteForm.content,
                              tags: noteForm.tags ? noteForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || 'Failed to create note');
                          setNotes((prev) => [data.note, ...prev]);
                          setNoteForm({ title: '', content: '', tags: '' });
                        } catch {
                          // ignore
                        } finally {
                          setSavingNote(false);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                      {savingNote ? 'Saving…' : 'Save Note'}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notes ({notes.length})</h3>
                  </div>
                  {notes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No notes yet.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notes.map((n) => (
                        <div key={n._id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{n.title || 'Note'}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                              {Array.isArray(n.tags) && n.tags.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {n.tags.map((tag: string, idx: number) => (
                                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tag}</span>
                                  ))}
                                </div>
                              )}
                              <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{n.content}</div>
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
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm('Delete this note?')) return;
                                  try {
                                    const res = await fetch(`/api/notes/${n._id}`, { method: 'DELETE' });
                                    if (res.ok) setNotes((prev) => prev.filter((x) => x._id !== n._id));
                                  } catch {
                                    // ignore
                                  }
                                }}
                                className="text-sm text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Activity Timeline</h3>
                </div>
                {activity.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No recent activity.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {activity.map((e: any, idx: number) => (
                      <div key={`${e.kind}-${e.at}-${idx}`} className="p-4 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {e.href ? (
                            <Link href={e.href} className="font-medium text-blue-600 hover:text-blue-800">
                              {e.title}
                            </Link>
                          ) : (
                            <div className="font-medium text-gray-900">{e.title}</div>
                          )}
                          {e.detail && <div className="text-sm text-gray-500 mt-0.5">{e.detail}</div>}
                          {e.actorEmail && <div className="text-xs text-gray-400 mt-0.5">By {e.actorEmail}</div>}
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {e.at ? new Date(e.at).toLocaleString() : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edit Note Modal */}
          {editingNote && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setEditingNote(null)} />
              <div className="relative w-full max-w-lg bg-white rounded-xl shadow-lg p-6">
                <div className="text-lg font-semibold text-gray-900 mb-4">Edit Note</div>
                <div className="space-y-3">
                  <input
                    value={editNoteForm.title}
                    onChange={(e) => setEditNoteForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Title (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    value={editNoteForm.tags}
                    onChange={(e) => setEditNoteForm((p) => ({ ...p, tags: e.target.value }))}
                    placeholder="Tags (comma-separated)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <textarea
                    value={editNoteForm.content}
                    onChange={(e) => setEditNoteForm((p) => ({ ...p, content: e.target.value }))}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Content"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setEditingNote(null)}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium"
                  >
                    Cancel
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
                            tags: editNoteForm.tags ? editNoteForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
                          }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setNotes((prev) => prev.map((x) => (x._id === data.note._id ? data.note : x)));
                          setEditingNote(null);
                        }
                      } finally {
                        setSavingEditNote(false);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {savingEditNote ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
