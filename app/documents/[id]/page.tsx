'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Edit,
  FileText,
  Clock,
  User,
  Tag,
  Folder,
  Lock,
  Users,
  Eye,
  History,
  Share2,
  Trash2,
  Copy,
  ExternalLink,
  File,
  FileImage,
  FileSpreadsheet,
  Presentation,
  CheckCircle,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';

type DocumentFile = {
  filename: string;
  originalName: string;
  mimeType: string;
  fileType: string;
  size: number;
  url: string;
  uploadedAt: string;
};

type DocumentData = {
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
  version: number;
  rootDocumentId?: string;
  previousVersionId?: string;
  versionNotes?: string;
  clientId?: string;
  clientName?: string;
  matterId?: string;
  matterNumber?: string;
  content?: string;
  sharedWithClient: boolean;
  isConfidential: boolean;
  accessLevel: string;
  isTemplate: boolean;
  createdByEmail?: string;
  lastModifiedByEmail?: string;
  downloadCount: number;
  lastDownloadedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type VersionRow = {
  _id: string;
  version: number;
  status: string;
  createdByEmail?: string;
  versionNotes?: string;
  createdAt: string;
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(fileType?: string, size: 'sm' | 'lg' = 'sm') {
  const sizeClass = size === 'lg' ? 'h-16 w-16' : 'h-6 w-6';
  switch (fileType) {
    case 'pdf':
      return <File className={`${sizeClass} text-red-500`} />;
    case 'doc':
    case 'docx':
      return <FileText className={`${sizeClass} text-blue-500`} />;
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className={`${sizeClass} text-green-500`} />;
    case 'ppt':
    case 'pptx':
      return <Presentation className={`${sizeClass} text-orange-500`} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <FileImage className={`${sizeClass} text-purple-500`} />;
    default:
      return <FileText className={`${sizeClass} text-gray-500`} />;
  }
}

export default function DocumentDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'versions' | 'preview'>('details');
  const [downloading, setDownloading] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/documents/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load document');
        setDoc(data);

        if (data.rootDocumentId) {
          const vRes = await fetch(`/api/documents?rootDocumentId=${data.rootDocumentId}&limit=50`);
          if (vRes.ok) {
            const vData = await vRes.json();
            setVersions(vData.documents || vData || []);
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const createNewVersion = async () => {
    if (!doc) return;
    setCreatingVersion(true);
    try {
      const res = await fetch(`/api/documents/${doc._id}/versions`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create new version');
      router.push(`/documents/${data._id}/edit`);
    } catch (e: any) {
      setError(e?.message || 'Failed to create new version');
    } finally {
      setCreatingVersion(false);
    }
  };

  const downloadPdf = async () => {
    if (!doc) return;
    setDownloading(true);
    try {
      if (doc.file?.url) {
        const link = document.createElement('a');
        link.href = doc.file.url;
        link.download = doc.file.originalName;
        link.click();
      } else {
        const { default: jsPDF } = await import('jspdf');
        const pdf = new jsPDF();
        pdf.setFontSize(16);
        pdf.text(String(doc.title || 'Document'), 14, 18);
        pdf.setFontSize(10);
        pdf.text(`${doc.documentNumber || ''} • ${doc.type || ''} • ${doc.status || ''}`.trim(), 14, 26);
        pdf.setFontSize(11);
        const content = String(doc.content || '').trim() || '—';
        const lines = pdf.splitTextToSize(content, 180);
        pdf.text(lines, 14, 36);
        pdf.save(`${doc.documentNumber || 'document'}.pdf`);
      }
    } finally {
      setDownloading(false);
    }
  };

  const statusBadge = (status: string) => {
    const base = 'inline-flex px-3 py-1 rounded-full text-sm font-medium';
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

  const tabs = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'versions', label: 'Version History', icon: History },
    { id: 'preview', label: 'Preview', icon: Eye },
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout title="Document" description="Loading...">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  if (error || !doc) {
    return (
      <ProtectedRoute>
        <SidebarLayout title="Document" description="Error">
          <div className="max-w-2xl mx-auto">
            <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-800 font-medium">{error || 'Document not found'}</p>
              <Link href="/documents" className="text-sm text-red-600 hover:underline mt-2 inline-block">
                ← Back to Documents
              </Link>
            </div>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout title={doc.title} description={`Document ${doc.documentNumber}`}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <Link
                href="/documents"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Documents
              </Link>
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  {getFileIcon(doc.file?.fileType, 'lg')}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                    <span>{doc.title}</span>
                    {doc.isConfidential && <Lock className="h-5 w-5 text-amber-500" />}
                  </h1>
                  <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                    <span>{doc.documentNumber}</span>
                    <span>•</span>
                    <span>Version {doc.version}</span>
                    <span>•</span>
                    <span className="capitalize">{doc.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-3 mt-3">
                    <span className={statusBadge(doc.status)}>{doc.status}</span>
                    {doc.sharedWithClient && (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                        <Users className="h-3 w-3" />
                        <span>Shared with client</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={createNewVersion}
                disabled={creatingVersion}
                className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                <span>{creatingVersion ? 'Creating...' : 'New Version'}</span>
              </button>
              <button
                onClick={downloadPdf}
                disabled={downloading}
                className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{downloading ? 'Preparing...' : 'Download'}</span>
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
              <Link
                href={`/documents/${doc._id}/edit`}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                {doc.description && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
                    <p className="text-gray-700">{doc.description}</p>
                  </div>
                )}

                {/* Content */}
                {doc.content && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Content</h3>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {doc.content}
                    </div>
                  </div>
                )}

                {/* File Info */}
                {doc.file && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">File Information</h3>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      {getFileIcon(doc.file.fileType)}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{doc.file.originalName}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(doc.file.size)} • Uploaded{' '}
                          {new Date(doc.file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={doc.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {doc.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          <Tag className="h-3 w-3" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Info</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Case</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {doc.matterNumber ? (
                          <Link href={`/cases/${doc.matterId}`} className="text-blue-600 hover:underline">
                            {doc.matterNumber}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Client</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {doc.clientName ? (
                          <Link href={`/clients/${doc.clientId}`} className="text-blue-600 hover:underline">
                            {doc.clientName}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </dd>
                    </div>
                    {doc.folderPath && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase">Folder</dt>
                        <dd className="mt-1 text-sm text-gray-900 flex items-center space-x-1">
                          <Folder className="h-4 w-4 text-gray-400" />
                          <span>{doc.folderPath}</span>
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Access Level</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">{doc.accessLevel}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Downloads</dt>
                      <dd className="mt-1 text-sm text-gray-900">{doc.downloadCount}</dd>
                    </div>
                  </dl>
                </div>

                {/* Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(doc.createdAt).toLocaleString()}
                        {doc.createdByEmail && (
                          <span className="text-gray-500 block">{doc.createdByEmail}</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Last Modified</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(doc.updatedAt).toLocaleString()}
                        {doc.lastModifiedByEmail && (
                          <span className="text-gray-500 block">{doc.lastModifiedByEmail}</span>
                        )}
                      </dd>
                    </div>
                    {doc.lastDownloadedAt && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase">Last Downloaded</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(doc.lastDownloadedAt).toLocaleString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {versions.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No version history available</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {versions
                    .sort((a, b) => b.version - a.version)
                    .map((v) => (
                      <div
                        key={v._id}
                        className={`p-4 flex items-center justify-between hover:bg-gray-50 ${
                          v._id === doc._id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              v._id === doc._id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            v{v.version}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">Version {v.version}</span>
                              {v._id === doc._id && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  Current
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  v.status === 'final'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {v.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(v.createdAt).toLocaleString()}
                              {v.createdByEmail && ` by ${v.createdByEmail}`}
                            </p>
                            {v.versionNotes && (
                              <p className="text-sm text-gray-600 mt-1">{v.versionNotes}</p>
                            )}
                          </div>
                        </div>
                        {v._id !== doc._id && (
                          <Link
                            href={`/documents/${v._id}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {doc.file?.url && doc.file.fileType === 'pdf' ? (
                <iframe
                  src={doc.file.url}
                  className="w-full h-[800px] rounded-lg border"
                  title="Document Preview"
                />
              ) : doc.file?.url && ['jpg', 'jpeg', 'png', 'gif'].includes(doc.file.fileType || '') ? (
                <div className="flex justify-center">
                  <img
                    src={doc.file.url}
                    alt={doc.title}
                    className="max-w-full max-h-[800px] rounded-lg"
                  />
                </div>
              ) : doc.content ? (
                <div className="prose max-w-none whitespace-pre-wrap p-8 bg-gray-50 rounded-lg min-h-[400px]">
                  {doc.content}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Preview not available</p>
                  <p className="text-sm mt-1">Download the file to view its contents</p>
                </div>
              )}
            </div>
          )}

          {/* Share Modal */}
          {showShareModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Document</h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={doc.sharedWithClient}
                        disabled
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Share with client via portal</span>
                    </label>
                  </div>
                  <div className="pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Copy link
                    </label>
                    <div className="flex space-x-2">
                      <input
                        readOnly
                        value={typeof window !== 'undefined' ? window.location.href : ''}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Done
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
