import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Contact from '@/models/Contact';
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
    const clientId = (searchParams.get('clientId') || '').trim();
    const q = (searchParams.get('q') || '').trim();

    const query: any = {};
    if (clientId) query.clientId = clientId;
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: rx }, { email: rx }, { phone: rx }, { title: rx }, { relationship: rx }];
    }

    const contacts = await Contact.find(query).sort({ isPrimary: -1, createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Contacts fetch error:', error);
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

    const clientId = String(body.clientId || '').trim();
    const name = String(body.name || '').trim();
    if (!clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const contact = await Contact.create({
      clientId,
      name,
      email: body.email ? String(body.email).trim().toLowerCase() : undefined,
      phone: body.phone ? String(body.phone).trim() : undefined,
      title: body.title ? String(body.title).trim() : undefined,
      relationship: body.relationship ? String(body.relationship).trim() : undefined,
      isPrimary: Boolean(body.isPrimary),
      notes: body.notes ? String(body.notes).trim() : undefined,
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error('Contact create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

