import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Deadline from '@/models/Deadline';
import Case from '@/models/Case';

function requireStaffAccess(session: any) {
  const role = session?.user?.role || 'doctor';
  return ['admin', 'doctor', 'staff'].includes(role);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();

    const role = session.user.role || 'doctor';
    const userEmail = session.user.email.toLowerCase();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 500);
    const matterId = searchParams.get('matterId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const query: Record<string, any> = {};
    if (matterId) query.matterId = matterId;
    if (clientId) query.clientId = clientId;
    if (status) query.status = status;
    if (from || to) {
      query.dueDate = {};
      if (from) query.dueDate.$gte = new Date(from);
      if (to) query.dueDate.$lte = new Date(to);
    }

    // Lawyers only see deadlines for their own cases or ones they created
    if (role === 'doctor') {
      const lawyerCases = await Case.find({
        $or: [{ assignedLawyerEmail: userEmail }, { createdByEmail: userEmail }],
      }).select('_id').lean();
      const lawyerCaseIds = lawyerCases.map((c: any) => c._id.toString());

      query.$or = [
        { createdByEmail: userEmail },
        { matterId: { $in: lawyerCaseIds } },
      ];
    }

    const deadlines = await Deadline.find(query).sort({ dueDate: 1 }).limit(limit);
    return NextResponse.json(deadlines);
  } catch (error) {
    console.error('Deadlines fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const title = String(body.title || '').trim();
    const dueDateRaw = body.dueDate;

    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    if (!dueDateRaw) return NextResponse.json({ error: 'dueDate is required' }, { status: 400 });

    const dueDate = new Date(dueDateRaw);
    if (isNaN(dueDate.getTime())) return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 });

    await dbConnect();

    let matterId: string | undefined = body.matterId ? String(body.matterId) : undefined;
    let matterNumber: string | undefined;
    let clientId: string | undefined = body.clientId ? String(body.clientId) : undefined;
    let clientName: string | undefined = body.clientName ? String(body.clientName).trim() : undefined;

    if (matterId) {
      const matter = await Case.findById(matterId);
      if (matter) {
        matterNumber = matter.caseNumber;
        clientId = matter.clientId;
        clientName = matter.clientName;
      }
    }

    // Basic conflict detection: same matter + same title + same date (ignore cancelled)
    if (matterId) {
      const existing = await Deadline.findOne({
        matterId,
        title,
        dueDate,
        status: { $ne: 'cancelled' },
      }).lean();
      if (existing) {
        return NextResponse.json(
          { error: 'Scheduling conflict: a deadline with the same title already exists for this matter on the same date.', conflictDeadlineId: existing._id },
          { status: 409 }
        );
      }
    }

    const reminderDaysBefore: number[] | undefined = Array.isArray(body.reminderDaysBefore)
      ? body.reminderDaysBefore.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n) && n >= 0)
      : undefined;

    const doc = new Deadline({
      title,
      type: body.type || 'deadline',
      status: body.status || 'upcoming',
      dueDate,
      matterId,
      matterNumber,
      clientId,
      clientName,
      notes: body.notes ? String(body.notes).trim() : undefined,
      reminderDaysBefore,
      createdByEmail: session.user.email?.toLowerCase(),
    });

    await doc.save();
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('Deadline creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

