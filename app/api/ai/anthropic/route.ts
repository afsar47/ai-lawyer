import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AIModel from '@/models/AIModel';
import { requireSession, requireRole } from '@/lib/authz';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!requireRole(auth.role, ['admin', 'doctor', 'staff'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rl = rateLimit({
    key: `${auth.session.user.id || auth.session.user.email}:ai:anthropic`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const { prompt, model, maxTokens, temperature } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const active = await AIModel.findOne({ isActive: true });
    if (!active?.apiKey) {
      return NextResponse.json({ error: 'No active AI model configured' }, { status: 400 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': active.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || active.model || 'claude-3-sonnet-20240229',
        max_tokens: maxTokens || 1000,
        temperature: temperature || 0.2,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: `Anthropic API error: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return NextResponse.json(
        { error: 'No response content from Anthropic' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content,
      model: data.model,
      usage: data.usage,
      stop_reason: data.stop_reason
    });

  } catch (error) {
    console.error('Anthropic API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
