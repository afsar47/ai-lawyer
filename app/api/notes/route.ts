import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Note from '@/models/Note';
import { requireSession, requireRole } from '@/lib/authz';

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!requireRole(auth.role, ['admin', 'doctor', 'staff'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get('scope') || '').trim();
    const clientId = (searchParams.get('clientId') || '').trim();
    const caseId = (searchParams.get('caseId') || searchParams.get('matterId') || '').trim();
    const hearingId = (searchParams.get('hearingId') || '').trim();
    const deadlineId = (searchParams.get('deadlineId') || '').trim();
    const q = (searchParams.get('q') || '').trim();

    const query: any = {};
    if (scope) query.scope = scope;
    if (clientId) query.clientId = clientId;
    if (caseId) query.caseId = caseId;
    if (hearingId) query.hearingId = hearingId;
    if (deadlineId) query.deadlineId = deadlineId;
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: rx }, { content: rx }, { tags: rx }];
    }

    const notes = await Note.find(query).sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Notes fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!requireRole(auth.role, ['admin', 'doctor', 'staff'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await request.json();

    const content = String(body.content || '').trim();
    if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 });

    const note = await Note.create({
      scope: body.scope || 'general',
      clientId: body.clientId ? String(body.clientId).trim() : undefined,
      caseId: body.caseId ? String(body.caseId).trim() : body.matterId ? String(body.matterId).trim() : undefined,
      hearingId: body.hearingId ? String(body.hearingId).trim() : undefined,
      deadlineId: body.deadlineId ? String(body.deadlineId).trim() : undefined,
      title: body.title ? String(body.title).trim() : undefined,
      content,
      tags: Array.isArray(body.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : [],
      createdBy: String(auth.session.user.id || auth.session.user.email || ''),
      updatedBy: String(auth.session.user.id || auth.session.user.email || ''),
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Note create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

