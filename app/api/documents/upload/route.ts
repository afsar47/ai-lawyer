import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Document from '@/models/Document';
import DocumentFolder from '@/models/DocumentFolder';
import Case from '@/models/Case';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

function requireStaffAccess(session: any) {
  const role = session?.user?.role || 'doctor';
  return ['admin', 'doctor', 'staff'].includes(role);
}

function getFileType(mimeType: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/plain': 'txt',
    'text/rtf': 'rtf',
    'application/rtf': 'rtf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
  };
  return mimeMap[mimeType] || ext || 'other';
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/rtf',
  'application/rtf',
  'image/jpeg',
  'image/png',
  'image/gif',
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireStaffAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    const title = String(formData.get('title') || file.name).trim();
    const description = String(formData.get('description') || '').trim();
    const type = String(formData.get('type') || 'other');
    const status = String(formData.get('status') || 'draft');
    const matterId = String(formData.get('matterId') || '').trim() || undefined;
    const clientId = String(formData.get('clientId') || '').trim() || undefined;
    const folderId = String(formData.get('folderId') || '').trim() || undefined;
    const tags = String(formData.get('tags') || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const isConfidential = formData.get('isConfidential') === 'true';
    const sharedWithClient = formData.get('sharedWithClient') === 'true';

    await dbConnect();

    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    
    await mkdir(uploadDir, { recursive: true });
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, uniqueFilename);
    
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/documents/${uniqueFilename}`;

    let folderPath: string | undefined;
    if (folderId) {
      const folder = await DocumentFolder.findById(folderId);
      if (folder) {
        folderPath = folder.path;
        await DocumentFolder.findByIdAndUpdate(folderId, { $inc: { documentCount: 1 } });
      }
    }

    let matterNumber: string | undefined;
    let resolvedClientId = clientId;
    let clientName: string | undefined;

    if (matterId) {
      const matter = await Case.findById(matterId);
      if (matter) {
        matterNumber = matter.caseNumber;
        resolvedClientId = matter.clientId;
        clientName = matter.clientName;
      }
    }

    const doc = new Document({
      title,
      description,
      type,
      status,
      file: {
        filename: uniqueFilename,
        originalName: file.name,
        mimeType: file.type,
        fileType: getFileType(file.type, file.name),
        size: file.size,
        url: fileUrl,
        uploadedAt: new Date(),
      },
      folderId,
      folderPath,
      tags,
      matterId,
      matterNumber,
      clientId: resolvedClientId,
      clientName,
      isConfidential,
      sharedWithClient,
      accessLevel: 'team',
      isTemplate: false,
      createdByEmail: session.user.email?.toLowerCase(),
    });

    await doc.save();
    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    console.error('Document upload error:', error);
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Duplicate documentNumber. Please try again.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
