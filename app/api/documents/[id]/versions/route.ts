import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Document from '@/models/Document';

function requireStaffAccess(session: any) {
  const role = session?.user?.role || 'doctor';
  return ['admin', 'doctor', 'staff'].includes(role);
}

// Create a new version of an existing document
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();
    const { id } = await params;

    const existing = await Document.findById(id);
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    // Mark existing as not-latest
    existing.isLatest = false;
    await existing.save();

    const nextVersion = (existing.version || 1) + 1;
    const rootDocumentId = existing.rootDocumentId || existing._id.toString();

    const newDoc = new Document({
      title: existing.title,
      type: existing.type,
      status: 'draft', // new versions start in draft
      version: nextVersion,
      rootDocumentId,
      previousVersionId: existing._id.toString(),
      isLatest: true,
      clientId: existing.clientId,
      clientName: existing.clientName,
      matterId: existing.matterId,
      matterNumber: existing.matterNumber,
      content: existing.content,
      attachments: existing.attachments || [],
      sharedWithClient: false,
      createdByEmail: session.user.email?.toLowerCase(),
    });

    await newDoc.save();
    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    console.error('Document version create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

