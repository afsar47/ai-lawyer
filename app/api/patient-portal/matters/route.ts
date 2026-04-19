import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/mongodb';
import Client from '../../../../models/Client';
import Case from '../../../../models/Case';
import Patient from '../../../../models/Patient';

async function getClientIdForSessionEmail(email: string | undefined) {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  if (!normalized) return null;
  const existing = await Client.findOne({ email: normalized }).select('_id').lean();
  if (existing?._id) return existing._id.toString();

  // Fallback: if this user logged in via legacy Patient account, auto-create a Client record
  const patient = await Patient.findOne({ email: normalized }).select('name email phone address').lean();
  if (!patient) return null;

  const created = new Client({
    type: 'individual',
    name: patient.name,
    email: patient.email,
    phone: patient.phone,
    address: patient.address,
  });
  await created.save();
  return created._id.toString();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized - Client access only' }, { status: 401 });
    }

    await dbConnect();
    const clientId = await getClientIdForSessionEmail(session.user.email);
    if (!clientId) return NextResponse.json({ matters: [], total: 0 });

    const matters = await Case.find({ clientId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ matters, total: matters.length });
  } catch (error) {
    console.error('Client portal matters fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch matters' }, { status: 500 });
  }
}

