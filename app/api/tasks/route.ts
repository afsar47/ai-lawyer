import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
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
    const email = (session.user.email || '').toLowerCase();

    const { searchParams } = new URL(request.url);
    const matterId = searchParams.get('matterId');
    const status = searchParams.get('status');
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10) || 200, 500);

    const query: Record<string, any> = {};
    if (matterId) query.matterId = matterId;
    if (status) query.status = status;
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: rx }, { description: rx }, { matterNumber: rx }, { clientName: rx }];
    }

    if (role === 'doctor') {
      query.$or = [{ assignedToEmail: email }, { createdByEmail: email }];
    }

    const tasks = await Task.find(query).sort({ dueDate: 1, createdAt: -1 }).limit(limit);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Tasks fetch error:', error);
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
    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    const dueDate = body.dueDate ? new Date(body.dueDate) : undefined;
    if (body.dueDate && (!dueDate || Number.isNaN(dueDate.getTime()))) {
      return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 });
    }

    await dbConnect();

    let matterId: string | undefined = body.matterId ? String(body.matterId).trim() : undefined;
    let matterNumber: string | undefined;
    let clientId: string | undefined;
    let clientName: string | undefined;

    if (matterId) {
      const matter = await Case.findById(matterId);
      if (!matter) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      matterNumber = matter.caseNumber;
      clientId = matter.clientId;
      clientName = matter.clientName;
    }

    const assignedToEmail = body.assignedToEmail ? String(body.assignedToEmail).trim().toLowerCase() : undefined;
    const assignedToName = body.assignedToName ? String(body.assignedToName).trim() : undefined;

    const task = new Task({
      title,
      description: body.description ? String(body.description).trim() : undefined,
      status: body.status || 'open',
      priority: body.priority || 'medium',
      dueDate,
      matterId,
      matterNumber,
      clientId,
      clientName,
      assignedToEmail,
      assignedToName,
      createdByEmail: session.user.email?.toLowerCase(),
    });

    await task.save();
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

