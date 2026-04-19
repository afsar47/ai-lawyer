import { NextRequest, NextResponse } from 'next/server';
import { requireSession, requireRole } from '@/lib/authz';
import { rateLimit } from '@/lib/rate-limit';
import { writeAuditLog } from '@/lib/audit';
import { runAI } from '@/lib/ai-runner';

type RunRequest = {
  prompt: string;
  modelId?: string; // AIModel.id; if omitted, uses active model
  maxTokens?: number;
  temperature?: number;
  // optional system content for providers that support it
  system?: string;
};

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!requireRole(auth.role, ['admin', 'doctor', 'staff'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rl = rateLimit({
    key: `${auth.session.user.id || auth.session.user.email}:ai:run`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  let body: RunRequest;
  try {
    body = (await request.json()) as RunRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const prompt = String(body.prompt || '').trim();
  if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });

  try {
    const { content, model, responseTimeMs } = await runAI({
      prompt,
      modelId: body.modelId,
      maxTokens: body.maxTokens,
      temperature: body.temperature,
      system: body.system,
    });
    await writeAuditLog({
      request,
      action: 'ai.run',
      actorId: String(auth.session.user.id || ''),
      actorEmail: String(auth.session.user.email || ''),
      actorRole: auth.role,
      resourceType: 'ai_model',
      resourceId: String(model.id),
      metadata: {
        provider: model.provider,
        model: model.model,
        responseTimeMs,
      },
    });

    return NextResponse.json({
      content,
      model,
      responseTimeMs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

