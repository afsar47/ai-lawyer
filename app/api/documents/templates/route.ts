import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Document from '@/models/Document';

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
    const category = searchParams.get('category');

    const query: Record<string, any> = { isTemplate: true, isLatest: true };
    if (category) query.templateCategory = category;

    const templates = await Document.find(query).sort({ title: 1 });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Templates fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = session?.user?.role || 'doctor';
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create templates' }, { status: 403 });
    }

    const body = await request.json();
    const title = String(body.title || '').trim();
    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    await dbConnect();

    const template = new Document({
      title,
      description: body.description,
      type: body.type || 'template',
      status: 'final',
      content: body.content,
      tags: Array.isArray(body.tags) ? body.tags.map((t: string) => t.toLowerCase().trim()) : [],
      isTemplate: true,
      templateCategory: body.templateCategory || 'general',
      accessLevel: 'team',
      createdByEmail: session.user.email?.toLowerCase(),
    });

    await template.save();
    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error('Template creation error:', error);
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Duplicate documentNumber. Please try again.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
