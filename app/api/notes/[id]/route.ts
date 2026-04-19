import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Note from '@/models/Note';
import { requireSession, requireRole } from '@/lib/authz';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!requireRole(auth.role, ['admin', 'doctor', 'staff'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await dbConnect();
    const { id } = await params;
    const note = await Note.findById(id).lean();
    if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ note });
  } catch (error) {
    console.error('Note get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!requireRole(auth.role, ['admin', 'doctor', 'staff'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const update: any = {};
    if (body.title !== undefined) update.title = body.title ? String(body.title).trim() : '';
    if (body.content !== undefined) update.content = String(body.content).trim();
    if (body.tags !== undefined) {
      update.tags = Array.isArray(body.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : [];
    }
    if (body.scope !== undefined) update.scope = body.scope;
    update.updatedBy = String(auth.session.user.id || auth.session.user.email || '');

    const note = await Note.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
    if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ note });
  } catch (error) {
    console.error('Note update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!requireRole(auth.role, ['admin', 'doctor', 'staff'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await dbConnect();
    const { id } = await params;
    const note = await Note.findByIdAndDelete(id);
    if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Note delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

