'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Briefcase, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';

type Client = { _id: string; name: string; email?: string; clientNumber?: string };
type Lawyer = { _id: string; name: string; email: string; practiceAreas?: string[]; specialization?: string };

function NewCaseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('clientId') || '';
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [clients, setClients] = useState<Client[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: '',
    practiceArea: '',
    status: 'open',
    stage: 'active',
    priority: 'medium',
    clientId: preselectedClientId,
    assignedLawyerEmail: '',
    assignedLawyerName: '',
    description: '',
    jurisdiction: '',
    courtName: '',
    docketNumber: '',
    conflictCheckStatus: 'pending',
  });

  useEffect(() => {
    if (preselectedClientId) {
      setForm((p) => ({ ...p, clientId: preselectedClientId }));
    }
    const load = async () => {
      try {
        const [clientsRes, lawyersRes] = await Promise.all([
          fetch('/api/clients'),
          isAdmin ? fetch('/api/lawyers') : Promise.resolve(null),
        ]);

        if (clientsRes.ok) {
          const c = await clientsRes.json();
          setClients(c);
        }

        if (lawyersRes && lawyersRes.ok) {
          const l = await lawyersRes.json();
          setLawyers(l);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin, preselectedClientId]);

  const canSelectLawyer = isAdmin && lawyers.length > 0;
  const visibleLawyers = useMemo(() => {
    if (!canSelectLawyer) return [];
    const pa = form.practiceArea.trim().toLowerCase();
    if (!pa) return lawyers;
    return lawyers.filter((l) => {
      const areas = Array.isArray(l.practiceAreas) ? l.practiceAreas : [];
      return (
        areas.some((a) => String(a).toLowerCase().includes(pa)) ||
        String(l.specialization || '').toLowerCase().includes(pa)
      );
    });
  }, [canSelectLawyer, lawyers, form.practiceArea]);

  const selectedLawyer = useMemo(() => {
    if (!canSelectLawyer) return null;
    return lawyers.find((l) => l.email === form.assignedLawyerEmail) || null;
  }, [canSelectLawyer, lawyers, form.assignedLawyerEmail]);

  useEffect(() => {
    if (selectedLawyer) {
      setForm((prev) => ({
        ...prev,
        assignedLawyerName: selectedLawyer.name,
      }));
    }
  }, [selectedLawyer]);

  const onChange = (name: string, value: string) => setForm((p) => ({ ...p, [name]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.clientId) {
      alert('Title and Client are required');
      return;
    }

    const payload: any = {
      title: form.title,
      practiceArea: form.practiceArea,
      status: form.status,
      stage: form.stage,
      priority: form.priority,
      clientId: form.clientId,
      description: form.description,
      jurisdiction: form.jurisdiction,
      courtName: form.courtName,
      docketNumber: form.docketNumber,
      conflictCheckStatus: form.conflictCheckStatus,
    };

    if (canSelectLawyer) {
      payload.assignedLawyerEmail = form.assignedLawyerEmail;
      payload.assignedLawyerName = form.assignedLawyerName;
    }

    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Failed to create case');
      return;
    }

    const created = await res.json();
    router.push(`/cases/${created._id}`);
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title="New Case" description="Create a new legal case (matter)">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link href="/cases" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Case Details</h2>
                <p className="text-sm text-gray-600">Fill out the information below.</p>
              </div>
            </div>

            {loading ? (
              <div className="py-10 text-center text-gray-600">Loading...</div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => onChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., NDA for Vendor Contract"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                    <select
                      value={form.clientId}
                      onChange={(e) => onChange('clientId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select client</option>
                      {clients.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                          {c.clientNumber ? ` (${c.clientNumber})` : ''}
                          {c.email ? ` — ${c.email}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Practice Area</label>
                    <input
                      value={form.practiceArea}
                      onChange={(e) => onChange('practiceArea', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Corporate, Family, Criminal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Lawyer</label>
                    {canSelectLawyer ? (
                      <select
                        value={form.assignedLawyerEmail}
                        onChange={(e) => onChange('assignedLawyerEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select lawyer</option>
                        {visibleLawyers.map((l) => (
                          <option key={l._id} value={l.email}>
                            {l.name} ({l.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={session?.user?.name || '—'}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                    <input
                      value={form.jurisdiction}
                      onChange={(e) => onChange('jurisdiction', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., California, USA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
                    <input
                      value={form.courtName}
                      onChange={(e) => onChange('courtName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Superior Court"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Docket / Case No.</label>
                    <input
                      value={form.docketNumber}
                      onChange={(e) => onChange('docketNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conflict check status</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => onChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional notes about the case..."
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Create Case</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

export default function NewCasePage() {
  return (
    <Suspense fallback={<div className="text-gray-600">Loading...</div>}>
      <NewCaseForm />
    </Suspense>
  );
}

