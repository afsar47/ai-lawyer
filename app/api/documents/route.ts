import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Document from '@/models/Document';
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
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200);
    const offset = parseInt(searchParams.get('offset') || '0', 10) || 0;
    const clientId = searchParams.get('clientId');
    const matterId = searchParams.get('matterId');
    const folderId = searchParams.get('folderId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const tags = searchParams.get('tags');
    const isTemplate = searchParams.get('isTemplate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query: Record<string, any> = { isLatest: true };
    
    if (clientId) query.clientId = clientId;
    if (matterId) query.matterId = matterId;
    if (folderId) query.folderId = folderId;
    if (type) query.type = type;
    if (status) query.status = status;
    if (tags) query.tags = { $in: tags.split(',').map(t => t.trim().toLowerCase()) };
    if (isTemplate === 'true') query.isTemplate = true;
    if (isTemplate === 'false') query.isTemplate = { $ne: true };
    
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { title: rx }, 
        { documentNumber: rx }, 
        { clientName: rx }, 
        { matterNumber: rx },
        { description: rx },
        { tags: rx }
      ];
    }

    // Lawyers only see documents for their own cases or ones they created
    const role = session.user.role || 'doctor';
    const userEmail = (session.user.email || '').toLowerCase();

    if (role === 'doctor') {
      const lawyerCases = await Case.find({
        $or: [{ assignedLawyerEmail: userEmail }, { createdByEmail: userEmail }],
      }).select('_id').lean();
      const lawyerCaseIds = lawyerCases.map((c: any) => c._id.toString());

      const ownershipFilter = {
        $or: [
          { createdByEmail: userEmail },
          { matterId: { $in: lawyerCaseIds } },
        ],
      };

      if (query.$or) {
        query.$and = [{ $or: query.$or }, ownershipFilter];
        delete query.$or;
      } else {
        Object.assign(query, ownershipFilter);
      }
    }

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [docs, totalCount] = await Promise.all([
      Document.find(query).sort(sortOptions).skip(offset).limit(limit),
      Document.countDocuments(query)
    ]);

    return NextResponse.json({ 
      documents: docs, 
      total: totalCount,
      limit,
      offset,
      hasMore: offset + docs.length < totalCount
    });
  } catch (error) {
    console.error('Documents fetch error:', error);
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

    const role = session?.user?.role || 'doctor';
    if ((body.status === 'final' || body.sharedWithClient === true) && role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can finalize or share documents' }, { status: 403 });
    }

    await dbConnect();

    let matterId: string | undefined = body.matterId ? String(body.matterId) : undefined;
    let matterNumber: string | undefined;
    let clientId: string | undefined = body.clientId ? String(body.clientId) : undefined;
    let clientName: string | undefined = body.clientName ? String(body.clientName).trim() : undefined;

    if (matterId) {
      const matter = await Case.findById(matterId);
      if (matter) {
        matterNumber = matter.caseNumber;
        clientId = matter.clientId;
        clientName = matter.clientName;
      }
    }

    const doc = new Document({
      title,
      description: body.description ? String(body.description).trim() : undefined,
      type: body.type || 'other',
      status: body.status || 'draft',
      folderId: body.folderId,
      folderPath: body.folderPath,
      tags: Array.isArray(body.tags) 
        ? body.tags.map((t: string) => String(t).trim().toLowerCase()).filter(Boolean) 
        : [],
      clientId,
      clientName,
      matterId,
      matterNumber,
      content: body.content ? String(body.content) : undefined,
      attachments: Array.isArray(body.attachments)
        ? body.attachments.map((a: any) => String(a).trim()).filter(Boolean)
        : [],
      sharedWithClient: Boolean(body.sharedWithClient),
      isConfidential: Boolean(body.isConfidential),
      accessLevel: body.accessLevel || 'team',
      isTemplate: Boolean(body.isTemplate),
      templateCategory: body.templateCategory,
      createdByEmail: session.user.email?.toLowerCase(),
    });

    await doc.save();
    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    console.error('Document creation error:', error);
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Duplicate documentNumber. Please try again.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

