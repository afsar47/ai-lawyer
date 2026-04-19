import dbConnect from '@/lib/mongodb';
import AIModel from '@/models/AIModel';

export type RunAIInput = {
  prompt: string;
  modelId?: string; // AIModel.id; if omitted, uses active model
  maxTokens?: number;
  temperature?: number;
  system?: string;
};

export type RunAIOutput = {
  content: string;
  model: { id: string; name: string; provider: string; model: string };
  responseTimeMs: number;
};

export async function runAI(input: RunAIInput): Promise<RunAIOutput> {
  const prompt = String(input.prompt || '').trim();
  if (!prompt) throw new Error('prompt is required');

  await dbConnect();
  const model =
    input.modelId
      ? await AIModel.findOne({ id: String(input.modelId) })
      : await AIModel.findOne({ isActive: true });

  if (!model) throw new Error('No active AI model configured');
  if (!model.apiKey) throw new Error('AI model is missing apiKey');

  const provider = String(model.provider || '').toLowerCase();
  const maxTokens = input.maxTokens ?? model.maxTokens ?? 1000;
  const temperature = input.temperature ?? model.temperature ?? 0.2;
  const system = input.system ? String(input.system) : undefined;

  const startedAt = Date.now();
  let content = '';

  if (provider === 'openai' || provider === 'azure openai') {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${model.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.model,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(`OpenAI API error: ${data?.error?.message || resp.statusText}`);
    }
    content = data?.choices?.[0]?.message?.content || '';
  } else if (provider === 'anthropic') {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': model.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.model,
        max_tokens: maxTokens,
        temperature,
        ...(system ? { system } : {}),
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(`Anthropic API error: ${data?.error?.message || resp.statusText}`);
    }
    content = data?.content?.[0]?.text || '';
  } else if (provider === 'google') {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model.model
      )}:generateContent?key=${encodeURIComponent(model.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: system ? `${system}\n\n${prompt}` : prompt }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      }
    );
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(`Google API error: ${data?.error?.message || resp.statusText}`);
    }
    content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else {
    throw new Error(`Unsupported provider: ${model.provider}`);
  }

  if (!content) throw new Error('No response content from AI provider');

  return {
    content,
    model: { id: model.id, name: model.name, provider: model.provider, model: model.model },
    responseTimeMs: Date.now() - startedAt,
  };
}

