import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';

function requireStaffAccess(session: any) {
  const role = session?.user?.role || 'doctor';
  return ['admin', 'doctor', 'staff'].includes(role);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!requireStaffAccess(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200);
    const pageRaw = searchParams.get('page');
    const type = (searchParams.get('type') || '').trim();
    const sortBy = (searchParams.get('sortBy') || '').trim();
    const sortDir = (searchParams.get('sortDir') || 'desc').trim().toLowerCase() === 'asc' ? 1 : -1;

    const query: Record<string, any> = {};
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: rx },
        { email: rx },
        { phone: rx },
        { clientNumber: rx },
      ];
    }
    if (type === 'individual' || type === 'organization') {
      query.type = type;
    }

    // Lawyers only see clients associated with their cases
    const role = session.user.role || 'doctor';
    const userEmail = (session.user.email || '').toLowerCase();

    if (role === 'doctor') {
      const Case = (await import('@/models/Case')).default;
      const lawyerCases = await Case.find({
        $or: [{ assignedLawyerEmail: userEmail }, { createdByEmail: userEmail }],
      }).select('clientId').lean();
      const clientIds = [...new Set(lawyerCases.map((c: any) => c.clientId).filter(Boolean))];

      const ownershipFilter = { _id: { $in: clientIds } };

      if (query.$or) {
        query.$and = [{ $or: query.$or }, ownershipFilter];
        delete query.$or;
      } else {
        Object.assign(query, ownershipFilter);
      }
    }

    const sort: Record<string, any> = {};
    if (sortBy === 'name') sort.name = sortDir;
    else if (sortBy === 'clientNumber') sort.clientNumber = sortDir;
    else sort.createdAt = -1;

    // Backward compatible:
    // - Without `page`, return array (used by selects, etc.)
    // - With `page`, return { data, total, page, limit }
    const page = pageRaw ? Math.max(parseInt(pageRaw, 10) || 1, 1) : null;
    if (page) {
      const total = await Client.countDocuments(query);
      const skip = (page - 1) * limit;
      const clients = await Client.find(query).sort(sort).skip(skip).limit(limit).lean();
      return NextResponse.json({ data: clients, total, page, limit });
    }

    const clients = await Client.find(query).sort(sort).limit(limit);
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Clients fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!requireStaffAccess(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    await dbConnect();

    const doc = new Client({
      type: body.type === 'organization' ? 'organization' : 'individual',
      name,
      email: body.email ? String(body.email).trim().toLowerCase() : undefined,
      phone: body.phone ? String(body.phone).trim() : undefined,
      address: body.address ? String(body.address).trim() : undefined,
      identifiers: Array.isArray(body.identifiers)
        ? body.identifiers
            .map((i: any) => ({
              label: String(i?.label || '').trim(),
              value: String(i?.value || '').trim(),
            }))
            .filter((i: any) => i.label && i.value)
        : [],
      notes: body.notes ? String(body.notes).trim() : undefined,
      conflictCheckNotes: body.conflictCheckNotes ? String(body.conflictCheckNotes).trim() : undefined,
    });

    await doc.save();
    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    console.error('Client creation error:', error);
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Duplicate clientNumber. Please try again.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

