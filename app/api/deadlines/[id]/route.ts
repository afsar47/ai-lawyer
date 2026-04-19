import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Deadline from '@/models/Deadline';
import Case from '@/models/Case';

function requireStaffAccess(session: any) {
  const role = session?.user?.role || 'doctor';
  return ['admin', 'doctor', 'staff'].includes(role);
}

async function canAccessDeadline(deadline: any, session: any): Promise<boolean> {
  const role = session?.user?.role || 'doctor';
  if (role === 'admin' || role === 'staff') return true;
  
  const userEmail = (session?.user?.email || '').toLowerCase();
  
  // Check if user created this deadline
  if ((deadline.createdByEmail || '').toLowerCase() === userEmail) return true;
  
  // Check if deadline is linked to a case the user owns
  if (deadline.matterId) {
    const caseDoc = await Case.findById(deadline.matterId).lean();
    if (caseDoc) {
      const assignedEmail = ((caseDoc as any).assignedLawyerEmail || '').toLowerCase();
      const createdEmail = ((caseDoc as any).createdByEmail || '').toLowerCase();
      if (assignedEmail === userEmail || createdEmail === userEmail) return true;
    }
  }
  
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();
    const { id } = await params;
    const doc = await Deadline.findById(id);
    if (!doc) return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
    
    if (!(await canAccessDeadline(doc, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json(doc);
  } catch (error) {
    console.error('Deadline fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();
    const { id } = await params;
    
    // Check access before allowing update
    const existingDoc = await Deadline.findById(id);
    if (!existingDoc) return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
    if (!(await canAccessDeadline(existingDoc, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const update: Record<string, any> = {};
    if (body.title !== undefined) update.title = String(body.title).trim();
    if (body.type !== undefined) update.type = body.type;
    if (body.status !== undefined) update.status = body.status;
    if (body.dueDate !== undefined) {
      const d = new Date(body.dueDate);
      if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 });
      update.dueDate = d;
    }
    if (body.notes !== undefined) update.notes = body.notes ? String(body.notes).trim() : undefined;
    if (body.reminderDaysBefore !== undefined) {
      update.reminderDaysBefore = Array.isArray(body.reminderDaysBefore)
        ? body.reminderDaysBefore.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n) && n >= 0)
        : [];
    }

    if (update.title !== undefined && !update.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    // Conflict detection (only if title/date are changing)
    if (update.title !== undefined || update.dueDate !== undefined) {
      const existing = await Deadline.findById(id).lean();
      if (existing) {
        const title = update.title !== undefined ? update.title : existing.title;
        const dueDate = update.dueDate !== undefined ? update.dueDate : existing.dueDate;
        if (existing.matterId) {
          const conflict = await Deadline.findOne({
            _id: { $ne: id },
            matterId: existing.matterId,
            title,
            dueDate,
            status: { $ne: 'cancelled' },
          }).lean();
          if (conflict) {
            return NextResponse.json(
              { error: 'Scheduling conflict: a deadline with the same title already exists for this matter on the same date.', conflictDeadlineId: conflict._id },
              { status: 409 }
            );
          }
        }
      }
    }

    const updated = await Deadline.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Deadline update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();
    const { id } = await params;
    const existing = await Deadline.findById(id);
    if (!existing) return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
    
    if (!(await canAccessDeadline(existing, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await Deadline.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Deadline deleted successfully' });
  } catch (error) {
    console.error('Deadline deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

