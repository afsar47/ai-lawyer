import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';

function requireStaffAccess(session: any) {
  const role = session?.user?.role || 'doctor';
  return ['admin', 'doctor', 'staff'].includes(role);
}

function canAccessTask(task: any, session: any): boolean {
  const role = session?.user?.role || 'doctor';
  if (role === 'admin' || role === 'staff') return true;
  const email = (session?.user?.email || '').toLowerCase();
  return (
    String(task.createdByEmail || '').toLowerCase() === email ||
    String(task.assignedToEmail || '').toLowerCase() === email
  );
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
    const task = await Task.findById(id);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    if (!canAccessTask(task, session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json(task);
  } catch (error) {
    console.error('Task fetch error:', error);
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
    const existing = await Task.findById(id);
    if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    if (!canAccessTask(existing, session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const update: Record<string, any> = {};
    if (body.title !== undefined) update.title = String(body.title).trim();
    if (body.description !== undefined) update.description = body.description ? String(body.description).trim() : undefined;
    if (body.status !== undefined) update.status = body.status;
    if (body.priority !== undefined) update.priority = body.priority;
    if (body.dueDate !== undefined) {
      if (!body.dueDate) update.dueDate = undefined;
      else {
        const d = new Date(body.dueDate);
        if (Number.isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 });
        update.dueDate = d;
      }
    }
    if (body.assignedToEmail !== undefined) {
      update.assignedToEmail = body.assignedToEmail ? String(body.assignedToEmail).trim().toLowerCase() : undefined;
    }
    if (body.assignedToName !== undefined) {
      update.assignedToName = body.assignedToName ? String(body.assignedToName).trim() : undefined;
    }

    if (update.title !== undefined && !update.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const updated = await Task.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Task update error:', error);
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
    const existing = await Task.findById(id);
    if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    if (!canAccessTask(existing, session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await Task.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Task deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

