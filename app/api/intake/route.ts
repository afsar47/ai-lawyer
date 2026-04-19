import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import Case from '@/models/Case';
import Task from '@/models/Task';
import Deadline from '@/models/Deadline';

function requireStaffAccess(session: any) {
  const role = session?.user?.role || 'doctor';
  return ['admin', 'doctor', 'staff'].includes(role);
}

function parseNextCaseNumber(lastCaseNumber?: string | null): string {
  if (!lastCaseNumber) return 'CASE-0001';
  const match = lastCaseNumber.match(/^CASE-(\d+)$/);
  const next = match ? parseInt(match[1], 10) + 1 : 1;
  return `CASE-${next.toString().padStart(4, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const clientName = String(body.clientName || '').trim();
    const clientEmail = body.clientEmail ? String(body.clientEmail).trim().toLowerCase() : '';
    const clientPhone = body.clientPhone ? String(body.clientPhone).trim() : '';
    const matterTitle = String(body.matterTitle || '').trim();
    const matterDescription = body.matterDescription ? String(body.matterDescription).trim() : '';
    const urgency = String(body.urgency || 'medium');
    const initialDeadlineDate = body.initialDeadlineDate ? new Date(body.initialDeadlineDate) : null;

    if (!clientName) return NextResponse.json({ error: 'clientName is required' }, { status: 400 });
    if (!matterTitle) return NextResponse.json({ error: 'matterTitle is required' }, { status: 400 });
    if (initialDeadlineDate && isNaN(initialDeadlineDate.getTime())) {
      return NextResponse.json({ error: 'Invalid initialDeadlineDate' }, { status: 400 });
    }

    await dbConnect();

    // Upsert-ish client by email if provided
    let client: any = null;
    if (clientEmail) {
      client = await Client.findOne({ email: clientEmail });
    }
    if (!client) {
      client = new Client({
        type: body.clientType === 'organization' ? 'organization' : 'individual',
        name: clientName,
        email: clientEmail || undefined,
        phone: clientPhone || undefined,
        address: body.clientAddress ? String(body.clientAddress).trim() : undefined,
        notes: body.clientNotes ? String(body.clientNotes).trim() : undefined,
        conflictCheckNotes: body.conflictCheckNotes ? String(body.conflictCheckNotes).trim() : undefined,
      });
      await client.save();
    }

    // Create matter (Case)
    const role = session.user.role || 'doctor';
    const assignedLawyerEmail = role === 'admin' && body.assignedLawyerEmail
      ? String(body.assignedLawyerEmail).toLowerCase()
      : session.user.email?.toLowerCase();

    const assignedLawyerName = role === 'admin' && body.assignedLawyerName
      ? String(body.assignedLawyerName)
      : session.user.name;

    const lastCase = await Case.findOne({}, { caseNumber: 1 }).sort({ caseNumber: -1 });
    const caseNumber = parseNextCaseNumber(lastCase?.caseNumber);

    const matter = await Case.create({
      caseNumber,
      title: matterTitle,
      description: matterDescription || undefined,
      status: 'lead',
      priority: urgency === 'high' ? 'high' : urgency === 'low' ? 'low' : 'medium',
      practiceArea: body.practiceArea ? String(body.practiceArea).trim() : undefined,
      clientId: client._id.toString(),
      clientName: client.name,
      clientEmail: client.email || '',
      assignedLawyerEmail,
      assignedLawyerName,
      createdByEmail: session.user.email?.toLowerCase(),
      tags: Array.isArray(body.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : [],
    });

    // Seed workflow tasks
    const now = new Date();
    const addDays = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
    const matterId = matter._id.toString();
    const matterNumber = matter.caseNumber;

    await Task.insertMany([
      {
        title: 'Run conflict check',
        status: 'open',
        priority: 'high',
        dueDate: addDays(1),
        matterId,
        matterNumber,
        clientId: client._id.toString(),
        clientName: client.name,
        assignedToEmail: assignedLawyerEmail,
        assignedToName: assignedLawyerName,
        createdByEmail: session.user.email?.toLowerCase(),
      },
      {
        title: 'Send engagement letter',
        status: 'open',
        priority: 'high',
        dueDate: addDays(1),
        matterId,
        matterNumber,
        clientId: client._id.toString(),
        clientName: client.name,
        assignedToEmail: assignedLawyerEmail,
        assignedToName: assignedLawyerName,
        createdByEmail: session.user.email?.toLowerCase(),
      },
      {
        title: 'Collect key documents from client',
        status: 'open',
        priority: 'medium',
        dueDate: addDays(3),
        matterId,
        matterNumber,
        clientId: client._id.toString(),
        clientName: client.name,
        assignedToEmail: assignedLawyerEmail,
        assignedToName: assignedLawyerName,
        createdByEmail: session.user.email?.toLowerCase(),
      },
    ]);

    // Optional initial deadline
    if (initialDeadlineDate) {
      await Deadline.create({
        title: body.initialDeadlineTitle ? String(body.initialDeadlineTitle).trim() : 'Initial deadline',
        type: 'deadline',
        status: 'upcoming',
        dueDate: initialDeadlineDate,
        matterId,
        matterNumber,
        clientId: client._id.toString(),
        clientName: client.name,
        notes: body.initialDeadlineNotes ? String(body.initialDeadlineNotes).trim() : undefined,
        createdByEmail: session.user.email?.toLowerCase(),
      });
    }

    return NextResponse.json(
      {
        clientId: client._id.toString(),
        matterId: matter._id.toString(),
        matterNumber: matter.caseNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Intake error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

