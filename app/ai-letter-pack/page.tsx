'use client';

import { useState } from 'react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useSession } from 'next-auth/react';
import { useSettings } from '../contexts/SettingsContext';
import { aiConfigManager } from '@/lib/ai-config';
import { aiService } from '@/lib/ai-service';
import { ensureLegalDisclaimer, type Jurisdiction } from '@/lib/legal/prompt';
import { buildDemandLetterDraftPrompt, buildEngagementLetterDraftPrompt, buildNdaDraftPrompt } from '@/lib/legal/tools';
import { useTranslations } from '../hooks/useTranslations';

type LetterTool = 'engagement' | 'demand' | 'nda';

export default function AILetterPackPage() {
  const { t } = useTranslations();
  const { data: session } = useSession();
  const { settings } = useSettings();
  const jurisdiction = (settings?.jurisdiction || 'global_generic') as Jurisdiction;

  const [tool, setTool] = useState<LetterTool>('engagement');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Engagement
  const [firmName, setFirmName] = useState('');
  const [clientName, setClientName] = useState('');
  const [matterDescription, setMatterDescription] = useState('');
  const [feeStructure, setFeeStructure] = useState('');

  // Demand
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [facts, setFacts] = useState('');
  const [demands, setDemands] = useState('');
  const [deadline, setDeadline] = useState('');

  // NDA
  const [partyA, setPartyA] = useState('');
  const [partyB, setPartyB] = useState('');
  const [purpose, setPurpose] = useState('');
  const [term, setTerm] = useState('');

  const run = async () => {
    setError(null);
    setOutput('');
    setRunning(true);
    try {
      let prompt = '';
      let title = '';
      if (tool === 'engagement') {
        prompt = buildEngagementLetterDraftPrompt({
          jurisdiction,
          firmName,
          clientName,
          matterDescription,
          feeStructure,
        });
        title = 'Engagement letter — draft';
      } else if (tool === 'demand') {
        prompt = buildDemandLetterDraftPrompt({
          jurisdiction,
          sender,
          recipient,
          facts,
          demands,
          deadlines: deadline,
        });
        title = 'Demand letter — draft';
      } else {
        prompt = buildNdaDraftPrompt({
          jurisdiction,
          disclosingParty: partyA,
          receivingParty: partyB,
          purpose,
          term,
        });
        title = 'NDA — draft';
      }

      const activeModel = await aiConfigManager.getActiveModel();
      const result = await aiService.generateText({
        prompt,
        modelId: activeModel?.id || '1',
        maxTokens: 1500,
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
            title,
            content: finalText,
            aiModel: activeModel
              ? { id: activeModel.id, name: activeModel.name, provider: activeModel.provider }
              : undefined,
            metadata: { jurisdiction, tool: `ai_letter_${tool}` },
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
      <SidebarLayout title={t('aiLetterPack.title')} description={t('aiLetterPack.description')}>
        <div className="max-w-5xl mx-auto space-y-4">
          {error ? (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
          ) : null}

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.letterType')}</label>
                <select
                  value={tool}
                  onChange={(e) => setTool(e.target.value as LetterTool)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="engagement">{t('aiLetterPack.engagement')}</option>
                  <option value="demand">{t('aiLetterPack.demandLetter')}</option>
                  <option value="nda">{t('aiLetterPack.ndaTemplate')}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">{t('aiTools.jurisdiction')}: {jurisdiction}</p>
              </div>
            </div>

            {tool === 'engagement' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.firm')}</label>
                  <input value={firmName} onChange={(e) => setFirmName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.client')}</label>
                  <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.caseDescription')}</label>
                  <textarea value={matterDescription} onChange={(e) => setMatterDescription(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.feeStructure')}</label>
                  <input value={feeStructure} onChange={(e) => setFeeStructure(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            ) : tool === 'demand' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.sender')}</label>
                  <input value={sender} onChange={(e) => setSender(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.recipient')}</label>
                  <input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.facts')}</label>
                  <textarea value={facts} onChange={(e) => setFacts(e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.demands')}</label>
                  <textarea value={demands} onChange={(e) => setDemands(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.deadline')}</label>
                  <input value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.partyA')}</label>
                  <input value={partyA} onChange={(e) => setPartyA(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.partyB')}</label>
                  <input value={partyB} onChange={(e) => setPartyB(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.purpose')}</label>
                  <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiLetterPack.term')}</label>
                  <input value={term} onChange={(e) => setTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={run}
                disabled={running}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {running ? t('aiTools.generating') : t('aiTools.generate')}
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

