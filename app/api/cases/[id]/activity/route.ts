import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Case from '@/models/Case';
import AuditLog from '@/models/AuditLog';
import Document from '@/models/Document';
import Deadline from '@/models/Deadline';
import Hearing from '@/models/Hearing';
import Task from '@/models/Task';
import Invoice from '@/models/Invoice';
import Note from '@/models/Note';

async function canAccessCase(caseDoc: any, session: any): Promise<boolean> {
  const role = session?.user?.role || 'doctor';
  if (role === 'admin' || role === 'staff') return true;
  if (role === 'doctor') {
    const email = (session?.user?.email || '').toLowerCase();
    return (
      (caseDoc.assignedLawyerEmail || '').toLowerCase() === email ||
      (caseDoc.createdByEmail || '').toLowerCase() === email
    );
  }
  return false;
}

type ActivityItem = {
  kind:
    | 'audit'
    | 'document'
    | 'deadline'
    | 'hearing'
    | 'task'
    | 'invoice'
    | 'note';
  at: string;
  title: string;
  detail?: string;
  href?: string;
  actorEmail?: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    const caseDoc: any = await Case.findById(id).lean();
    if (!caseDoc) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    if (!(await canAccessCase(caseDoc, session))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [
      audits,
      docs,
      deadlines,
      hearings,
      tasks,
      invoices,
      notes,
    ] = await Promise.all([
      AuditLog.find({ resourceType: 'case', resourceId: String(id) }).sort({ createdAt: -1 }).limit(80).lean(),
      Document.find({ matterId: String(id) }).sort({ createdAt: -1 }).limit(25).lean(),
      Deadline.find({ matterId: String(id) }).sort({ dueDate: -1 }).limit(25).lean(),
      Hearing.find({ caseId: String(id) }).sort({ hearingDate: -1 }).limit(25).lean(),
      Task.find({ matterId: String(id) }).sort({ dueDate: -1, createdAt: -1 }).limit(25).lean(),
      Invoice.find({ matterId: String(id) }).sort({ createdAt: -1 }).limit(25).lean(),
      Note.find({ caseId: String(id) }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    const items: ActivityItem[] = [];

    for (const a of audits || []) {
      items.push({
        kind: 'audit',
        at: new Date(a.createdAt).toISOString(),
        title: a.message || a.action || 'Audit event',
        detail: a.action,
        actorEmail: a.actorEmail,
      });
    }

    for (const d of docs || []) {
      items.push({
        kind: 'document',
        at: new Date(d.createdAt).toISOString(),
        title: `Document: ${d.title || d.documentNumber || 'Untitled'}`,
        detail: `${d.status || ''} ${d.type || ''}`.trim(),
        href: `/documents/${d._id}`,
      });
    }

    for (const dl of deadlines || []) {
      items.push({
        kind: 'deadline',
        at: new Date(dl.dueDate || dl.createdAt).toISOString(),
        title: `Deadline: ${dl.title || 'Untitled'}`,
        detail: dl.dueDate ? `Due ${new Date(dl.dueDate).toLocaleDateString()}` : undefined,
        href: `/deadlines/${dl._id}`,
      });
    }

    for (const h of hearings || []) {
      items.push({
        kind: 'hearing',
        at: new Date(h.hearingDate || h.createdAt).toISOString(),
        title: `Hearing: ${h.hearingType || 'Hearing'}${h.courtName ? ` — ${h.courtName}` : ''}`,
        detail: h.hearingDate ? new Date(h.hearingDate).toLocaleDateString() : undefined,
        href: `/hearings/${h._id}`,
      });
    }

    for (const t of tasks || []) {
      items.push({
        kind: 'task',
        at: new Date(t.dueDate || t.createdAt).toISOString(),
        title: `Task: ${t.title || 'Untitled'}`,
        detail: `${t.status || ''}${t.priority ? ` • ${t.priority}` : ''}`.trim(),
        href: `/tasks/${t._id}`,
      });
    }

    for (const inv of invoices || []) {
      items.push({
        kind: 'invoice',
        at: new Date(inv.createdAt).toISOString(),
        title: `Invoice: ${inv.invoiceNumber || 'Invoice'}`,
        detail: `${inv.status || ''} • ${(inv.total ?? '').toString()}`.trim(),
        href: `/billing/invoices/${inv._id}`,
      });
    }

    for (const n of notes || []) {
      const excerpt = String(n.content || '').slice(0, 160);
      items.push({
        kind: 'note',
        at: new Date(n.createdAt).toISOString(),
        title: `Note: ${n.title || 'Note'}`,
        detail: excerpt,
      });
    }

    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return NextResponse.json({ events: items.slice(0, 200) });
  } catch (error) {
    console.error('Case activity fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

