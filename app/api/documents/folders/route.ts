import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import DocumentFolder from '@/models/DocumentFolder';
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
    const parentId = searchParams.get('parentId');
    const matterId = searchParams.get('matterId');
    const clientId = searchParams.get('clientId');

    const query: Record<string, any> = {};
    if (parentId) query.parentId = parentId;
    else if (matterId || clientId) query.parentId = { $exists: false };
    
    if (matterId) query.matterId = matterId;
    if (clientId) query.clientId = clientId;

    const folders = await DocumentFolder.find(query).sort({ name: 1 });
    return NextResponse.json(folders);
  } catch (error) {
    console.error('Document folders fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    await dbConnect();

    let parentPath = '';
    if (body.parentId) {
      const parent = await DocumentFolder.findById(body.parentId);
      if (!parent) return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
      parentPath = parent.path;
    }

    const path = parentPath ? `${parentPath}/${name.toLowerCase().replace(/\s+/g, '-')}` : `/${name.toLowerCase().replace(/\s+/g, '-')}`;

    let matterId: string | undefined = body.matterId;
    let matterNumber: string | undefined;
    let clientId: string | undefined = body.clientId;
    let clientName: string | undefined;

    if (matterId) {
      const matter = await Case.findById(matterId);
      if (matter) {
        matterNumber = matter.caseNumber;
        clientId = matter.clientId;
        clientName = matter.clientName;
      }
    }

    const folder = new DocumentFolder({
      name,
      description: body.description,
      parentId: body.parentId,
      path,
      color: body.color || '#6366f1',
      icon: body.icon || 'folder',
      isSystem: false,
      matterId,
      matterNumber,
      clientId,
      clientName,
      createdByEmail: session.user.email?.toLowerCase(),
    });

    await folder.save();
    return NextResponse.json(folder, { status: 201 });
  } catch (error: any) {
    console.error('Document folder creation error:', error);
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'A folder with this path already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
