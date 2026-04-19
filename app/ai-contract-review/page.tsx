'use client';

import { useState } from 'react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useSession } from 'next-auth/react';
import { useSettings } from '../contexts/SettingsContext';
import { aiConfigManager } from '@/lib/ai-config';
import { aiService } from '@/lib/ai-service';
import { ensureLegalDisclaimer, type Jurisdiction } from '@/lib/legal/prompt';
import { buildContractReviewPrompt } from '@/lib/legal/tools';
import CaseSearchSelect, { CaseOption } from '../components/CaseSearchSelect';
import { useTranslations } from '../hooks/useTranslations';

export default function AIContractReviewPage() {
  const { t } = useTranslations();
  const { data: session } = useSession();
  const { settings } = useSettings();
  const jurisdiction = (settings?.jurisdiction || 'global_generic') as Jurisdiction;

  const [matterId, setMatterId] = useState('');
  const [context, setContext] = useState('');
  const [contractText, setContractText] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCaseChange = (id: string, caseData: CaseOption | null) => {
    setMatterId(id);
  };

  const run = async () => {
    setError(null);
    setOutput('');
    setRunning(true);
    try {
      if (!contractText.trim()) throw new Error('Paste contract text to review.');

      const prompt = buildContractReviewPrompt({ jurisdiction, contractText, context: context || undefined });
      const activeModel = await aiConfigManager.getActiveModel();
      const result = await aiService.generateText({
        prompt,
        modelId: activeModel?.id || '1',
        maxTokens: 1600,
        temperature: 0.2,
      });

      if (!result.success || !result.content) throw new Error(result.error || 'AI request failed');
      const finalText = ensureLegalDisclaimer(result.content, jurisdiction);
      setOutput(finalText);

      try {
        const userId = String(session?.user?.id || session?.user?.email || 'unknown');
        await fetch('/api/ai-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'legal-review',
            title: `Contract review — ${new Date().toLocaleDateString()}`,
            content: finalText,
            aiModel: activeModel
              ? { id: activeModel.id, name: activeModel.name, provider: activeModel.provider }
              : undefined,
            metadata: { jurisdiction, tool: 'ai_contract_review', matterId: matterId || undefined },
          }),
        });
      } catch {
        // ignore
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to run');
    } finally {
      setRunning(false);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('aiContractReview.title')} description={t('aiContractReview.description')}>
        <div className="max-w-5xl mx-auto space-y-4">
          {error ? (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
          ) : null}

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <CaseSearchSelect
                label={t('aiContractReview.caseOptional')}
                value={matterId}
                onChange={handleCaseChange}
                placeholder={t('aiContractReview.searchCase')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('aiTools.jurisdiction')}: {jurisdiction}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiContractReview.context')}</label>
              <input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('aiContractReview.contextPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiContractReview.contractText')} *</label>
              <textarea
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={run}
                disabled={running}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {running ? t('aiContractReview.reviewing') : t('aiContractReview.runReview')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-semibold text-gray-900 mb-2">{t('aiContractReview.review')}</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{output || '—'}</div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

