import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import Patient from '@/models/Patient';
import Case from '@/models/Case';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const role = (session.user as any).role || 'doctor';
    const userEmail = ((session.user as any).email || '').toLowerCase();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId') || searchParams.get('patientId');
    const matterId = searchParams.get('matterId');
    const search = searchParams.get('search');

    let query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (clientId) {
      query.$or = [{ clientId }, { patientId: clientId }];
    }
    if (matterId) {
      query.matterId = matterId;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { clientEmail: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } }, // legacy
        { patientEmail: { $regex: search, $options: 'i' } }, // legacy
      ];
    }

    // Lawyers only see invoices for their own cases or ones they created
    if (role === 'doctor') {
      const lawyerCases = await Case.find({
        $or: [{ assignedLawyerEmail: userEmail }, { createdByEmail: userEmail }],
      }).select('_id').lean();
      const lawyerCaseIds = lawyerCases.map((c: any) => c._id.toString());

      const ownershipFilter = {
        $or: [
          { createdBy: userEmail },
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

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      clientId,
      patientId, // legacy
      matterId,
      items,
      subtotal,
      tax = 0,
      discount = 0,
      total,
      status = 'draft',
      dueDate,
      notes,
    } = body;

// Validate required fields
    let effectiveClientId = clientId || patientId;
    if (!effectiveClientId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Client ID and at least one item are required' },
        { status: 400 }
      );
    }

    // Calculate totals if not provided
    let calculatedSubtotal = 0;
    if (items && items.length > 0) {
      calculatedSubtotal = items.reduce((sum: number, item: any) => {
        const itemTotal = (item.quantity || 1) * (item.unitPrice || 0);
        return sum + itemTotal;
      }, 0);
    }

    const finalSubtotal = subtotal || calculatedSubtotal;
    const finalTax = tax || 0;
    const finalDiscount = discount || 0;
    const finalTotal = total || (finalSubtotal + finalTax - finalDiscount);

    // Optional: link to a matter and derive client from it
    let matterNumber: string | undefined;
    let resolvedMatterId: string | undefined = matterId ? String(matterId).trim() : undefined;
    if (resolvedMatterId) {
      const matter = await Case.findById(resolvedMatterId).lean().catch(() => null);
      if (matter) {
        matterNumber = (matter as any).caseNumber;
        if ((matter as any).clientId) {
          effectiveClientId = String((matter as any).clientId);
        }
      } else {
        resolvedMatterId = undefined;
      }
    }

    // Get client information (preferred). Fallback to legacy Patient lookup.
    const client =
      (await Client.findById(effectiveClientId).lean().catch(() => null)) ||
      (await Client.findOne({ clientNumber: effectiveClientId }).lean().catch(() => null));

    const patient =
      client
        ? null
        : await Patient.findOne({ patientId: effectiveClientId }).lean().catch(() => null);

    if (!client && !patient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Update items with calculated totals
    const invoiceItems = items.map((item: any) => ({
      ...item,
      total: (item.quantity || 1) * (item.unitPrice || 0),
    }));

    // Generate invoice number
    const count = await Invoice.countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const sequence = String(count + 1).padStart(6, '0');
    const invoiceNumber = `INV-${year}${month}-${sequence}`;

    // Create invoice
    const invoice = new Invoice({
      invoiceNumber,
      clientId: client ? String(client._id) : undefined,
      clientName: client ? client.name : undefined,
      clientEmail: client ? client.email : undefined,
      clientPhone: client ? client.phone : undefined,
      matterId: resolvedMatterId,
      matterNumber,

      // Legacy fields kept for backward compatibility
      patientId: client ? (client.clientNumber || String(client._id)) : (patient?.patientId || effectiveClientId),
      patientName: client ? client.name : (patient as any)?.name,
      patientEmail: client ? (client.email || '') : (patient as any)?.email,
      patientPhone: client ? (client.phone || '') : (patient as any)?.phone,
      items: invoiceItems,
      subtotal: finalSubtotal,
      tax: finalTax,
      discount: finalDiscount,
      total: finalTotal,
      status,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
      createdBy: session.user.email || session.user.id,
    });

    await invoice.save();

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
