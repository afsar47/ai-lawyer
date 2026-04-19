import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import Invoice from '../../../../models/Invoice';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized - Client access only' }, { status: 401 });
    }

    await dbConnect();

    const email = (session.user.email || '').toLowerCase().trim();
    if (!email) return NextResponse.json({ invoices: [], total: 0 });

    const invoices = await Invoice.find({ patientEmail: email }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ invoices, total: invoices.length });
  } catch (error) {
    console.error('Client portal invoices fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

