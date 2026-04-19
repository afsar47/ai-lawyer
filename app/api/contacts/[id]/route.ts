import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Contact from '@/models/Contact';
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
    const contact = await Contact.findById(id).lean();
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Contact get error:', error);
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
    if (body.name !== undefined) update.name = String(body.name).trim();
    if (body.email !== undefined) update.email = body.email ? String(body.email).trim().toLowerCase() : '';
    if (body.phone !== undefined) update.phone = body.phone ? String(body.phone).trim() : '';
    if (body.title !== undefined) update.title = body.title ? String(body.title).trim() : '';
    if (body.relationship !== undefined) update.relationship = body.relationship ? String(body.relationship).trim() : '';
    if (body.isPrimary !== undefined) update.isPrimary = Boolean(body.isPrimary);
    if (body.notes !== undefined) update.notes = body.notes ? String(body.notes).trim() : '';

    const contact = await Contact.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Contact update error:', error);
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
    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

