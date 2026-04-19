import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Case from '@/models/Case';
import Appointment from '@/models/Appointment';
import Document from '@/models/Document';
import Hearing from '@/models/Hearing';
import Deadline from '@/models/Deadline';
import Invoice from '@/models/Invoice';

function uniqBy<T>(arr: T[], key: (x: T) => string) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const { id } = await params;
    const lawyer = await User.findById(id).select('-password').lean();
    if (!lawyer) {
      return NextResponse.json({ error: 'Lawyer not found' }, { status: 404 });
    }

    const lawyerEmail = String((lawyer as any).email || '').toLowerCase();
    const lawyerName = String((lawyer as any).name || '');

    // Matters (cases) assigned to this lawyer
    const mattersQuery: any = lawyerEmail ? { assignedLawyerEmail: lawyerEmail } : { assignedLawyerName: lawyerName };

    const [mattersTotal, mattersOpen, mattersLead, mattersClosed] = await Promise.all([
      Case.countDocuments(mattersQuery),
      Case.countDocuments({ ...mattersQuery, status: 'open' }),
      Case.countDocuments({ ...mattersQuery, status: 'lead' }),
      Case.countDocuments({ ...mattersQuery, status: 'closed' }),
    ]);

    const matters = await Case.find(mattersQuery).sort({ createdAt: -1 }).limit(200).lean();
    const matterIds = matters.map((m: any) => String(m._id)).filter(Boolean);

    // Related entities (by matter ids)
    const [appointments, documents, hearings, deadlines, invoices] = await Promise.all([
      Appointment.find(
        lawyerEmail
          ? { $or: [{ doctorEmail: lawyerEmail }, { doctorName: lawyerName }] }
          : { doctorName: lawyerName }
      )
        .sort({ appointmentDate: -1 })
        .limit(100)
        .lean(),
      matterIds.length
        ? Document.find({ matterId: { $in: matterIds } }).sort({ createdAt: -1 }).limit(200).lean()
        : Promise.resolve([] as any[]),
      matterIds.length
        ? Hearing.find({ caseId: { $in: matterIds } }).sort({ hearingDate: 1, hearingTime: 1 }).limit(200).lean()
        : Promise.resolve([] as any[]),
      matterIds.length
        ? Deadline.find({ matterId: { $in: matterIds } }).sort({ dueDate: 1 }).limit(200).lean()
        : Promise.resolve([] as any[]),
      matterIds.length
        ? Invoice.find({ matterId: { $in: matterIds } }).sort({ createdAt: -1 }).limit(200).lean()
        : Promise.resolve([] as any[]),
    ]);

    const clients = uniqBy(
      matters
        .map((m: any) => ({
          clientId: m.clientId ? String(m.clientId) : '',
          clientName: m.clientName ? String(m.clientName) : '',
          clientEmail: m.clientEmail ? String(m.clientEmail) : '',
        }))
        .filter((c) => c.clientId || c.clientName || c.clientEmail),
      (c) => c.clientId || `${c.clientName}|${c.clientEmail}`
    );

    return NextResponse.json({
      lawyer,
      counts: {
        mattersTotal,
        mattersOpen,
        mattersLead,
        mattersClosed,
        clients: clients.length,
        appointments: appointments.length,
        documents: documents.length,
        hearings: hearings.length,
        deadlines: deadlines.length,
        invoices: invoices.length,
      },
      data: {
        matters,
        clients,
        appointments,
        documents,
        hearings,
        deadlines,
        invoices,
      },
    });
  } catch (error) {
    console.error('Lawyer details fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

