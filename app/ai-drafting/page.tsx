'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useSession } from 'next-auth/react';
import { aiConfigManager } from '../../lib/ai-config';
import { aiService } from '../../lib/ai-service';
import { useSettings } from '../contexts/SettingsContext';
import { ensureLegalDisclaimer, type Jurisdiction } from '../../lib/legal/prompt';
import {
  buildClientIntakeSummaryPrompt,
  buildContractReviewPrompt,
  buildDemandLetterDraftPrompt,
  buildEngagementLetterDraftPrompt,
  buildNdaDraftPrompt,
} from '../../lib/legal/tools';
import CaseSearchSelect, { CaseOption } from '../components/CaseSearchSelect';
import { useTranslations } from '../hooks/useTranslations';

type ToolId = 'engagement' | 'demand' | 'nda' | 'intake' | 'review';

type ClientRow = { _id: string; clientNumber: string; name: string };

export default function AIDraftingPage() {
  const { t } = useTranslations();
  const { data: session } = useSession();
  const { settings } = useSettings();
  const jurisdiction = (settings?.jurisdiction || 'global_generic') as Jurisdiction;

  const [tool, setTool] = useState<ToolId>('engagement');
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [matterId, setMatterId] = useState('');
  const [selectedMatter, setSelectedMatter] = useState<CaseOption | null>(null);
  const [clientId, setClientId] = useState('');
  const [saveSharedWithClient, setSaveSharedWithClient] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({
    firmName: '',
    clientName: '',
    matterDescription: '',
    feeStructure: '',
    sender: '',
    recipient: '',
    facts: '',
    demands: '',
    deadline: '',
    disclosingParty: '',
    receivingParty: '',
    purpose: '',
    term: '',
    intakeNotes: '',
    contractText: '',
  });

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('');
  const [savingDoc, setSavingDoc] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const cRes = await fetch('/api/clients?limit=200');
        if (cRes.ok) setClients(await cRes.json());
      } finally {
        setLoadingRefs(false);
      }
    };
    load();
  }, []);

  const handleCaseChange = (id: string, caseData: CaseOption | null) => {
    setMatterId(id);
    setSelectedMatter(caseData);
  };

  const selectedClient = useMemo(() => clients.find((c) => c._id === clientId) || null, [clients, clientId]);

  const onChange = (name: string, value: string) => setForm((p) => ({ ...p, [name]: value }));

  const buildPrompt = (): { title: string; type: string; prompt: string } => {
    switch (tool) {
      case 'engagement':
        return {
          title: 'Engagement letter draft',
          type: 'engagement',
          prompt: buildEngagementLetterDraftPrompt({
            jurisdiction,
            firmName: form.firmName,
            clientName: form.clientName || selectedClient?.name || selectedMatter?.clientName,
            matterDescription: form.matterDescription || selectedMatter?.title,
            feeStructure: form.feeStructure,
          }),
        };
      case 'demand':
        return {
          title: 'Demand letter draft',
          type: 'other',
          prompt: buildDemandLetterDraftPrompt({
            jurisdiction,
            sender: form.sender || form.firmName,
            recipient: form.recipient,
            facts: form.facts,
            demands: form.demands,
            deadlines: form.deadline,
          }),
        };
      case 'nda':
        return {
          title: 'NDA draft',
          type: 'contract',
          prompt: buildNdaDraftPrompt({
            jurisdiction,
            disclosingParty: form.disclosingParty,
            receivingParty: form.receivingParty,
            purpose: form.purpose,
            term: form.term,
          }),
        };
      case 'intake':
        return {
          title: 'Client intake summary',
          type: 'case_note',
          prompt: buildClientIntakeSummaryPrompt({
            jurisdiction,
            intakeNotes: form.intakeNotes,
          }),
        };
      case 'review':
      default:
        return {
          title: 'Contract review',
          type: 'contract',
          prompt: buildContractReviewPrompt({
            jurisdiction,
            contractText: form.contractText,
            context: selectedMatter ? `${selectedMatter.caseNumber}: ${selectedMatter.title}` : undefined,
          }),
        };
    }
  };

  const run = async () => {
    setError(null);
    setOutput('');
    setRunning(true);
    try {
      if (!selectedMatter && !selectedClient) {
        throw new Error('Please select a matter (preferred) or a client before running this tool.');
      }

      const activeModel = await aiConfigManager.getActiveModel();
      const { prompt, title } = buildPrompt();
      const result = await aiService.generateText({
        prompt,
        modelId: activeModel?.id || '1',
        maxTokens: 1200,
        temperature: 0.4,
      });

      if (!result.success || !result.content) {
        throw new Error(result.error || 'AI request failed');
      }

      const finalText = ensureLegalDisclaimer(result.content, jurisdiction);
      setOutput(finalText);

      // Persist result for audit/history
      try {
        const type =
          tool === 'review' ? 'legal-review' : tool === 'intake' ? 'legal-intake-summary' : 'legal-draft';
        const userId = String(session?.user?.id || session?.user?.email || 'unknown');

        await fetch('/api/ai-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type,
            title,
            content: finalText,
            aiModel: activeModel
              ? { id: activeModel.id, name: activeModel.name, provider: activeModel.provider }
              : undefined,
            metadata: {
              jurisdiction,
              tool,
              matterId: selectedMatter?._id,
              clientId: selectedClient?._id,
            },
          }),
        });
      } catch {
        // Non-blocking
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to run tool');
    } finally {
      setRunning(false);
    }
  };

  const saveAsDocument = async () => {
    if (!output.trim()) return;
    setSavingDoc(true);
    setError(null);
    try {
      const { title, type } = buildPrompt();
      const payload: any = {
        title,
        type,
        status: 'draft',
        sharedWithClient: saveSharedWithClient,
        content: output,
      };

      if (selectedMatter) payload.matterId = selectedMatter._id;
      else if (selectedClient) payload.clientId = selectedClient._id;

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save document');

      window.location.href = `/documents/${data._id}`;
    } catch (e: any) {
      setError(e?.message || 'Failed to save document');
    } finally {
      setSavingDoc(false);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout title={t('aiDrafting.title')} description={t('aiDrafting.description')}>
        <div className="max-w-5xl mx-auto space-y-6">
          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
          )}

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            {t('aiDrafting.disclaimer')}
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiDrafting.tool')}</label>
                <select
                  value={tool}
                  onChange={(e) => setTool(e.target.value as ToolId)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="engagement">{t('aiDrafting.engagementLetter')}</option>
                  <option value="demand">{t('aiDrafting.demandLetter')}</option>
                  <option value="nda">{t('aiDrafting.ndaTemplate')}</option>
                  <option value="intake">{t('aiDrafting.clientIntakeSummary')}</option>
                  <option value="review">{t('aiDrafting.contractReview')}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">{t('aiDrafting.jurisdiction')}: {jurisdiction}</p>
              </div>

              <CaseSearchSelect
                label={t('aiDrafting.caseOptional')}
                value={matterId}
                onChange={handleCaseChange}
                placeholder={t('aiDrafting.searchCases')}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiDrafting.clientOptional')}</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={loadingRefs || Boolean(matterId)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                >
                  <option value="">{t('aiDrafting.selectClient')}</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.clientNumber})
                    </option>
                  ))}
                </select>
                {matterId && <p className="text-xs text-gray-500 mt-1">{t('aiDrafting.clientSetFromMatter')}</p>}
              </div>
            </div>

            {(tool === 'engagement' || tool === 'demand') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firm name</label>
                  <input
                    value={form.firmName}
                    onChange={(e) => onChange('firmName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {tool === 'engagement' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee structure</label>
                    <input
                      value={form.feeStructure}
                      onChange={(e) => onChange('feeStructure', e.target.value)}
                      placeholder="e.g., $5,000 retainer billed hourly"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
                {tool === 'demand' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                      <input
                        value={form.recipient}
                        onChange={(e) => onChange('recipient', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                      <input
                        value={form.deadline}
                        onChange={(e) => onChange('deadline', e.target.value)}
                        placeholder="e.g., 10 business days from receipt"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {tool === 'engagement' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client name</label>
                  <input
                    value={form.clientName}
                    onChange={(e) => onChange('clientName', e.target.value)}
                    placeholder={selectedClient?.name || selectedMatter?.clientName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Case description</label>
                  <input
                    value={form.matterDescription}
                    onChange={(e) => onChange('matterDescription', e.target.value)}
                    placeholder={selectedMatter?.title || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {tool === 'demand' && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facts</label>
                  <textarea
                    value={form.facts}
                    onChange={(e) => onChange('facts', e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Demands</label>
                  <textarea
                    value={form.demands}
                    onChange={(e) => onChange('demands', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {tool === 'nda' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Party A</label>
                  <input
                    value={form.disclosingParty}
                    onChange={(e) => onChange('disclosingParty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Party B</label>
                  <input
                    value={form.receivingParty}
                    onChange={(e) => onChange('receivingParty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <input
                    value={form.purpose}
                    onChange={(e) => onChange('purpose', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <input
                    value={form.term}
                    onChange={(e) => onChange('term', e.target.value)}
                    placeholder="e.g., 2 years"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {tool === 'intake' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intake notes</label>
                <textarea
                  value={form.intakeNotes}
                  onChange={(e) => onChange('intakeNotes', e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {tool === 'review' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract/document text</label>
                <textarea
                  value={form.contractText}
                  onChange={(e) => onChange('contractText', e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <input
                  id="saveShared"
                  type="checkbox"
                  checked={saveSharedWithClient}
                  onChange={(e) => setSaveSharedWithClient(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="saveShared" className="text-sm text-gray-700">
                  {t('aiDrafting.ifSavingShareWithClient')}
                </label>
              </div>

              <button
                type="button"
                disabled={running}
                onClick={run}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {running ? t('aiDrafting.running') : t('aiDrafting.run')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">{t('aiDrafting.output')}</h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={!output.trim() || savingDoc}
                  onClick={saveAsDocument}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {savingDoc ? t('aiDrafting.saving') : t('aiDrafting.saveAsDocument')}
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              rows={16}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              placeholder={t('aiDrafting.outputPlaceholder')}
            />
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

