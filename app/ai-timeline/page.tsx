'use client';

import { useState } from 'react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useSession } from 'next-auth/react';
import { useSettings } from '../contexts/SettingsContext';
import { aiConfigManager } from '@/lib/ai-config';
import { aiService } from '@/lib/ai-service';
import { ensureLegalDisclaimer, type Jurisdiction } from '@/lib/legal/prompt';
import CaseSearchSelect, { CaseOption } from '../components/CaseSearchSelect';
import { useTranslations } from '../hooks/useTranslations';

export default function AITimelinePage() {
  const { t } = useTranslations();
  const { data: session } = useSession();
  const { settings } = useSettings();
  const jurisdiction = (settings?.jurisdiction || 'global_generic') as Jurisdiction;

  const [matterId, setMatterId] = useState('');
  const [sourceText, setSourceText] = useState('');
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
      if (!matterId) throw new Error('Please select a matter.');
      if (!sourceText.trim()) throw new Error('Paste facts / notes / document excerpts to build a timeline.');

      const prompt = [
        `Build a litigation timeline from the provided text.`,
        `Jurisdiction conventions: ${jurisdiction}.`,
        ``,
        `Output as a table with columns: Date (or approx), Event, People/Entities, Source excerpt, Confidence (low/med/high).`,
        `If dates are missing, infer ordering but clearly mark as approximate.`,
        ``,
        `Text:`,
        sourceText,
      ].join('\n');

      const activeModel = await aiConfigManager.getActiveModel();
      const result = await aiService.generateText({
        prompt,
        modelId: activeModel?.id || '1',
        maxTokens: 1400,
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
            type: 'legal-timeline',
            title: `Timeline — ${new Date().toLocaleDateString()}`,
            content: finalText,
            aiModel: activeModel
              ? { id: activeModel.id, name: activeModel.name, provider: activeModel.provider }
              : undefined,
            metadata: { jurisdiction, tool: 'ai_timeline', matterId },
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
      <SidebarLayout title={t('aiTimeline.title')} description={t('aiTimeline.description')}>
        <div className="max-w-5xl mx-auto space-y-4">
          {error ? (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
          ) : null}

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <CaseSearchSelect
              label={`${t('aiTimeline.case')} *`}
              value={matterId}
              onChange={handleCaseChange}
              placeholder={t('aiTimeline.searchCase')}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiTimeline.sourceText')} *</label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('aiTimeline.sourceTextPlaceholder')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('aiTools.jurisdiction')}: {jurisdiction}</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={run}
                disabled={running}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {running ? t('aiTimeline.building') : t('aiTimeline.buildTimeline')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-semibold text-gray-900 mb-2">{t('aiTimeline.timeline')}</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{output || '—'}</div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

