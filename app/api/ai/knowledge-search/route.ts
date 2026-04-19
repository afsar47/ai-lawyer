import { NextRequest, NextResponse } from 'next/server';
import { requireSession, requireRole } from '@/lib/authz';
import { rateLimit } from '@/lib/rate-limit';
import dbConnect from '@/lib/mongodb';
import Document from '@/models/Document';
import Note from '@/models/Note';
import { runAI } from '@/lib/ai-runner';

function snippetAround(text: string, query: string, maxLen = 600) {
  const t = String(text || '');
  const q = String(query || '').trim();
  if (!t) return '';
  if (!q) return t.slice(0, maxLen);

  const idx = t.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return t.slice(0, maxLen);
  const start = Math.max(idx - Math.floor(maxLen / 3), 0);
  const end = Math.min(start + maxLen, t.length);
  return (start > 0 ? '…' : '') + t.slice(start, end) + (end < t.length ? '…' : '');
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!requireRole(auth.role, ['admin', 'doctor', 'staff'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rl = rateLimit({
    key: `${auth.session.user.id || auth.session.user.email}:ai:knowledge_search`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const query = String(body.query || '').trim();
  const matterId = body.matterId ? String(body.matterId).trim() : '';
  if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 });

  await dbConnect();

  const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const docQuery: any = matterId ? { matterId } : {};
  docQuery.$or = [{ title: rx }, { content: rx }];

  const noteQuery: any = matterId ? { caseId: matterId } : {};
  noteQuery.$or = [{ title: rx }, { content: rx }, { tags: rx }];

  const [docs, notes] = await Promise.all([
    Document.find(docQuery).sort({ updatedAt: -1 }).limit(5).lean(),
    Note.find(noteQuery).sort({ updatedAt: -1 }).limit(5).lean(),
  ]);

  const sources: Array<{ kind: 'document' | 'note'; id: string; label: string; excerpt: string }> = [];
  for (const d of docs) {
    sources.push({
      kind: 'document',
      id: String((d as any)._id),
      label: `DOC:${(d as any).documentNumber || (d as any)._id} — ${(d as any).title || ''}`.trim(),
      excerpt: snippetAround(String((d as any).content || ''), query),
    });
  }
  for (const n of notes) {
    sources.push({
      kind: 'note',
      id: String((n as any)._id),
      label: `NOTE:${(n as any)._id} — ${(n as any).title || 'Note'}`.trim(),
      excerpt: snippetAround(String((n as any).content || ''), query),
    });
  }

  const context = sources
    .map((s) => `### ${s.label}\n${s.excerpt || '—'}`)
    .join('\n\n');

  const prompt = [
    `You are an internal legal knowledge assistant.`,
    `Answer the user's question using ONLY the provided sources.`,
    `If the sources are insufficient, say what is missing.`,
    `Cite sources inline using [DOC:...] or [NOTE:...] labels exactly as provided.`,
    ``,
    `User question: ${query}`,
    ``,
    `Sources:`,
    context || '(no sources found)',
  ].join('\n');

  const ai = await runAI({ prompt, maxTokens: 900, temperature: 0.2 });

  return NextResponse.json({
    answer: ai.content,
    sources: sources.map((s) => ({ ...s, excerpt: s.excerpt })),
    model: ai.model,
    responseTimeMs: ai.responseTimeMs,
  });
}

