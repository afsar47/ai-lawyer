import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '../../../../lib/mongodb';
import LabTest from '../../../../models/LabTest';

// GET - Get a single lab test
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const labTest = await LabTest.findById(id).lean();

    if (!labTest) {
      return NextResponse.json({ error: 'Lab test not found' }, { status: 404 });
    }

    return NextResponse.json({ labTest });
  } catch (error) {
    console.error('Error fetching lab test:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab test' },
      { status: 500 }
    );
  }
}

// PUT - Update a lab test
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const body = await request.json();

    // If status is being changed to completed, set completedAt
    if (body.status === 'completed' && !body.completedAt) {
      body.completedAt = new Date();
    }

    // Check if any result is critical
    if (body.results && body.results.length > 0) {
      const hasCritical = body.results.some((r: any) => r.status === 'critical');
      body.isCritical = hasCritical;
    }

    const labTest = await LabTest.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean();

    if (!labTest) {
      return NextResponse.json({ error: 'Lab test not found' }, { status: 404 });
    }

    return NextResponse.json({ labTest });
  } catch (error: any) {
    console.error('Error updating lab test:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update lab test' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a lab test
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const labTest = await LabTest.findByIdAndDelete(id);

    if (!labTest) {
      return NextResponse.json({ error: 'Lab test not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lab test deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab test:', error);
    return NextResponse.json(
      { error: 'Failed to delete lab test' },
      { status: 500 }
    );
  }
}
