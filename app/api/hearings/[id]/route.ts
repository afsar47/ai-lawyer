import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Hearing from '@/models/Hearing';
import Case from '@/models/Case';

function requireStaffAccess(session: any) {
  const role = session?.user?.role || 'doctor';
  return ['admin', 'doctor', 'staff'].includes(role);
}

async function canAccessHearing(hearing: any, session: any): Promise<boolean> {
  const role = session?.user?.role || 'doctor';
  if (role === 'admin' || role === 'staff') return true;
  
  const userEmail = (session?.user?.email || '').toLowerCase();
  
  // Check if user created this hearing
  if ((hearing.createdByEmail || '').toLowerCase() === userEmail) return true;
  
  // Check if hearing is linked to a case the user owns
  if (hearing.caseId) {
    const caseDoc = await Case.findById(hearing.caseId).lean();
    if (caseDoc) {
      const assignedEmail = ((caseDoc as any).assignedLawyerEmail || '').toLowerCase();
      const createdEmail = ((caseDoc as any).createdByEmail || '').toLowerCase();
      if (assignedEmail === userEmail || createdEmail === userEmail) return true;
    }
  }
  
  return false;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();

    const hearing = await Hearing.findById(id);
    if (!hearing) return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });

    if (!(await canAccessHearing(hearing, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(hearing);
  } catch (error) {
    console.error('Hearing fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();

    const hearing = await Hearing.findById(id);
    if (!hearing) return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });

    if (!(await canAccessHearing(hearing, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Update fields
    if (body.hearingType !== undefined) hearing.hearingType = String(body.hearingType).trim();
    if (body.hearingDate !== undefined) {
      const hearingDate = new Date(body.hearingDate);
      if (isNaN(hearingDate.getTime())) return NextResponse.json({ error: 'Invalid hearingDate' }, { status: 400 });
      hearing.hearingDate = hearingDate;
    }
    if (body.hearingTime !== undefined) hearing.hearingTime = String(body.hearingTime).trim();
    if (body.duration !== undefined) hearing.duration = body.duration ? Number(body.duration) : undefined;
    if (body.courtName !== undefined) hearing.courtName = String(body.courtName).trim();
    if (body.courtAddress !== undefined) {
      hearing.courtAddress = body.courtAddress
        ? {
            street: body.courtAddress.street ? String(body.courtAddress.street).trim() : undefined,
            city: body.courtAddress.city ? String(body.courtAddress.city).trim() : undefined,
            state: body.courtAddress.state ? String(body.courtAddress.state).trim() : undefined,
            zip: body.courtAddress.zip ? String(body.courtAddress.zip).trim() : undefined,
          }
        : undefined;
    }
    if (body.courtroom !== undefined) hearing.courtroom = body.courtroom ? String(body.courtroom).trim() : undefined;
    if (body.judgeName !== undefined) hearing.judgeName = body.judgeName ? String(body.judgeName).trim() : undefined;
    if (body.docketNumber !== undefined)
      hearing.docketNumber = body.docketNumber ? String(body.docketNumber).trim() : undefined;
    if (body.opposingCounsel !== undefined)
      hearing.opposingCounsel = body.opposingCounsel ? String(body.opposingCounsel).trim() : undefined;
    if (body.status !== undefined) hearing.status = String(body.status).trim();
    if (body.notes !== undefined) hearing.notes = body.notes ? String(body.notes).trim() : undefined;
    if (body.reminderDaysBefore !== undefined) {
      hearing.reminderDaysBefore = Array.isArray(body.reminderDaysBefore)
        ? body.reminderDaysBefore.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n) && n >= 0)
        : [];
    }

    // Update case/client info if caseId changed
    if (body.caseId !== undefined) {
      const caseId = body.caseId ? String(body.caseId) : undefined;
      hearing.caseId = caseId;
      if (caseId) {
        const matter = await Case.findById(caseId);
        if (matter) {
          hearing.caseNumber = matter.caseNumber;
          hearing.clientId = matter.clientId;
          hearing.clientName = matter.clientName;
        }
      } else {
        hearing.caseNumber = undefined;
        hearing.clientId = undefined;
        hearing.clientName = undefined;
      }
    }

    // Conflict detection: same matter + same date/time (ignore cancelled/adjourned)
    if (hearing.caseId && hearing.hearingDate && hearing.hearingTime) {
      const conflict = await Hearing.findOne({
        _id: { $ne: hearing._id },
        caseId: hearing.caseId,
        hearingDate: hearing.hearingDate,
        hearingTime: hearing.hearingTime,
        status: { $nin: ['cancelled', 'adjourned'] },
      }).lean();
      if (conflict) {
        return NextResponse.json(
          {
            error: 'Scheduling conflict: another hearing is already scheduled for this matter at the same date/time.',
            conflictHearingId: conflict._id,
          },
          { status: 409 }
        );
      }
    }

    await hearing.save();
    return NextResponse.json(hearing);
  } catch (error) {
    console.error('Hearing update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();

    const hearing = await Hearing.findById(id);
    if (!hearing) return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });

    if (!(await canAccessHearing(hearing, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Hearing.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Hearing deleted successfully' });
  } catch (error) {
    console.error('Hearing delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();

    const hearing = await Hearing.findById(id);
    if (!hearing) return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });

    if (!(await canAccessHearing(hearing, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Allow status updates via PATCH
    if (body.status !== undefined) {
      hearing.status = String(body.status).trim();
    }

    await hearing.save();
    return NextResponse.json(hearing);
  } catch (error) {
    console.error('Hearing patch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
