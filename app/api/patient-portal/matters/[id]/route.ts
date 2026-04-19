import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../../lib/mongodb';
import Client from '../../../../../models/Client';
import Case from '../../../../../models/Case';
import Patient from '../../../../../models/Patient';

async function getClientIdForSessionEmail(email: string | undefined) {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  if (!normalized) return null;
  const existing = await Client.findOne({ email: normalized }).select('_id').lean();
  if (existing?._id) return existing._id.toString();

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
    const clientId = await getClientIdForSessionEmail(session.user.email);
    if (!clientId) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const { id } = await params;
    const matter = await Case.findById(id).lean();
    if (!matter) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    if (String((matter as any).clientId) !== clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ matter });
  } catch (error) {
    console.error('Client portal matter fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch matter' }, { status: 500 });
  }
}

