'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  File,
  FileImage,
  FileSpreadsheet,
  Presentation,
} from 'lucide-react';
import ProtectedRoute from '../../protected-route';
import SidebarLayout from '../../components/sidebar-layout';
import CaseSearchSelect, { CaseOption } from '../../components/CaseSearchSelect';
import { useTranslations } from '../../hooks/useTranslations';

type FolderRow = { _id: string; name: string; path: string };

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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(file: File) {
  const type = file.type;
  if (type === 'application/pdf') return <File className="h-8 w-8 text-red-500" />;
  if (type.includes('word')) return <FileText className="h-8 w-8 text-blue-500" />;
  if (type.includes('spreadsheet') || type.includes('excel'))
    return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
  if (type.includes('presentation') || type.includes('powerpoint'))
    return <Presentation className="h-8 w-8 text-orange-500" />;
  if (type.startsWith('image/')) return <FileImage className="h-8 w-8 text-purple-500" />;
  return <FileText className="h-8 w-8 text-gray-500" />;
}

type UploadFile = {
  file: File;
  title: string;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  documentId?: string;
};

export default function DocumentUploadPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [globalSettings, setGlobalSettings] = useState({
    matterId: '',
    folderId: '',
    tags: '',
    isConfidential: false,
    sharedWithClient: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const fRes = await fetch('/api/documents/folders');
        if (fRes.ok) setFolders(await fRes.json());
      } finally {
        setLoadingRefs(false);
      }
    };
    load();
  }, []);

  const handleCaseChange = (id: string, caseData: CaseOption | null) => {
    setGlobalSettings({ ...globalSettings, matterId: id });
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''),
      type: 'other',
      status: 'pending',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFile = (index: number, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const uploadFile = async (index: number) => {
    const uploadFile = files[index];
    if (uploadFile.status !== 'pending') return;

    updateFile(index, { status: 'uploading', progress: 0 });

    const formData = new FormData();
    formData.append('file', uploadFile.file);
    formData.append('title', uploadFile.title);
    formData.append('type', uploadFile.type);
    if (globalSettings.matterId) formData.append('matterId', globalSettings.matterId);
    if (globalSettings.folderId) formData.append('folderId', globalSettings.folderId);
    if (globalSettings.tags) formData.append('tags', globalSettings.tags);
    formData.append('isConfidential', String(globalSettings.isConfidential));
    formData.append('sharedWithClient', String(globalSettings.sharedWithClient));

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        updateFile(index, { status: 'success', progress: 100, documentId: data._id });
      } else {
        const error = await res.json();
        updateFile(index, { status: 'error', error: error.error || 'Upload failed' });
      }
    } catch (err) {
      updateFile(index, { status: 'error', error: 'Network error' });
    }
  };

  const uploadAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        await uploadFile(i);
      }
    }
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('documents.uploadPage.title')} description={t('documents.uploadPage.description')}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <Link
              href="/documents"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Link>
          </div>

          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.jpg,.jpeg,.png,.gif"
            />
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Drag and drop files here
              </h3>
              <p className="text-gray-500 mb-4">or click to browse</p>
              <p className="text-xs text-gray-400">
                Supports PDF, Word, Excel, PowerPoint, images (max 50MB each)
              </p>
            </div>
          </div>

          {/* Global Settings */}
          {files.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Apply to all files</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <CaseSearchSelect
                  label="Case"
                  value={globalSettings.matterId}
                  onChange={handleCaseChange}
                  placeholder="Search cases..."
                />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Folder</label>
                  <select
                    value={globalSettings.folderId}
                    onChange={(e) =>
                      setGlobalSettings({ ...globalSettings, folderId: e.target.value })
                    }
                    disabled={loadingRefs}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">— Root —</option>
                    {folders.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.path}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
                  <input
                    value={globalSettings.tags}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, tags: e.target.value })}
                    placeholder="comma,separated"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="flex items-center space-x-4 pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalSettings.isConfidential}
                      onChange={(e) =>
                        setGlobalSettings({ ...globalSettings, isConfidential: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Confidential</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalSettings.sharedWithClient}
                      onChange={(e) =>
                        setGlobalSettings({ ...globalSettings, sharedWithClient: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Share</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-900">
                    {files.length} file{files.length !== 1 ? 's' : ''} selected
                  </span>
                  {successCount > 0 && (
                    <span className="text-sm text-green-600">{successCount} uploaded</span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-sm text-red-600">{errorCount} failed</span>
                  )}
                </div>
                <button
                  onClick={uploadAll}
                  disabled={pendingCount === 0}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload All ({pendingCount})</span>
                </button>
              </div>

              <div className="divide-y divide-gray-200">
                {files.map((f, index) => (
                  <div key={index} className="p-4 flex items-center space-x-4">
                    <div className="flex-shrink-0">{getFileIcon(f.file)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <input
                          value={f.title}
                          onChange={(e) => updateFile(index, { title: e.target.value })}
                          disabled={f.status !== 'pending'}
                          className="flex-1 text-sm font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none disabled:text-gray-500"
                        />
                        <select
                          value={f.type}
                          onChange={(e) => updateFile(index, { type: e.target.value })}
                          disabled={f.status !== 'pending'}
                          className="text-xs border border-gray-300 rounded px-2 py-1 disabled:bg-gray-50"
                        >
                          {DOCUMENT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{f.file.name}</span>
                        <span>•</span>
                        <span>{formatFileSize(f.file.size)}</span>
                        {f.error && (
                          <>
                            <span>•</span>
                            <span className="text-red-600">{f.error}</span>
                          </>
                        )}
                      </div>
                      {f.status === 'uploading' && (
                        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${f.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      {f.status === 'pending' && (
                        <>
                          <button
                            onClick={() => uploadFile(index)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeFile(index)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {f.status === 'uploading' && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                      )}
                      {f.status === 'success' && (
                        <div className="p-2 bg-green-100 rounded-full">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                      {f.status === 'error' && (
                        <div className="p-2 bg-red-100 rounded-full">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {successCount === files.length && files.length > 0 && (
                <div className="p-4 bg-green-50 border-t border-green-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-green-700">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">All files uploaded successfully!</span>
                    </div>
                    <Link
                      href="/documents"
                      className="text-sm font-medium text-green-700 hover:text-green-800"
                    >
                      Go to Documents →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
