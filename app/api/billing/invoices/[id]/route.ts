import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import Payment from '@/models/Payment';
import Client from '@/models/Client';
import Patient from '@/models/Patient';
import Case from '@/models/Case';

async function canAccessInvoice(invoice: any, session: any): Promise<boolean> {
  const role = (session?.user as any)?.role || 'doctor';
  if (role === 'admin' || role === 'staff') return true;
  
  const userEmail = ((session?.user as any)?.email || '').toLowerCase();
  
  // Check if user created this invoice
  if ((invoice.createdBy || '').toLowerCase() === userEmail) return true;
  
  // Check if invoice is linked to a case the user owns
  if (invoice.matterId) {
    const caseDoc = await Case.findById(invoice.matterId).lean();
    if (caseDoc) {
      const assignedEmail = ((caseDoc as any).assignedLawyerEmail || '').toLowerCase();
      const createdEmail = ((caseDoc as any).createdByEmail || '').toLowerCase();
      if (assignedEmail === userEmail || createdEmail === userEmail) return true;
    }
  }
  
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const invoice = await Invoice.findById(id).lean();
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (!(await canAccessInvoice(invoice, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get payment history for this invoice
    const payments = await Payment.find({ invoiceId: id })
      .sort({ paymentDate: -1 })
      .lean();

    const totalPaid = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      invoice,
      payments,
      totalPaid,
      remaining: invoice.total - totalPaid,
    });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (!(await canAccessInvoice(invoice, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      clientId,
      matterId,
      items,
      subtotal,
      tax,
      discount,
      total,
      status,
      dueDate,
      notes,
    } = body;

    // Calculate totals if items are updated
    if (items && Array.isArray(items)) {
      const calculatedSubtotal = items.reduce((sum: number, item: any) => {
        const itemTotal = (item.quantity || 1) * (item.unitPrice || 0);
        return sum + itemTotal;
      }, 0);

      invoice.items = items.map((item: any) => ({
        ...item,
        total: (item.quantity || 1) * (item.unitPrice || 0),
      }));
      invoice.subtotal = subtotal || calculatedSubtotal;
      invoice.tax = tax || 0;
      invoice.discount = discount || 0;
      invoice.total = total || (invoice.subtotal + invoice.tax - invoice.discount);
    }

    // Allow changing the billed client (preferred) with legacy fallback.
    if (clientId !== undefined) {
      const effectiveClientId = String(clientId).trim();
      if (effectiveClientId) {
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

        if (client) {
          invoice.clientId = String(client._id);
          invoice.clientName = client.name;
          invoice.clientEmail = client.email || '';
          invoice.clientPhone = client.phone || '';

          invoice.patientId = (client as any).clientNumber || String(client._id);
          invoice.patientName = client.name;
          invoice.patientEmail = client.email || '';
          invoice.patientPhone = client.phone || '';
        } else if (patient) {
          invoice.clientId = undefined;
          invoice.clientName = undefined;
          invoice.clientEmail = undefined;
          invoice.clientPhone = undefined;

          invoice.patientId = (patient as any).patientId || effectiveClientId;
          invoice.patientName = (patient as any).name;
          invoice.patientEmail = (patient as any).email;
          invoice.patientPhone = (patient as any).phone;
        }
      }
    }

    // Allow linking/unlinking a matter; if set, it can also drive the client.
    if (matterId !== undefined) {
      const effectiveMatterId = matterId ? String(matterId).trim() : '';
      if (!effectiveMatterId) {
        (invoice as any).matterId = undefined;
        (invoice as any).matterNumber = undefined;
      } else {
        const matter = await Case.findById(effectiveMatterId).lean().catch(() => null);
        if (!matter) {
          return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        }
        (invoice as any).matterId = effectiveMatterId;
        (invoice as any).matterNumber = (matter as any).caseNumber;

        // Sync client from matter
        if ((matter as any).clientId) {
          const derivedClientId = String((matter as any).clientId);
          const client =
            (await Client.findById(derivedClientId).lean().catch(() => null)) ||
            (await Client.findOne({ clientNumber: derivedClientId }).lean().catch(() => null));
          if (client) {
            invoice.clientId = String(client._id);
            invoice.clientName = client.name;
            invoice.clientEmail = client.email || '';
            invoice.clientPhone = client.phone || '';

            invoice.patientId = (client as any).clientNumber || String(client._id);
            invoice.patientName = client.name;
            invoice.patientEmail = client.email || '';
            invoice.patientPhone = client.phone || '';
          } else {
            // Fallback to denormalized fields from Case
            invoice.clientId = derivedClientId;
            invoice.clientName = (matter as any).clientName;
            invoice.clientEmail = (matter as any).clientEmail || '';

            invoice.patientId = derivedClientId;
            invoice.patientName = (matter as any).clientName;
            invoice.patientEmail = (matter as any).clientEmail || '';
          }
        }
      }
    }

    if (status !== undefined) invoice.status = status;
    if (dueDate !== undefined) invoice.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) invoice.notes = notes;

    await invoice.save();

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (!(await canAccessInvoice(invoice, session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if there are any payments
    const payments = await Payment.find({ invoiceId: id });
    if (payments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete invoice with existing payments' },
        { status: 400 }
      );
    }

    await Invoice.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}
