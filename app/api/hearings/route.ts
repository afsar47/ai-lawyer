import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Hearing from '@/models/Hearing';
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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 500);
    const caseId = searchParams.get('caseId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const courtName = searchParams.get('courtName');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const query: Record<string, any> = {};
    if (caseId) query.caseId = caseId;
    if (clientId) query.clientId = clientId;
    if (status) query.status = status;
    if (courtName) query.courtName = { $regex: courtName, $options: 'i' };
    if (from || to) {
      query.hearingDate = {};
      if (from) query.hearingDate.$gte = new Date(from);
      if (to) query.hearingDate.$lte = new Date(to);
    }

    // Lawyers only see hearings for their own cases or ones they created
    const role = session.user.role || 'doctor';
    const userEmail = (session.user.email || '').toLowerCase();

    if (role === 'doctor') {
      const lawyerCases = await Case.find({
        $or: [{ assignedLawyerEmail: userEmail }, { createdByEmail: userEmail }],
      }).select('_id').lean();
      const lawyerCaseIds = lawyerCases.map((c: any) => c._id.toString());

      query.$or = [
        { createdByEmail: userEmail },
        { caseId: { $in: lawyerCaseIds } },
      ];
    }

    const hearings = await Hearing.find(query).sort({ hearingDate: 1, hearingTime: 1 }).limit(limit);
    return NextResponse.json(hearings);
  } catch (error) {
    console.error('Hearings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const hearingType = String(body.hearingType || '').trim();
    const hearingDateRaw = body.hearingDate;
    const hearingTime = String(body.hearingTime || '').trim();
    const courtName = String(body.courtName || '').trim();

    if (!hearingType) return NextResponse.json({ error: 'hearingType is required' }, { status: 400 });
    if (!hearingDateRaw) return NextResponse.json({ error: 'hearingDate is required' }, { status: 400 });
    if (!hearingTime) return NextResponse.json({ error: 'hearingTime is required' }, { status: 400 });
    if (!courtName) return NextResponse.json({ error: 'courtName is required' }, { status: 400 });

    const hearingDate = new Date(hearingDateRaw);
    if (isNaN(hearingDate.getTime())) return NextResponse.json({ error: 'Invalid hearingDate' }, { status: 400 });

    await dbConnect();

    let caseId: string | undefined = body.caseId ? String(body.caseId) : undefined;
    let caseNumber: string | undefined;
    let clientId: string | undefined = body.clientId ? String(body.clientId) : undefined;
    let clientName: string | undefined = body.clientName ? String(body.clientName).trim() : undefined;

    if (caseId) {
      const matter = await Case.findById(caseId);
      if (matter) {
        caseNumber = matter.caseNumber;
        clientId = matter.clientId;
        clientName = matter.clientName;
      }
    }

    // Basic conflict detection: same matter + same date/time (ignore cancelled/adjourned)
    if (caseId) {
      const existing = await Hearing.findOne({
        caseId,
        hearingDate,
        hearingTime,
        status: { $nin: ['cancelled', 'adjourned'] },
      }).lean();
      if (existing) {
        return NextResponse.json(
          {
            error: 'Scheduling conflict: another hearing is already scheduled for this matter at the same date/time.',
            conflictHearingId: existing._id,
          },
          { status: 409 }
        );
      }
    }

    const reminderDaysBefore: number[] | undefined = Array.isArray(body.reminderDaysBefore)
      ? body.reminderDaysBefore.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n) && n >= 0)
      : undefined;

    const doc = new Hearing({
      hearingType,
      hearingDate,
      hearingTime,
      duration: body.duration ? Number(body.duration) : undefined,
      courtName,
      courtAddress: body.courtAddress
        ? {
            street: body.courtAddress.street ? String(body.courtAddress.street).trim() : undefined,
            city: body.courtAddress.city ? String(body.courtAddress.city).trim() : undefined,
            state: body.courtAddress.state ? String(body.courtAddress.state).trim() : undefined,
            zip: body.courtAddress.zip ? String(body.courtAddress.zip).trim() : undefined,
          }
        : undefined,
      courtroom: body.courtroom ? String(body.courtroom).trim() : undefined,
      judgeName: body.judgeName ? String(body.judgeName).trim() : undefined,
      docketNumber: body.docketNumber ? String(body.docketNumber).trim() : undefined,
      caseId,
      caseNumber,
      clientId,
      clientName,
      opposingCounsel: body.opposingCounsel ? String(body.opposingCounsel).trim() : undefined,
      status: body.status || 'scheduled',
      notes: body.notes ? String(body.notes).trim() : undefined,
      reminderDaysBefore,
      createdByEmail: session.user.email?.toLowerCase(),
    });

    await doc.save();
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('Hearing creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
