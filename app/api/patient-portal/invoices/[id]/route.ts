import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../../lib/mongodb';
import Invoice from '../../../../../models/Invoice';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized - Client access only' }, { status: 401 });
    }

    await dbConnect();
    const email = (session.user.email || '').toLowerCase().trim();
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const invoice = await Invoice.findById(id).lean();
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    if (String((invoice as any).patientEmail || '').toLowerCase() !== email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Client portal invoice fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

