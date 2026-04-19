import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Case from '@/models/Case';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const emailsParam = (searchParams.get('emails') || '').trim();
    const emails = emailsParam
      ? emailsParam
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const match: any = { status: { $ne: 'closed' }, assignedLawyerEmail: { $type: 'string', $ne: '' } };
    if (emails.length) match.assignedLawyerEmail = { $in: emails };

    const rows = await Case.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$assignedLawyerEmail',
          openCount: { $sum: 1 },
        },
      },
    ]);

    const counts: Record<string, number> = {};
    for (const r of rows) {
      if (r?._id) counts[String(r._id).toLowerCase()] = Number(r.openCount) || 0;
    }

    return NextResponse.json({ counts });
  } catch (error) {
    console.error('Workload fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

