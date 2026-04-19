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
    key: `${auth.session.user.id || auth.session.user.email}:ai:google`,
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

    const chosenModel = model || active.model || 'gemini-pro';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(chosenModel)}:generateContent?key=${encodeURIComponent(active.apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: String(prompt)
              }
            ]
          }
        ],
        generationConfig: {
          temperature: temperature || 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: maxTokens || 1000,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: `Google API error: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return NextResponse.json(
        { error: 'No response content from Google' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content,
      model: chosenModel,
      usageMetadata: data.usageMetadata,
      finishReason: data.candidates?.[0]?.finishReason
    });

  } catch (error) {
    console.error('Google API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
