'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Layout,
  ArrowLeft,
  Copy,
  Edit,
  Trash2,
  MoreVertical,
  FileCheck,
  FileWarning,
  FileBox,
  Briefcase,
  Scale,
  Mail,
  FileSearch,
  FilePen,
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import { useTranslations } from '../../hooks/useTranslations';

type TemplateRow = {
  _id: string;
  documentNumber: string;
  title: string;
  description?: string;
  type: string;
  templateCategory?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

const TEMPLATE_CATEGORIES = [
  { value: '', label: 'All Categories', icon: Layout },
  { value: 'contracts', label: 'Contracts', icon: Briefcase },
  { value: 'litigation', label: 'Litigation', icon: Scale },
  { value: 'correspondence', label: 'Correspondence', icon: Mail },
  { value: 'discovery', label: 'Discovery', icon: FileSearch },
  { value: 'corporate', label: 'Corporate', icon: FileBox },
  { value: 'general', label: 'General', icon: FileText },
];

function getCategoryIcon(category?: string) {
  const cat = TEMPLATE_CATEGORIES.find((c) => c.value === category);
  const Icon = cat?.icon || FileText;
  return <Icon className="h-6 w-6" />;
}

export default function DocumentTemplatesPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  const [newTemplate, setNewTemplate] = useState({
    title: '',
    description: '',
    type: 'template',
    templateCategory: 'general',
    content: '',
    tags: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      const res = await fetch(`/api/documents/templates?${params.toString()}`);
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory]);

  const filtered = templates.filter((t) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.includes(q))
    );
  });

  const createTemplate = async () => {
    if (!newTemplate.title.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/documents/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTemplate,
          tags: newTemplate.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowNewModal(false);
        setNewTemplate({
          title: '',
          description: '',
          type: 'template',
          templateCategory: 'general',
          content: '',
          tags: '',
        });
        loadTemplates();
        router.push(`/documents/${data._id}/edit`);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to create template');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setCreating(false);
    }
  };

  const useTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/documents/${templateId}`);
      if (!res.ok) throw new Error('Failed to load template');
      const template = await res.json();

      const createRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${template.title} (Copy)`,
          description: template.description,
          type: template.type === 'template' ? 'other' : template.type,
          content: template.content,
          tags: template.tags,
          isTemplate: false,
        }),
      });

      if (createRes.ok) {
        const newDoc = await createRes.json();
        router.push(`/documents/${newDoc._id}/edit`);
      }
    } catch (error) {
      console.error('Failed to use template:', error);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('documents.templates.title')} description={t('documents.templates.description')}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Link
                href="/documents"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Documents
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Layout className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
                  <p className="text-sm text-gray-500">{templates.length} templates available</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>New Template</span>
            </button>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  selectedCategory === cat.value
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <cat.icon className="h-4 w-4" />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Layout className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No templates found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm ? 'Try adjusting your search' : 'Create your first template'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((template) => (
                <div
                  key={template._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-3 rounded-xl ${
                        template.templateCategory === 'contracts'
                          ? 'bg-blue-50 text-blue-600'
                          : template.templateCategory === 'litigation'
                          ? 'bg-red-50 text-red-600'
                          : template.templateCategory === 'correspondence'
                          ? 'bg-green-50 text-green-600'
                          : template.templateCategory === 'discovery'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-purple-50 text-purple-600'
                      }`}
                    >
                      {getCategoryIcon(template.templateCategory)}
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                      {template.templateCategory || 'general'}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{template.title}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{template.description}</p>
                  )}

                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-gray-400 text-xs">
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => useTemplate(template._id)}
                      className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Use Template</span>
                    </button>
                    <Link
                      href={`/documents/${template._id}`}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Template Modal */}
          {showNewModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Template</h3>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      value={newTemplate.title}
                      onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                      placeholder="e.g., Standard Engagement Letter"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newTemplate.description}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, description: e.target.value })
                      }
                      rows={2}
                      placeholder="Brief description of this template..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={newTemplate.templateCategory}
                        onChange={(e) =>
                          setNewTemplate({ ...newTemplate, templateCategory: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {TEMPLATE_CATEGORIES.filter((c) => c.value).map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                      <input
                        value={newTemplate.tags}
                        onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                        placeholder="comma, separated"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Content
                    </label>
                    <textarea
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                      rows={6}
                      placeholder="Enter the template content here... You can use placeholders like [CLIENT_NAME], [DATE], etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createTemplate}
                    disabled={!newTemplate.title.trim() || creating}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Template'}
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
