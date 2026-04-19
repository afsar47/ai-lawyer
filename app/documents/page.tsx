'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Folder,
  FolderPlus,
  Grid3X3,
  List,
  Filter,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Upload,
  File,
  FileImage,
  FileSpreadsheet,
  Presentation,
  Tag,
  X,
  Download,
  Eye,
  Lock,
  Users,
  Clock,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';

type DocumentFile = {
  filename: string;
  originalName: string;
  mimeType: string;
  fileType: string;
  size: number;
  url: string;
};

type DocumentRow = {
  _id: string;
  documentNumber: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  file?: DocumentFile;
  folderId?: string;
  folderPath?: string;
  tags?: string[];
  clientName?: string;
  matterNumber?: string;
  sharedWithClient?: boolean;
  isConfidential?: boolean;
  version?: number;
  downloadCount?: number;
  createdAt: string;
  updatedAt: string;
};

type FolderRow = {
  _id: string;
  name: string;
  description?: string;
  parentId?: string;
  path: string;
  color: string;
  documentCount: number;
};

const DOCUMENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'pleading', label: 'Pleading' },
  { value: 'contract', label: 'Contract' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'case_note', label: 'Case Note' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'court_filing', label: 'Court Filing' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'memo', label: 'Memo' },
  { value: 'other', label: 'Other' },
];

const DOCUMENT_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'final', label: 'Final' },
  { value: 'archived', label: 'Archived' },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(fileType?: string) {
  switch (fileType) {
    case 'pdf':
      return <File className="h-5 w-5 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="h-5 w-5 text-blue-500" />;
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    case 'ppt':
    case 'pptx':
      return <Presentation className="h-5 w-5 text-orange-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <FileImage className="h-5 w-5 text-purple-500" />;
    default:
      return <FileText className="h-5 w-5 text-gray-500" />;
  }
}

export default function DocumentsPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'All Documents' },
  ]);

  const [filters, setFilters] = useState({
    type: '',
    status: '',
    tags: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [totalCount, setTotalCount] = useState(0);

  const loadDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('q', searchTerm);
      if (currentFolderId) params.set('folderId', currentFolderId);
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.tags) params.set('tags', filters.tags);
      params.set('sortBy', filters.sortBy);
      params.set('sortOrder', filters.sortOrder);
      params.set('isTemplate', 'false');
      params.set('limit', '100');

      const res = await fetch(`/api/documents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || data);
        setTotalCount(data.total || (data.documents || data).length);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }, [searchTerm, currentFolderId, filters]);

  const loadFolders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (currentFolderId) params.set('parentId', currentFolderId);
      const res = await fetch(`/api/documents/folders?${params.toString()}`);
      if (res.ok) {
        setFolders(await res.json());
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, [currentFolderId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadDocuments(), loadFolders()]);
      setLoading(false);
    };
    load();
  }, [loadDocuments, loadFolders]);

  const navigateToFolder = (folder: FolderRow | null) => {
    if (folder) {
      setCurrentFolderId(folder._id);
      setBreadcrumbs((prev) => [...prev, { id: folder._id, name: folder.name }]);
    } else {
      setCurrentFolderId(null);
      setBreadcrumbs([{ id: null, name: 'All Documents' }]);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    const crumb = breadcrumbs[index];
    setCurrentFolderId(crumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const res = await fetch('/api/documents/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolderId,
        }),
      });
      if (res.ok) {
        setNewFolderName('');
        setShowNewFolderModal(false);
        loadFolders();
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setCreatingFolder(false);
    }
  };

  const statusBadge = (status: string) => {
    const base = 'inline-flex px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'final':
        return `${base} bg-green-100 text-green-800`;
      case 'approved':
        return `${base} bg-blue-100 text-blue-800`;
      case 'review':
        return `${base} bg-amber-100 text-amber-800`;
      case 'archived':
        return `${base} bg-gray-100 text-gray-600`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  };

  const typeBadge = (type: string) => {
    const base = 'inline-flex px-2 py-0.5 rounded text-xs font-medium';
    const colors: Record<string, string> = {
      contract: 'bg-purple-100 text-purple-700',
      pleading: 'bg-blue-100 text-blue-700',
      evidence: 'bg-red-100 text-red-700',
      engagement: 'bg-green-100 text-green-700',
      correspondence: 'bg-yellow-100 text-yellow-700',
      court_filing: 'bg-indigo-100 text-indigo-700',
      discovery: 'bg-pink-100 text-pink-700',
      memo: 'bg-cyan-100 text-cyan-700',
    };
    return `${base} ${colors[type] || 'bg-gray-100 text-gray-700'}`;
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('documents.title')} description={t('documents.description')}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                <p className="text-sm text-gray-500">{totalCount} documents total</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FolderPlus className="h-4 w-4" />
                <span>{t('common.create')} Folder</span>
              </button>
              <Link
                href="/documents/new"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>{t('documents.newDocument')}</span>
              </Link>
              <Link
                href="/documents/upload"
                className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Upload className="h-4 w-4" />
                <span>{t('documents.upload')}</span>
              </Link>
            </div>
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 1 && (
            <nav className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id || 'root'} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />}
                  <button
                    onClick={() => navigateToBreadcrumb(index)}
                    className={`hover:text-blue-600 ${
                      index === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </nav>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search documents by title, type, client, case..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center space-x-2 px-4 py-2.5 border rounded-lg transition-colors ${
                    showFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {DOCUMENT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
                  <input
                    value={filters.tags}
                    onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
                    placeholder="e.g., urgent, important"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="createdAt">Date Created</option>
                    <option value="updatedAt">Date Modified</option>
                    <option value="title">Title</option>
                    <option value="type">Type</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Order</label>
                  <button
                    onClick={() =>
                      setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2 text-sm"
                  >
                    {filters.sortOrder === 'asc' ? (
                      <>
                        <SortAsc className="h-4 w-4" />
                        <span>Ascending</span>
                      </>
                    ) : (
                      <>
                        <SortDesc className="h-4 w-4" />
                        <span>Descending</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Folders */}
          {folders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <button
                  key={folder._id}
                  onClick={() => navigateToFolder(folder)}
                  className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <Folder
                    className="h-12 w-12 mb-2 transition-colors"
                    style={{ color: folder.color }}
                  />
                  <span className="text-sm font-medium text-gray-900 text-center line-clamp-1">
                    {folder.name}
                  </span>
                  <span className="text-xs text-gray-500">{folder.documentCount} docs</span>
                </button>
              ))}
            </div>
          )}

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Loading documents...
              </div>
            ) : docs.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No documents found</p>
                <p className="text-gray-500 text-sm mt-1">
                  {searchTerm || filters.type || filters.status
                    ? 'Try adjusting your search or filters'
                    : 'Upload or create your first document'}
                </p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Case / Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Modified
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {docs.map((d) => (
                      <tr
                        key={d._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/documents/${d._id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(d.file?.fileType)}
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">{d.title}</span>
                                {d.isConfidential && <Lock className="h-3 w-3 text-amber-500" />}
                                {d.sharedWithClient && <Users className="h-3 w-3 text-green-500" />}
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{d.documentNumber}</span>
                                {d.version && d.version > 1 && (
                                  <span className="text-blue-600">v{d.version}</span>
                                )}
                                {d.file && <span>{formatFileSize(d.file.size)}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{d.matterNumber || '—'}</div>
                          <div className="text-xs text-gray-500">{d.clientName || ''}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={typeBadge(d.type)}>{d.type.replace('_', ' ')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={statusBadge(d.status)}>{d.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(d.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/documents/${d._id}`}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {d.file?.url && (
                              <a
                                href={d.file.url}
                                download={d.file.originalName}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {docs.map((d) => (
                  <Link
                    key={d._id}
                    href={`/documents/${d._id}`}
                    className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-center h-20 mb-3">
                      {d.file?.fileType ? (
                        <div className="transform group-hover:scale-110 transition-transform">
                          {getFileIcon(d.file.fileType)}
                        </div>
                      ) : (
                        <FileText className="h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{d.title}</h3>
                      <p className="text-xs text-gray-500">{d.documentNumber}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                      <span className={statusBadge(d.status)}>{d.status}</span>
                      {d.file && <span className="text-xs text-gray-400">{formatFileSize(d.file.size)}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* New Folder Modal */}
          {showNewFolderModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Folder</h3>
                  <button
                    onClick={() => setShowNewFolderModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                  autoFocus
                />
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowNewFolderModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createFolder}
                    disabled={!newFolderName.trim() || creatingFolder}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creatingFolder ? 'Creating...' : 'Create Folder'}
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
