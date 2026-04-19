import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Case from '@/models/Case';
import Client from '@/models/Client';
import { writeAuditLog } from '@/lib/audit';

function parseNextCaseNumber(lastCaseNumber?: string | null): string {
  if (!lastCaseNumber) return 'CASE-0001';
  const match = lastCaseNumber.match(/^CASE-(\d+)$/);
  const next = match ? parseInt(match[1], 10) + 1 : 1;
  return `CASE-${next.toString().padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role || 'doctor';
    if (!['admin', 'doctor', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const q = (searchParams.get('q') || '').trim();
    const status = (searchParams.get('status') || '').trim();
    const assignedLawyerEmail = (searchParams.get('assignedLawyerEmail') || '').trim().toLowerCase();
    const practiceArea = (searchParams.get('practiceArea') || '').trim();
    const pageRaw = searchParams.get('page');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200);
    const sortBy = (searchParams.get('sortBy') || '').trim();
    const sortDir = (searchParams.get('sortDir') || 'desc').trim().toLowerCase() === 'asc' ? 1 : -1;

    const query: Record<string, any> = {};
    if (clientId) query.clientId = clientId;
    if (status && ['lead', 'open', 'closed'].includes(status)) query.status = status;
    if (practiceArea) query.practiceArea = { $regex: practiceArea.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (assignedLawyerEmail) query.assignedLawyerEmail = assignedLawyerEmail;
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { caseNumber: rx },
        { title: rx },
        { clientName: rx },
        { practiceArea: rx },
        { assignedLawyerName: rx },
        { assignedLawyerEmail: rx },
      ];
    }

    // Non-admin users see only their cases
    if (role === 'doctor') {
      // If $or already exists from search, merge it under $and
      const ownFilter = {
        $or: [{ assignedLawyerEmail: session.user.email }, { createdByEmail: session.user.email }],
      };
      if (query.$or) {
        query.$and = [{ $or: query.$or }, ownFilter];
        delete query.$or;
      } else {
        Object.assign(query, ownFilter);
      }
    }

    const sort: Record<string, any> = {};
    if (sortBy === 'caseNumber') sort.caseNumber = sortDir;
    else if (sortBy === 'title') sort.title = sortDir;
    else sort.createdAt = -1;

    const page = pageRaw ? Math.max(parseInt(pageRaw, 10) || 1, 1) : null;
    if (page) {
      const total = await Case.countDocuments(query);
      const skip = (page - 1) * limit;
      const cases = await Case.find(query).sort(sort).skip(skip).limit(limit).lean();
      return NextResponse.json({ data: cases, total, page, limit });
    }

    const cases = await Case.find(query).sort(sort);
    return NextResponse.json(cases);
  } catch (error) {
    console.error('Cases fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role || 'doctor';
    if (!['admin', 'doctor', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    await dbConnect();

    const clientId = String(body.clientId || '');
    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const lastCase = await Case.findOne({}, { caseNumber: 1 }).sort({ caseNumber: -1 });
    const caseNumber = parseNextCaseNumber(lastCase?.caseNumber);

    const assignedLawyerEmail =
      role === 'admin' && body.assignedLawyerEmail
        ? String(body.assignedLawyerEmail).toLowerCase()
        : session.user.email?.toLowerCase();

    const assignedLawyerName =
      role === 'admin' && body.assignedLawyerName ? String(body.assignedLawyerName) : session.user.name;

    const newCase = new Case({
      caseNumber,
      title: String(body.title || '').trim(),
      description: body.description ? String(body.description).trim() : undefined,
      status: (body.status as any) || 'open',
      stage:
        body.stage && ['intake', 'active', 'litigation', 'settlement', 'closed'].includes(String(body.stage))
          ? String(body.stage)
          : undefined,
      priority: (body.priority as any) || 'medium',
      practiceArea: body.practiceArea ? String(body.practiceArea).trim() : undefined,
      clientId: client._id.toString(),
      clientName: client.name,
      clientEmail: (client.email || '').toString(),
      openedAt: (body.status || 'open') === 'open' ? new Date() : undefined,
      closedAt: (body.status || 'open') === 'closed' ? new Date() : undefined,
      closedReason: body.closedReason ? String(body.closedReason).trim() : undefined,
      jurisdiction: body.jurisdiction ? String(body.jurisdiction).trim() : undefined,
      courtName: body.courtName ? String(body.courtName).trim() : undefined,
      docketNumber: body.docketNumber ? String(body.docketNumber).trim() : undefined,
      opposingCounsel: body.opposingCounsel ? String(body.opposingCounsel).trim() : undefined,
      opposingParties: Array.isArray(body.opposingParties)
        ? body.opposingParties.map((p: any) => String(p).trim()).filter(Boolean)
        : [],
      conflictCheckStatus:
        body.conflictCheckStatus && ['pending', 'cleared', 'conflict'].includes(String(body.conflictCheckStatus))
          ? String(body.conflictCheckStatus)
          : undefined,
      conflictCheckDate: body.conflictCheckDate ? new Date(body.conflictCheckDate) : undefined,
      conflictCheckNotes: body.conflictCheckNotes ? String(body.conflictCheckNotes).trim() : undefined,
      assignedLawyerEmail,
      assignedLawyerName,
      createdByEmail: session.user.email?.toLowerCase(),
      tags: Array.isArray(body.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : [],
    });

    if (!newCase.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    // Align stage with status if not provided
    if (!newCase.stage) {
      newCase.stage = newCase.status === 'lead' ? 'intake' : newCase.status === 'closed' ? 'closed' : 'active';
    }

    await newCase.save();
    await writeAuditLog({
      request,
      action: 'case.create',
      actorId: String((session.user as any)?.id || ''),
      actorEmail: String(session.user.email || ''),
      actorRole: String(role),
      resourceType: 'case',
      resourceId: String(newCase._id),
      message: `Created matter ${newCase.caseNumber}`,
      metadata: {
        caseNumber: newCase.caseNumber,
        clientId: newCase.clientId,
        clientName: newCase.clientName,
        status: newCase.status,
        stage: newCase.stage,
      },
    });
    return NextResponse.json(newCase, { status: 201 });
  } catch (error: any) {
    console.error('Case creation error:', error);
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Duplicate caseNumber. Please try again.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

