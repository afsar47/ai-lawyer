'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Layout,
  Upload,
  Tag,
  Lock,
  Users,
  Folder,
  ChevronRight,
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import CaseSearchSelect, { CaseOption } from '../../components/CaseSearchSelect';

type ClientRow = { _id: string; clientNumber: string; name: string };
type FolderRow = { _id: string; name: string; path: string };
type TemplateRow = {
  _id: string;
  title: string;
  description?: string;
  type: string;
  templateCategory?: string;
  content?: string;
  tags?: string[];
};

const DOCUMENT_TYPES = [
  { value: 'other', label: 'Other' },
  { value: 'engagement', label: 'Engagement Letter' },
  { value: 'pleading', label: 'Pleading' },
  { value: 'contract', label: 'Contract' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'case_note', label: 'Case Note' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'court_filing', label: 'Court Filing' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'memo', label: 'Memo' },
];

function NewDocumentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedMatterId = searchParams.get('matterId') || '';
  const preselectedClientId = searchParams.get('clientId') || '';
  const preselectedTemplateId = searchParams.get('templateId') || '';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [step, setStep] = useState<'choose' | 'form'>(preselectedTemplateId ? 'form' : 'choose');
  const [selectedMatter, setSelectedMatter] = useState<CaseOption | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'other',
    status: 'draft',
    matterId: preselectedMatterId,
    clientId: preselectedClientId,
    folderId: '',
    tags: '',
    sharedWithClient: false,
    isConfidential: false,
    content: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, fRes, tRes] = await Promise.all([
          fetch('/api/clients?limit=200'),
          fetch('/api/documents/folders'),
          fetch('/api/documents/templates'),
        ]);
        if (cRes.ok) setClients(await cRes.json());
        if (fRes.ok) setFolders(await fRes.json());
        if (tRes.ok) setTemplates(await tRes.json());

        if (preselectedTemplateId) {
          const templateRes = await fetch(`/api/documents/${preselectedTemplateId}`);
          if (templateRes.ok) {
            const template = await templateRes.json();
            setForm((p) => ({
              ...p,
              title: `${template.title} (Copy)`,
              description: template.description || '',
              type: template.type === 'template' ? 'other' : template.type,
              content: template.content || '',
              tags: template.tags?.join(', ') || '',
            }));
          }
        }
      } finally {
        setLoadingRefs(false);
      }
    };
    load();
  }, [preselectedTemplateId]);

  useEffect(() => {
    if (preselectedMatterId) {
      setForm((p) => ({ ...p, matterId: preselectedMatterId }));
    }
    if (preselectedClientId && !preselectedMatterId) {
      setForm((p) => ({ ...p, clientId: preselectedClientId }));
    }
  }, [preselectedMatterId, preselectedClientId]);

  const handleCaseChange = (id: string, caseData: CaseOption | null) => {
    setForm((p) => ({ ...p, matterId: id }));
    setSelectedMatter(caseData);
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((p) => ({ ...p, [name]: checked }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const selectTemplate = async (template: TemplateRow) => {
    setForm((p) => ({
      ...p,
      title: `${template.title} (Copy)`,
      description: template.description || '',
      type: template.type === 'template' ? 'other' : template.type,
      content: template.content || '',
      tags: template.tags?.join(', ') || '',
    }));
    setStep('form');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        type: form.type,
        status: form.status,
        sharedWithClient: form.sharedWithClient,
        isConfidential: form.isConfidential,
        content: form.content,
        folderId: form.folderId || undefined,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (form.matterId) payload.matterId = form.matterId;
      if (!form.matterId && form.clientId) payload.clientId = form.clientId;

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create document');
      router.push(`/documents/${data._id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create document');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout
        title="New Document"
        description="Create a document from scratch or use a template"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/documents"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Link>
            {step === 'form' && !preselectedTemplateId && (
              <button
                onClick={() => setStep('choose')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Change creation method
              </button>
            )}
          </div>

          {/* Step 1: Choose Creation Method */}
          {step === 'choose' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">How would you like to create your document?</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setStep('form')}
                  className="flex flex-col items-center p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Blank Document</h3>
                  <p className="text-sm text-gray-500 text-center">Start with a blank document</p>
                </button>

                <Link
                  href="/documents/upload"
                  className="flex flex-col items-center p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                    <Upload className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Upload File</h3>
                  <p className="text-sm text-gray-500 text-center">Upload an existing file</p>
                </Link>

                <Link
                  href="/documents/templates"
                  className="flex flex-col items-center p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
                >
                  <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                    <Layout className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Use Template</h3>
                  <p className="text-sm text-gray-500 text-center">Start from a template</p>
                </Link>
              </div>

              {/* Quick Templates */}
              {templates.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Quick Start Templates</h3>
                    <Link
                      href="/documents/templates"
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      View all →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templates.slice(0, 6).map((template) => (
                      <button
                        key={template._id}
                        onClick={() => selectTemplate(template)}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
                      >
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Layout className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {template.title}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {template.templateCategory || 'general'}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Document Form */}
          {step === 'form' && (
            <>
              {error && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                {/* Title & Description */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={onChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                      placeholder="Document title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      name="description"
                      value={form.description}
                      onChange={onChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief description (optional)"
                    />
                  </div>
                </div>

                {/* Type, Status, Folder */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="review">In Review</option>
                      <option value="approved">Approved</option>
                      <option value="final">Final</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
                    <select
                      name="folderId"
                      value={form.folderId}
                      onChange={onChange}
                      disabled={loadingRefs}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    >
                      <option value="">— Root —</option>
                      {folders.map((f) => (
                        <option key={f._id} value={f._id}>
                          {f.path}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Case & Client */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <CaseSearchSelect
                      label="Case (optional)"
                      value={form.matterId}
                      onChange={handleCaseChange}
                      placeholder="Search and select a case..."
                    />
                    {selectedMatter && (
                      <p className="text-xs text-gray-500 mt-1">
                        Client will be set from case: {selectedMatter.clientName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client (optional)
                    </label>
                    <select
                      name="clientId"
                      value={form.clientId}
                      onChange={onChange}
                      disabled={loadingRefs || Boolean(form.matterId)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    >
                      <option value="">— Select client —</option>
                      {clients.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.clientNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      name="tags"
                      value={form.tags}
                      onChange={onChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="urgent, important, review (comma separated)"
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="flex flex-wrap gap-6 py-4 border-t border-b border-gray-200">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      name="isConfidential"
                      type="checkbox"
                      checked={form.isConfidential}
                      onChange={onChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="flex items-center space-x-2 text-sm text-gray-700">
                      <Lock className="h-4 w-4 text-amber-500" />
                      <span>Mark as confidential</span>
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      name="sharedWithClient"
                      type="checkbox"
                      checked={form.sharedWithClient}
                      onChange={onChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="flex items-center space-x-2 text-sm text-gray-700">
                      <Users className="h-4 w-4 text-green-500" />
                      <span>Share with client</span>
                    </span>
                  </label>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    name="content"
                    value={form.content}
                    onChange={onChange}
                    rows={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="Write or paste the document content here..."
                  />
                </div>

                {/* Submit */}
                <div className="flex items-center justify-between pt-4">
                  <Link
                    href="/documents"
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Creating...' : 'Create Document'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

export default function NewDocumentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <NewDocumentForm />
    </Suspense>
  );
}
