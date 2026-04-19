'use client';

import { useState } from 'react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import CaseSearchSelect, { CaseOption } from '../components/CaseSearchSelect';
import { useTranslations } from '../hooks/useTranslations';

export default function AIKnowledgeSearchPage() {
  const { t } = useTranslations();
  const [matterId, setMatterId] = useState('');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCaseChange = (id: string, caseData: CaseOption | null) => {
    setMatterId(id);
  };

  const run = async () => {
    setError(null);
    setAnswer('');
    setSources([]);
    setRunning(true);
    try {
      if (!query.trim()) throw new Error('Enter a question to search.');
      const res = await fetch('/api/ai/knowledge-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, matterId: matterId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Search failed');
      setAnswer(data.answer || '');
      setSources(data.sources || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to run');
    } finally {
      setRunning(false);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('aiKnowledgeSearch.title')} description={t('aiKnowledgeSearch.description')}>
        <div className="max-w-5xl mx-auto space-y-4">
          {error ? (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
          ) : null}

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <CaseSearchSelect
              label={t('aiKnowledgeSearch.caseOptional')}
              value={matterId}
              onChange={handleCaseChange}
              placeholder={t('aiKnowledgeSearch.searchCasePlaceholder')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiKnowledgeSearch.question')} *</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('aiKnowledgeSearch.questionPlaceholder')}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={run}
                disabled={running}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {running ? t('aiKnowledgeSearch.searching') : t('aiKnowledgeSearch.search')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-semibold text-gray-900 mb-2">{t('aiKnowledgeSearch.answer')}</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{answer || '—'}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-semibold text-gray-900 mb-2">{t('aiKnowledgeSearch.sources')}</div>
            {sources.length === 0 ? (
              <div className="text-sm text-gray-600">—</div>
            ) : (
              <div className="space-y-3">
                {sources.map((s) => (
                  <div key={`${s.kind}:${s.id}`} className="border border-gray-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-gray-700">{s.label}</div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{s.excerpt}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

