import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';
import Case from '@/models/Case';

function requireStaffAccess(session: any) {
  const role = session?.user?.role || 'doctor';
  return ['admin', 'doctor', 'staff'].includes(role);
}

async function canAccessClient(clientId: string, session: any): Promise<boolean> {
  const role = session?.user?.role || 'doctor';
  if (role === 'admin' || role === 'staff') return true;
  
  const userEmail = (session?.user?.email || '').toLowerCase();
  
  // Check if the lawyer has any cases with this client
  const lawyerCase = await Case.findOne({
    clientId: clientId,
    $or: [{ assignedLawyerEmail: userEmail }, { createdByEmail: userEmail }],
  }).lean();
  
  return !!lawyerCase;
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
    if (!requireStaffAccess(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    
    if (!(await canAccessClient(id, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Client fetch error:', error);
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
    if (!requireStaffAccess(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    
    if (!(await canAccessClient(id, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const update: Record<string, any> = {};
    if (body.type !== undefined) update.type = body.type === 'organization' ? 'organization' : 'individual';
    if (body.name !== undefined) update.name = String(body.name).trim();
    if (body.email !== undefined) update.email = body.email ? String(body.email).trim().toLowerCase() : undefined;
    if (body.phone !== undefined) update.phone = body.phone ? String(body.phone).trim() : undefined;
    if (body.address !== undefined) update.address = body.address ? String(body.address).trim() : undefined;
    if (body.notes !== undefined) update.notes = body.notes ? String(body.notes).trim() : undefined;
    if (body.conflictCheckNotes !== undefined) {
      update.conflictCheckNotes = body.conflictCheckNotes ? String(body.conflictCheckNotes).trim() : undefined;
    }
    if (Array.isArray(body.identifiers)) {
      update.identifiers = body.identifiers
        .map((i: any) => ({
          label: String(i?.label || '').trim(),
          value: String(i?.value || '').trim(),
        }))
        .filter((i: any) => i.label && i.value);
    }

    if (update.name !== undefined && !update.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const updated = await Client.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Client update error:', error);
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
    if (!requireStaffAccess(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const existing = await Client.findById(id);
    if (!existing) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    
    if (!(await canAccessClient(id, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await Client.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Client deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

