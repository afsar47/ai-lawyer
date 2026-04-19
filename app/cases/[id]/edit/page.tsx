'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../protected-route';
import SidebarLayout from '../../../components/sidebar-layout';

type CaseDoc = {
  _id: string;
  caseNumber: string;
  title: string;
  description?: string;
  status: 'lead' | 'open' | 'closed';
  stage?: 'intake' | 'active' | 'litigation' | 'settlement' | 'closed';
  priority: 'low' | 'medium' | 'high';
  practiceArea?: string;
  assignedLawyerEmail?: string;
  assignedLawyerName?: string;
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
};

export default function EditCasePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const [caseDoc, setCaseDoc] = useState<CaseDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lawyers, setLawyers] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '',
    practiceArea: '',
    status: 'open',
    stage: 'active',
    priority: 'medium',
    description: '',
    assignedLawyerEmail: '',
    assignedLawyerName: '',
    jurisdiction: '',
    courtName: '',
    docketNumber: '',
    opposingCounsel: '',
    opposingParties: '',
    conflictCheckStatus: 'pending',
    conflictCheckDate: '',
    conflictCheckNotes: '',
    closedReason: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/cases/${params.id}`);
        if (res.ok) {
          const data: CaseDoc = await res.json();
          setCaseDoc(data);
          setForm({
            title: data.title || '',
            practiceArea: data.practiceArea || '',
            status: data.status || 'open',
            stage: (data.stage as any) || (data.status === 'lead' ? 'intake' : data.status === 'closed' ? 'closed' : 'active'),
            priority: data.priority || 'medium',
            description: data.description || '',
            assignedLawyerEmail: data.assignedLawyerEmail || '',
            assignedLawyerName: data.assignedLawyerName || '',
            jurisdiction: data.jurisdiction || '',
            courtName: data.courtName || '',
            docketNumber: data.docketNumber || '',
            opposingCounsel: data.opposingCounsel || '',
            opposingParties: Array.isArray(data.opposingParties) ? data.opposingParties.join('\n') : '',
            conflictCheckStatus: (data.conflictCheckStatus as any) || 'pending',
            conflictCheckDate: data.conflictCheckDate ? String(data.conflictCheckDate).slice(0, 10) : '',
            conflictCheckNotes: data.conflictCheckNotes || '',
            closedReason: data.closedReason || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  useEffect(() => {
    const loadLawyers = async () => {
      if (!isAdmin) return;
      try {
        const res = await fetch('/api/lawyers');
        if (res.ok) {
          const data = await res.json();
          setLawyers(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore
      }
    };
    loadLawyers();
  }, [isAdmin]);

  const visibleLawyers = (() => {
    if (!isAdmin) return [];
    const pa = String(form.practiceArea || '').trim().toLowerCase();
    if (!pa) return lawyers;
    return lawyers.filter((l: any) => {
      const areas = Array.isArray(l.practiceAreas) ? l.practiceAreas : [];
      return (
        areas.some((a: any) => String(a).toLowerCase().includes(pa)) ||
        String(l.specialization || '').toLowerCase().includes(pa)
      );
    });
  })();

  const onChange = (name: string, value: string) => setForm((p) => ({ ...p, [name]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseDoc) return;
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        opposingParties: form.opposingParties
          ? form.opposingParties
              .split('\n')
              .map((p: string) => p.trim())
              .filter(Boolean)
          : [],
        conflictCheckDate: form.conflictCheckDate || null,
      };
      if (!isAdmin) {
        delete payload.assignedLawyerEmail;
        delete payload.assignedLawyerName;
      }

      const res = await fetch(`/api/cases/${caseDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to update case');
        return;
      }
      router.push(`/cases/${caseDoc._id}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout title="Edit Case" description="Loading...">
          <div className="py-10 text-center text-gray-600">Loading...</div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  if (!caseDoc) {
    return (
      <ProtectedRoute>
        <SidebarLayout title="Case not found" description="This case does not exist or you don’t have access.">
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
      <SidebarLayout title={`Edit ${caseDoc.caseNumber}`} description="Update case details">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link href={`/cases/${caseDoc._id}`} className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Case
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => onChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Practice Area</label>
                  <input
                    value={form.practiceArea}
                    onChange={(e) => onChange('practiceArea', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => onChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="lead">Lead</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => onChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              {isAdmin ? (
                <div className="border-t border-gray-200 pt-5">
                  <div className="text-sm font-semibold text-gray-900 mb-3">Assignment</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned lawyer</label>
                      <select
                        value={form.assignedLawyerEmail}
                        onChange={(e) => {
                          const email = e.target.value;
                          const selected = lawyers.find((l: any) => l.email === email) || null;
                          setForm((p) => ({
                            ...p,
                            assignedLawyerEmail: email,
                            assignedLawyerName: selected?.name || p.assignedLawyerName,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select lawyer</option>
                        {visibleLawyers.map((l: any) => (
                          <option key={l._id} value={l.email}>
                            {l.name} ({l.email})
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-gray-500 mt-1">Filtered by practice area when possible.</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned lawyer name</label>
                      <input
                        value={form.assignedLawyerName}
                        onChange={(e) => onChange('assignedLawyerName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <select
                    value={form.stage}
                    onChange={(e) => onChange('stage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="intake">Intake</option>
                    <option value="active">Active</option>
                    <option value="litigation">Litigation</option>
                    <option value="settlement">Settlement</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                  <input
                    value={form.jurisdiction}
                    onChange={(e) => onChange('jurisdiction', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., California, USA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
                  <input
                    value={form.courtName}
                    onChange={(e) => onChange('courtName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Superior Court of ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Docket / Case No.</label>
                  <input
                    value={form.docketNumber}
                    onChange={(e) => onChange('docketNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 24-CV-12345"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opposing counsel</label>
                  <input
                    value={form.opposingCounsel}
                    onChange={(e) => onChange('opposingCounsel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opposing parties</label>
                  <textarea
                    value={form.opposingParties}
                    onChange={(e) => onChange('opposingParties', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="One per line"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-5">
                <div className="text-sm font-semibold text-gray-900 mb-3">Conflict check</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={form.conflictCheckStatus}
                      onChange={(e) => onChange('conflictCheckStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="cleared">Cleared</option>
                      <option value="conflict">Conflict</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Checked on</label>
                    <input
                      type="date"
                      value={form.conflictCheckDate}
                      onChange={(e) => onChange('conflictCheckDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Closed reason</label>
                    <input
                      value={form.closedReason}
                      onChange={(e) => onChange('closedReason', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(If closed)"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={form.conflictCheckNotes}
                    onChange={(e) => onChange('conflictCheckNotes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => onChange('description', e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

