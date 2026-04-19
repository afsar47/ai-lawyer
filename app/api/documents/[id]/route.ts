import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Document from '@/models/Document';
import Case from '@/models/Case';

function requireStaffAccess(session: any) {
  const role = session?.user?.role || 'doctor';
  return ['admin', 'doctor', 'staff'].includes(role);
}

async function canAccessDocument(doc: any, session: any): Promise<boolean> {
  const role = session?.user?.role || 'doctor';
  if (role === 'admin' || role === 'staff') return true;
  
  const userEmail = (session?.user?.email || '').toLowerCase();
  
  // Check if user created this document
  if ((doc.createdByEmail || '').toLowerCase() === userEmail) return true;
  
  // Check if document is linked to a case the user owns
  if (doc.matterId) {
    const caseDoc = await Case.findById(doc.matterId).lean();
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
    const doc = await Document.findById(id);
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    
    if (!(await canAccessDocument(doc, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json(doc);
  } catch (error) {
    console.error('Document fetch error:', error);
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
    const existingDoc = await Document.findById(id);
    if (!existingDoc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (!(await canAccessDocument(existingDoc, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const update: Record<string, any> = {};
    if (body.title !== undefined) update.title = String(body.title).trim();
    if (body.type !== undefined) update.type = body.type;
    if (body.status !== undefined) update.status = body.status;
    if (body.content !== undefined) update.content = body.content ? String(body.content) : undefined;
    if (body.sharedWithClient !== undefined) update.sharedWithClient = Boolean(body.sharedWithClient);
    if (Array.isArray(body.attachments)) {
      update.attachments = body.attachments.map((a: any) => String(a).trim()).filter(Boolean);
    }

    if (update.title !== undefined && !update.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const role = session?.user?.role || 'doctor';
    if ((update.status === 'final' || update.sharedWithClient === true) && role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can finalize or share documents' }, { status: 403 });
    }

    const updated = await Document.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Document update error:', error);
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
    const existing = await Document.findById(id);
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    
    if (!(await canAccessDocument(existing, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await Document.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

