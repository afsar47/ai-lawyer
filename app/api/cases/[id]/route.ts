import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Case from '@/models/Case';
import { writeAuditLog } from '@/lib/audit';

async function canAccessCase(caseDoc: any, session: any): Promise<boolean> {
  const role = session?.user?.role || 'doctor';
  if (role === 'admin' || role === 'staff') return true;
  if (role === 'doctor') {
    const email = (session?.user?.email || '').toLowerCase();
    return (
      (caseDoc.assignedLawyerEmail || '').toLowerCase() === email ||
      (caseDoc.createdByEmail || '').toLowerCase() === email
    );
  }
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const caseDoc = await Case.findById(id);

    if (!caseDoc) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (!(await canAccessCase(caseDoc, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(caseDoc);
  } catch (error) {
    console.error('Case fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const existing = await Case.findById(id);
    if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

    if (!(await canAccessCase(existing, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const set: Record<string, any> = {};
    const unset: Record<string, any> = {};
    if (body.title !== undefined) set.title = String(body.title).trim();
    if (body.description !== undefined) set.description = String(body.description).trim();
    if (body.priority !== undefined) set.priority = body.priority;
    if (body.practiceArea !== undefined) set.practiceArea = String(body.practiceArea).trim();
    if (Array.isArray(body.tags)) set.tags = body.tags.map((t: any) => String(t).trim()).filter(Boolean);

    if (body.stage !== undefined) {
      const stage = String(body.stage).trim();
      if (['intake', 'active', 'litigation', 'settlement', 'closed'].includes(stage)) set.stage = stage;
    }

    if (body.jurisdiction !== undefined) set.jurisdiction = body.jurisdiction ? String(body.jurisdiction).trim() : '';
    if (body.courtName !== undefined) set.courtName = body.courtName ? String(body.courtName).trim() : '';
    if (body.docketNumber !== undefined) set.docketNumber = body.docketNumber ? String(body.docketNumber).trim() : '';
    if (body.opposingCounsel !== undefined) set.opposingCounsel = body.opposingCounsel ? String(body.opposingCounsel).trim() : '';
    if (Array.isArray(body.opposingParties)) {
      set.opposingParties = body.opposingParties.map((p: any) => String(p).trim()).filter(Boolean);
    }

    if (body.conflictCheckStatus !== undefined) {
      const c = String(body.conflictCheckStatus).trim();
      if (['pending', 'cleared', 'conflict'].includes(c)) set.conflictCheckStatus = c;
    }
    if (body.conflictCheckDate !== undefined) {
      if (!body.conflictCheckDate) unset.conflictCheckDate = 1;
      else set.conflictCheckDate = new Date(body.conflictCheckDate);
    }
    if (body.conflictCheckNotes !== undefined) set.conflictCheckNotes = body.conflictCheckNotes ? String(body.conflictCheckNotes).trim() : '';
    if (body.closedReason !== undefined) set.closedReason = body.closedReason ? String(body.closedReason).trim() : '';

    if (body.status !== undefined) {
      const nextStatus = body.status;
      set.status = nextStatus;

      if (nextStatus === 'open' && existing.status !== 'open') {
        if (!existing.openedAt) set.openedAt = new Date();
        unset.closedAt = 1;
        if (body.stage === undefined) set.stage = 'active';
      }
      if (nextStatus === 'closed' && existing.status !== 'closed') {
        set.closedAt = new Date();
        if (body.stage === undefined) set.stage = 'closed';
      }
      if (nextStatus === 'lead' && existing.status !== 'lead') {
        if (body.stage === undefined) set.stage = 'intake';
      }
    }

    // Only admin can reassign cases
    if (role === 'admin') {
      if (body.assignedLawyerEmail !== undefined) {
        set.assignedLawyerEmail = String(body.assignedLawyerEmail).toLowerCase();
      }
      if (body.assignedLawyerName !== undefined) {
        set.assignedLawyerName = String(body.assignedLawyerName);
      }
    }

    const op: any = {};
    if (Object.keys(set).length) op.$set = set;
    if (Object.keys(unset).length) op.$unset = unset;
    const updated = await Case.findByIdAndUpdate(id, op, { new: true, runValidators: true });
    await writeAuditLog({
      request,
      action: 'case.update',
      actorId: String((session.user as any)?.id || ''),
      actorEmail: String(session.user.email || ''),
      actorRole: String(role),
      resourceType: 'case',
      resourceId: String(existing._id),
      message: `Updated matter ${existing.caseNumber}`,
      metadata: { set, unset },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Case update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const existing = await Case.findById(id);
    if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

    if (!(await canAccessCase(existing, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await writeAuditLog({
      request,
      action: 'case.delete',
      actorId: String((session.user as any)?.id || ''),
      actorEmail: String(session.user.email || ''),
      actorRole: String(role),
      resourceType: 'case',
      resourceId: String(existing._id),
      message: `Deleted matter ${existing.caseNumber}`,
      metadata: { caseNumber: existing.caseNumber, clientId: existing.clientId, status: existing.status, stage: existing.stage },
    });

    await Case.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Case deleted successfully' });
  } catch (error) {
    console.error('Case deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

