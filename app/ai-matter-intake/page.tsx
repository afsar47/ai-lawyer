'use client';

import { useState } from 'react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useSession } from 'next-auth/react';
import { useSettings } from '../contexts/SettingsContext';
import { aiConfigManager } from '@/lib/ai-config';
import { aiService } from '@/lib/ai-service';
import { ensureLegalDisclaimer, type Jurisdiction } from '@/lib/legal/prompt';
import { buildClientIntakeSummaryPrompt } from '@/lib/legal/tools';
import CaseSearchSelect, { CaseOption } from '../components/CaseSearchSelect';
import { useTranslations } from '../hooks/useTranslations';

export default function AIMatterIntakePage() {
  const { t } = useTranslations();
  const { data: session } = useSession();
  const { settings } = useSettings();
  const jurisdiction = (settings?.jurisdiction || 'global_generic') as Jurisdiction;

  const [matterId, setMatterId] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('');
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
      if (!intakeNotes.trim()) throw new Error('Please paste intake notes.');

      const prompt = buildClientIntakeSummaryPrompt({ jurisdiction, intakeNotes });
      const activeModel = await aiConfigManager.getActiveModel();
      const result = await aiService.generateText({
        prompt,
        modelId: activeModel?.id || '1',
        maxTokens: 1200,
        temperature: 0.3,
      });

      if (!result.success || !result.content) throw new Error(result.error || 'AI request failed');
      const finalText = ensureLegalDisclaimer(result.content, jurisdiction);
      setOutput(finalText);

      // Save AI result (non-blocking)
      try {
        const userId = String(session?.user?.id || session?.user?.email || 'unknown');
        await fetch('/api/ai-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'legal-intake-summary',
            title: `Intake summary — ${intakeNotes.slice(0, 60)}`,
            content: finalText,
            aiModel: activeModel
              ? { id: activeModel.id, name: activeModel.name, provider: activeModel.provider }
              : undefined,
            metadata: {
              jurisdiction,
              tool: 'ai_matter_intake',
              matterId: matterId || undefined,
            },
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
      <SidebarLayout title={t('aiMatterIntake.title')} description={t('aiMatterIntake.description')}>
        <div className="max-w-5xl mx-auto space-y-4">
          {error ? (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
          ) : null}

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <CaseSearchSelect
                label={t('aiMatterIntake.caseOptional')}
                value={matterId}
                onChange={handleCaseChange}
                placeholder={t('aiMatterIntake.searchCase')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('aiTools.jurisdiction')}: {jurisdiction}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiMatterIntake.intakeNotes')} *</label>
              <textarea
                value={intakeNotes}
                onChange={(e) => setIntakeNotes(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('aiMatterIntake.intakeNotesPlaceholder')}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={run}
                disabled={running}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {running ? t('aiTools.running') : t('aiMatterIntake.generateSummary')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-semibold text-gray-900 mb-2">{t('aiTools.output')}</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{output || '—'}</div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

