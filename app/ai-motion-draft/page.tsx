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

export default function AIMotionDraftPage() {
  const { t } = useTranslations();
  const { data: session } = useSession();
  const { settings } = useSettings();
  const jurisdiction = (settings?.jurisdiction || 'global_generic') as Jurisdiction;

  const [matterId, setMatterId] = useState('');
  const [motionType, setMotionType] = useState('Motion to Dismiss');
  const [facts, setFacts] = useState('');
  const [relief, setRelief] = useState('');
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
      if (!facts.trim()) throw new Error('Provide the key facts and procedural posture.');

      const prompt = [
        `Draft a ${motionType} as a starting point.`,
        `Jurisdiction conventions: ${jurisdiction}.`,
        ``,
        `Requirements:`,
        `- Use a professional pleading style with headings and placeholders where needed.`,
        `- Include: caption placeholders, introduction, background, argument (with numbered points), conclusion/prayer.`,
        `- Do NOT fabricate citations. If legal authority is needed, add a [CITE NEEDED] placeholder.`,
        ``,
        `Facts / posture:`,
        facts,
        ``,
        `Requested relief:`,
        relief || '[Describe requested relief]',
      ].join('\n');

      const activeModel = await aiConfigManager.getActiveModel();
      const result = await aiService.generateText({
        prompt,
        modelId: activeModel?.id || '1',
        maxTokens: 1600,
        temperature: 0.25,
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
            type: 'legal-draft',
            title: `${motionType} — draft`,
            content: finalText,
            aiModel: activeModel
              ? { id: activeModel.id, name: activeModel.name, provider: activeModel.provider }
              : undefined,
            metadata: { jurisdiction, tool: 'ai_motion_draft', matterId },
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
      <SidebarLayout title={t('aiMotionDraft.title')} description={t('aiMotionDraft.description')}>
        <div className="max-w-5xl mx-auto space-y-4">
          {error ? (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
          ) : null}

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CaseSearchSelect
                label={`${t('aiMotionDraft.case')} *`}
                value={matterId}
                onChange={handleCaseChange}
                placeholder={t('aiMotionDraft.searchCase')}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiMotionDraft.motionType')}</label>
                <input
                  value={motionType}
                  onChange={(e) => setMotionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{t('aiTools.jurisdiction')}: {jurisdiction}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiMotionDraft.factsPosture')} *</label>
              <textarea
                value={facts}
                onChange={(e) => setFacts(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiMotionDraft.requestedRelief')}</label>
              <textarea
                value={relief}
                onChange={(e) => setRelief(e.target.value)}
                rows={4}
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
                {running ? t('aiMotionDraft.drafting') : t('aiMotionDraft.generateDraft')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-semibold text-gray-900 mb-2">{t('aiMotionDraft.draft')}</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{output || '—'}</div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

